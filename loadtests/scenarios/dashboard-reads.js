// Evaluator dashboard under concurrent read load: N authenticated
// evaluators browsing templates, session lists with full relations, and
// the analytics aggregation query — the heaviest reads in the app
// (mirrors use-templates, use-sessions, use-analytics selects).
//
// Requires evaluator credentials (a dedicated test account is fine):
//   k6 run -e DASHBOARD_EMAIL=... -e DASHBOARD_PASSWORD=... \
//     loadtests/scenarios/dashboard-reads.js

import http from "k6/http";
import { sleep, group, check, fail } from "k6";
import * as api from "../lib/api.js";
import { AUTH, ANON_KEY, thinkTime } from "../lib/config.js";

const DASH_VUS = Number(__ENV.DASH_VUS || 10);
const DURATION = __ENV.DURATION || "1m";

export const options = {
  scenarios: {
    dashboard: {
      executor: "constant-vus",
      vus: DASH_VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    // Nested-relation selects are heavier than the join-flow writes
    http_req_duration: ["p(95)<1500"],
    checks: ["rate>0.99"],
  },
};

export function setup() {
  const email = __ENV.DASHBOARD_EMAIL;
  const password = __ENV.DASHBOARD_PASSWORD;
  if (!email || !password) {
    fail(
      "Set DASHBOARD_EMAIL and DASHBOARD_PASSWORD (an evaluator account) to run this scenario",
    );
  }
  const res = http.post(
    `${AUTH}/token?grant_type=password`,
    JSON.stringify({ email, password }),
    {
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      tags: { name: "POST auth token" },
    },
  );
  check(res, { "login 200": (r) => r.status === 200 }) ||
    fail(`login failed: ${res.status} ${res.body}`);
  return { token: res.json().access_token };
}

export default function (data) {
  const token = data.token;
  let templates;

  group("templates list", () => {
    templates = api.select(
      "templates?select=*,template_tasks(*),template_questions(*)," +
        "template_error_types(*),template_participant_fields(*)" +
        "&order=created_at.desc",
      "GET templates list",
      token,
    );
    check(templates, { "templates returned": (t) => Array.isArray(t) });
  });

  sleep(thinkTime(1, 3));

  group("sessions list", () => {
    const sessions = api.select(
      "test_sessions?select=*,templates(*),participants(*)," +
        "task_results(*,template_tasks(*),error_logs(*),hesitation_logs(*))," +
        "interview_answers(*),sus_answers(*)" +
        "&order=created_at.desc&limit=25",
      "GET sessions list",
      token,
    );
    check(sessions, { "sessions returned": (s) => Array.isArray(s) });
  });

  sleep(thinkTime(1, 3));

  group("analytics", () => {
    if (!templates || templates.length === 0) return;
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    api.select(
      `templates?id=eq.${tpl.id}&select=*,template_tasks(*),template_error_types(*),template_questions(*)`,
      "GET analytics template",
      token,
    );
    api.select(
      `test_sessions?template_id=eq.${tpl.id}&status=eq.completed&select=` +
        "*,templates(*),participants(*)," +
        "task_results(*,template_tasks(*),error_logs(*),hesitation_logs(*))," +
        "interview_answers(*),sus_answers(*)",
      "GET analytics sessions",
      token,
    );
  });

  sleep(thinkTime(2, 5));
}
