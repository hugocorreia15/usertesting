// Full participant journey under load: N concurrent participants open a
// shared invitation link, join (participant + session + skeletons +
// atomic consume), then work through the session — answering task
// questions, the interview, and SUS — with human think times.
//
// Mirrors the exact request sequence of useJoinSession
// (src/hooks/use-invitations.ts) and the participant live hooks
// (src/hooks/use-participant-sessions.ts), using only the anon key,
// exactly like a real unauthenticated participant's browser.
//
//   k6 run loadtests/scenarios/participant-journey.js
//   k6 run -e VUS=30 -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... ...

import { sleep, group, check, fail } from "k6";
import { Trend, Counter } from "k6/metrics";
import * as api from "../lib/api.js";
import { INVITE_CODE, randomSuffix, thinkTime } from "../lib/config.js";

const VUS = Number(__ENV.VUS || 15);
const PLATEAU = __ENV.PLATEAU || "2m";

const joinFlowDuration = new Trend("join_flow_duration", true);
const sessionsCreated = new Counter("sessions_created");

export const options = {
  scenarios: {
    journey: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: VUS },
        { duration: PLATEAU, target: VUS },
        { duration: "15s", target: 0 },
      ],
      gracefulStop: "60s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200"],
    join_flow_duration: ["p(95)<6000"],
    checks: ["rate>0.99"],
  },
};

// Same pinning + strategies as src/lib/task-order.ts orderSessionTasks
function orderSessionTasks(tasks, strategy, rotationIndex) {
  const practice = tasks.filter((t) => t.is_practice).map((t) => t.id);
  const measured = tasks.filter((t) => !t.is_practice).map((t) => t.id);
  if (strategy === "shuffled") {
    for (let i = measured.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [measured[i], measured[j]] = [measured[j], measured[i]];
    }
  } else if (strategy === "latin_square" && measured.length > 0) {
    const n = measured.length;
    const shift = ((rotationIndex % n) + n) % n;
    const rotated = measured.slice(shift).concat(measured.slice(0, shift));
    return practice.concat(rotated);
  }
  return practice.concat(measured);
}

