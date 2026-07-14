// Concurrent Supabase Realtime subscriptions: every live session holds
// one WebSocket with two postgres_changes subscriptions (test_sessions
// UPDATE + task_results UPDATE — see useParticipantLiveSession). This
// scenario opens N such connections at once and holds them, measuring
// time-to-subscribed and connection stability. Realtime connection
// slots are a hard quota on Supabase plans, so this finds the practical
// ceiling for simultaneous live sessions.
//
//   k6 run loadtests/scenarios/realtime-subscribe.js
//   k6 run -e RT_VUS=100 -e RT_HOLD=60 loadtests/scenarios/realtime-subscribe.js

import ws from "k6/ws";
import { check } from "k6";
import { Trend, Rate } from "k6/metrics";
import { SUPABASE_URL, ANON_KEY, uuidv4 } from "../lib/config.js";

const RT_VUS = Number(__ENV.RT_VUS || 50);
const RT_HOLD = Number(__ENV.RT_HOLD || 45); // seconds per connection

const timeToSubscribed = new Trend("realtime_time_to_subscribed", true);
const subscribeSuccess = new Rate("realtime_subscribe_success");

export const options = {
  scenarios: {
    realtime: {
      executor: "per-vu-iterations",
      vus: RT_VUS,
      iterations: 1,
      maxDuration: `${RT_HOLD + 60}s`,
    },
  },
  thresholds: {
    realtime_subscribe_success: ["rate>0.99"],
    realtime_time_to_subscribed: ["p(95)<2000"],
  },
};

export default function () {
  const url =
    SUPABASE_URL.replace(/^http/, "ws") +
    `/realtime/v1/websocket?apikey=${ANON_KEY}&vsn=1.0.0`;

  // Same channel shape the participant view opens; the filter UUID does
  // not need to exist — subscription setup cost is what we measure.
  const sessionId = uuidv4();
  const topic = `realtime:participant-${sessionId}`;

  const res = ws.connect(url, { tags: { name: "realtime ws" } }, (socket) => {
    let t0;
    let refCounter = 1;

    socket.on("open", () => {
      t0 = Date.now();
      socket.send(
        JSON.stringify({
          topic,
          event: "phx_join",
          payload: {
            config: {
              broadcast: { ack: false, self: false },
              presence: { key: "" },
              postgres_changes: [
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "test_sessions",
                  filter: `id=eq.${sessionId}`,
                },
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "task_results",
                  filter: `session_id=eq.${sessionId}`,
                },
              ],
            },
            access_token: ANON_KEY,
          },
          ref: "1",
          join_ref: "1",
        }),
      );
    });

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (_e) {
        return;
      }
      if (msg.event === "phx_reply" && msg.ref === "1") {
        const ok = msg.payload && msg.payload.status === "ok";
        subscribeSuccess.add(ok);
        if (ok) timeToSubscribed.add(Date.now() - t0);
        check(msg, { "channel join ok": () => ok });
      }
    });

    socket.on("error", (e) => {
      subscribeSuccess.add(false);
      console.error(`ws error: ${e.error()}`);
    });

    // Phoenix heartbeat, same cadence as supabase-js
    socket.setInterval(() => {
      refCounter += 1;
      socket.send(
        JSON.stringify({
          topic: "phoenix",
          event: "heartbeat",
          payload: {},
          ref: String(refCounter),
        }),
      );
    }, 25000);

    socket.setTimeout(() => socket.close(), RT_HOLD * 1000);
  });

  check(res, { "ws handshake 101": (r) => r && r.status === 101 });
}
