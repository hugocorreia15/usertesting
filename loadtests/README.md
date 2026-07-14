# Load tests

[k6](https://k6.io) scenarios that stress Avalux's Supabase backend with
many simultaneous users. Every scenario replays the **exact request
sequences the real client sends** (same tables, same PostgREST
selects, same RPCs, anon key for participants, JWT for evaluators), so
the numbers reflect what real concurrent usage would do.

## Install k6

```bash
# Linux (Debian/Ubuntu)
sudo gpg -k && sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# or grab a standalone binary — no root needed:
curl -sL "$(curl -s https://api.github.com/repos/grafana/k6/releases/latest \
  | grep -o 'https://[^\"]*linux-amd64.tar.gz' | head -1)" \
  | tar xz --strip-components=1 -C ~/.local/bin --wildcards '*/k6'
```

## Setup

1. **Seed synthetic data**: paste `loadtests/seed.sql` into the Supabase
   SQL editor and run it. It creates a `[LOADTEST]` template (3 tasks,
   one of them a practice task), and two shared invitation codes:
   `loadtest1` (uncapped) and `loadspike1` (capped at 25 responses).
2. **Credentials**: the scripts auto-read `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` from the repo's `.env.local`; override with
   `-e SUPABASE_URL=… -e SUPABASE_ANON_KEY=…` to point elsewhere.

Between runs use `reset.sql` (clears synthetic sessions, re-arms both
codes); when finished, `cleanup.sql` removes everything. All synthetic
rows are namespaced (`[LOADTEST]` template, `LT-` participants), so
real study data is never touched — but see the safety notes below.

## Scenarios

### 1. `participant-journey.js` — concurrent full sessions

The headline "multiple users at the same time" test. Each virtual user
is one participant: resolve the shared link → join (participant +
session + task_results/interview skeletons + atomic consume) → fetch
the live session → complete every task's questions with human think
times → interview answers → the 10-item SUS.

```bash
npm run loadtest:journey            # 15 VUs, 2m plateau
k6 run -e VUS=30 -e PLATEAU=5m loadtests/scenarios/participant-journey.js
```

Thresholds: <2% failed requests, p95 request <1.2 s, p95 whole join
flow <6 s, >99% checks passing.

### 2. `join-spike.js` — atomicity under a simultaneous burst

Every VU joins the **same capacity-limited invitation at the same
instant** — the exact race that motivated the `consume_invitation`
SECURITY DEFINER RPC (migration 035). Hard threshold: accepted joins
must never exceed `max_responses` (25); one oversubscription fails the
run. Run `reset.sql` between spikes (the code deactivates at cap).

```bash
npm run loadtest:spike
k6 run -e SPIKE_VUS=60 loadtests/scenarios/join-spike.js
```

### 3. `dashboard-reads.js` — concurrent evaluators

Authenticated evaluators browsing the heaviest reads in the app:
templates with all relations, session lists with nested
task_results/logs/answers, and the analytics aggregation query.
Needs evaluator credentials (a dedicated test account is fine):

```bash
k6 run -e DASHBOARD_EMAIL=you@example.com -e DASHBOARD_PASSWORD=… \
  loadtests/scenarios/dashboard-reads.js
```

### 4. `realtime-subscribe.js` — concurrent live-session WebSockets

Every live session holds one Realtime WebSocket with two
postgres_changes subscriptions. This opens N at once (default 50),
holds them with Phoenix heartbeats, and measures time-to-subscribed
and connection stability. Realtime connections are a hard quota on
Supabase plans — this finds your ceiling for simultaneous live
sessions.

```bash
npm run loadtest:realtime
k6 run -e RT_VUS=100 -e RT_HOLD=60 loadtests/scenarios/realtime-subscribe.js
```

## Reading results

k6 prints a summary at the end: per-endpoint latency (each request is
tagged with a readable `name`), threshold pass/fail (✓/✗), and the
custom metrics (`join_flow_duration`, `join_accepted`,
`realtime_time_to_subscribed`). A run **exits non-zero when any
threshold fails**, so these can gate CI if ever needed. For dashboards,
stream results to InfluxDB/Grafana with `k6 run --out …`.

## Safety notes

- **This hits the production Supabase project** (whatever `.env.local`
  points at). The free tier shares CPU/connection quotas — a big run
  can degrade the live app while it executes and may trip rate limits.
  Prefer off-hours, start small (the defaults are modest), or point the
  scripts at a local `supabase start` stack.
- The journey/spike scenarios **write real rows** (that's the point).
  They are all namespaced and `cleanup.sql` removes every one of them;
  never report load-test sessions as study data.
- Realtime scenario: 100+ concurrent sockets can exhaust the plan's
  Realtime connection quota for the duration of the run — real
  participants would be unable to connect while it holds.