export default function () {
  // ── The join page: resolve the invitation ──
  let invitation;
  group("resolve invitation", () => {
    const rows = api.select(
      `session_invitations?code=eq.${INVITE_CODE}&is_active=eq.true` +
        `&select=*,templates(*,template_tasks(*),template_participant_fields(*))`,
      "GET invitation by code",
    );
    invitation = rows[0];
    if (!invitation) {
      fail(
        `invitation '${INVITE_CODE}' not found — run loadtests/seed.sql in the Supabase SQL editor first`,
      );
    }
  });

  sleep(thinkTime(1, 3)); // reading the welcome form

  // ── useJoinSession: 6 writes + 2 reads, then atomic consume ──
  let session;
  let liveTaskIds;
  group("join session", () => {
    const t0 = Date.now();

    const participant = api.insertOne(
      "participants",
      {
        name: `LT-${__VU}-${__ITER}-${randomSuffix()}`,
        occupation: "Load test bot",
        tech_proficiency: "medium",
        user_id: invitation.user_id,
        is_anonymous: false,
      },
      "POST participant",
    );

    session = api.insertOne(
      "test_sessions",
      {
        template_id: invitation.template_id,
        participant_id: participant.id,
        evaluator_name: invitation.evaluator_name,
        user_id: invitation.user_id,
        status: "planned",
        join_code: randomSuffix(),
        task_order_strategy: invitation.task_order_strategy ?? "fixed",
      },
      "POST test_session",
    );

    const taskFlags = api.select(
      `template_tasks?select=id,is_practice&id=in.(${invitation.selected_task_ids.join(",")})`,
      "GET task practice flags",
    );
    const orderedIds = orderSessionTasks(
      taskFlags,
      invitation.task_order_strategy ?? "fixed",
      invitation.response_count,
    );
    liveTaskIds = orderedIds;
    api.insertMany(
      "task_results",
      orderedIds.map((taskId, index) => ({
        session_id: session.id,
        task_id: taskId,
        sort_order: index,
      })),
      "POST task_results skeleton",
    );

    const questions = api.select(
      `template_questions?select=id&template_id=eq.${invitation.template_id}&order=sort_order`,
      "GET template questions",
    );
    if (questions.length > 0) {
      api.insertMany(
        "interview_answers",
        questions.map((q) => ({ session_id: session.id, question_id: q.id })),
        "POST interview skeleton",
      );
    }

    const consumed = api.rpc(
      "consume_invitation",
      { invitation_code: invitation.code },
      "RPC consume_invitation",
    );
    check(consumed, { "invitation consumed": (c) => c === true });

    joinFlowDuration.add(Date.now() - t0);
    sessionsCreated.add(1);
  });

  // ── Participant live view: static definitions once + light live ──
  // (mirrors the P3.5 split: the heavy 4-level select is gone from the
  // per-tick path)
  let live;
  group("fetch live session", () => {
    const staticRows = api.select(
      `test_sessions?id=eq.${session.id}&select=` +
        `id,templates(instruments,template_questions(id,question_text,sort_order)),` +
        `task_results(id,template_tasks(id,name,description,task_questions(*)))`,
      "GET participant static",
    );
    const liveRows = api.select(
      `test_sessions?id=eq.${session.id}&select=` +
        `id,status,user_id,join_code,template_id,current_task_index,` +
        `instrument_answers(id,instrument,item_number,score),` +
        `task_results(id,sort_order,seq_rating,completion_status,task_question_answers(*)),` +
        `interview_answers(id,question_id,answer_text),` +
        `sus_answers(id,question_number,score)`,
      "GET participant live",
    );
    // merge like the client does
    const defs = {};
    for (const tr of staticRows[0].task_results) defs[tr.id] = tr.template_tasks;
    live = liveRows[0];
    live.templates = staticRows[0].templates;
    for (const tr of live.task_results) tr.template_tasks = defs[tr.id];
    check(live, {
      "session has all tasks": (l) =>
        l && l.task_results.length === liveTaskIds.length,
    });
  });

  // ── Do the tasks: answer each task's questions ──
  group("answer task questions", () => {
    const ordered = [...live.task_results].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    for (const tr of ordered) {
      sleep(thinkTime(2, 5)); // "performing" the task
      for (const q of tr.template_tasks.task_questions) {
        const answer = {
          task_result_id: tr.id,
          question_id: q.id,
          answer_text:
            q.question_type === "open" ? "Synthetic load-test answer." : null,
          selected_options: null,
          rating_value:
            q.question_type === "rating" ? 1 + Math.floor(Math.random() * (q.rating_max ?? 5)) : null,
          media_url: null,
        };
        api.upsert(
          "task_question_answers",
          "task_result_id,question_id",
          answer,
          "UPSERT task answer",
        );
      }
    }
  });

  // ── Interview ──
  group("interview answers", () => {
    for (const q of live.templates.template_questions) {
      sleep(thinkTime(1, 3));
      const updated = api.update(
        `interview_answers?session_id=eq.${session.id}&question_id=eq.${q.id}&select=id`,
        { answer_text: "Synthetic interview answer." },
        "PATCH interview answer",
      );
      check(updated, { "interview row updated": (u) => u.length === 1 });
    }
  });

  // ── SUS questionnaire ──
  group("submit SUS", () => {
    sleep(thinkTime(2, 4));
    api.insertMany(
      "sus_answers",
      Array.from({ length: 10 }, (_, i) => ({
        session_id: session.id,
        question_number: i + 1,
        score: 1 + Math.floor(Math.random() * 5),
      })),
      "POST sus_answers",
    );
  });

  sleep(thinkTime(0.5, 1.5));
}
