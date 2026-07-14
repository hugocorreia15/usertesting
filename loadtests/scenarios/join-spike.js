// Concurrency-correctness spike: every VU tries to join the SAME
// capacity-limited invitation at the same instant. This is the exact
// race that motivated migration 035 (atomic consume_invitation): with
// the old client-side read-modify-write, simultaneous joiners could
// oversubscribe a max_responses cap.
//
// The invariant under test: accepted joins NEVER exceed max_responses,
// no matter how many arrive at once. Enforced as a hard threshold on
// the join_accepted counter, so an oversubscription fails the run.
//
// Requires the 'loadspike1' invitation from loadtests/seed.sql
// (max_responses = 25). consume_invitation deactivates the code when
// the cap is hit, so run loadtests/reset.sql between spike runs.
//
//   k6 run loadtests/scenarios/join-spike.js
//   k6 run -e SPIKE_VUS=60 -e SPIKE_MAX=25 loadtests/scenarios/join-spike.js

import { group, fail } from "k6";
import { Counter } from "k6/metrics";
import * as api from "../lib/api.js";
import { SPIKE_CODE, randomSuffix } from "../lib/config.js";

const SPIKE_VUS = Number(__ENV.SPIKE_VUS || 40);
// Must match max_responses on the seeded invitation
const SPIKE_MAX = Number(__ENV.SPIKE_MAX || 25);

const accepted = new Counter("join_accepted");
const rejected = new Counter("join_rejected");

export const options = {
  scenarios: {
    spike: {
      executor: "per-vu-iterations",
      vus: SPIKE_VUS,
      iterations: 1,
      maxDuration: "2m",
    },
  },
  thresholds: {
    // The atomicity invariant — a single oversubscribed join fails the run
    join_accepted: [`count<=${SPIKE_MAX}`],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // All VUs read the invitation while it is still active…
  const rows = api.select(
    `session_invitations?code=eq.${SPIKE_CODE}&is_active=eq.true&select=*`,
    "GET spike invitation",
  );
  const invitation = rows[0];
  if (!invitation) {
    // Cap already reached by faster VUs (or seed/reset not run — the
    // summary makes it obvious: 0 accepted means re-seed).
    rejected.add(1);
    return;
  }

  // …then all of them join at once, mirroring useJoinSession.
  group("concurrent join", () => {
    const participant = api.insertOne(
      "participants",
      {
        name: `LT-spike-${__VU}-${randomSuffix()}`,
        occupation: "Load test bot",
        tech_proficiency: "medium",
        user_id: invitation.user_id,
        is_anonymous: false,
      },
      "POST participant",
    );

    const session = api.insertOne(
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

    api.insertMany(
      "task_results",
      invitation.selected_task_ids.map((taskId, index) => ({
        session_id: session.id,
        task_id: taskId,
        sort_order: index,
      })),
      "POST task_results skeleton",
    );

    // The atomic gate: returns true when a slot was claimed, null when
    // the cap was hit first (the app surfaces that as "link is full").
    const consumed = api.rpc(
      "consume_invitation",
      { invitation_code: SPIKE_CODE },
      "RPC consume_invitation",
    );
    if (consumed === true) {
      accepted.add(1);
    } else {
      rejected.add(1);
    }
  });
}

export function teardown() {
  console.log(
    `Spike done. Check the summary: join_accepted must be <= ${SPIKE_MAX} ` +
      `(threshold-enforced). Run loadtests/reset.sql before the next spike run.`,
  );
}
