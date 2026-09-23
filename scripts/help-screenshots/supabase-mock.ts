/**
 * Stand-in for src/lib/supabase.ts, used only by the help-screenshot build.
 *
 * The real app runs unchanged: routes, layout, hooks and components are the
 * production code. Only the database client is replaced, so every page renders
 * fictional demo data from fixtures.ts, with no network, no login and nothing
 * written anywhere.
 *
 * Reads return the stored rows, which already carry their nested relations, so
 * a select string like "*, template_tasks(*)" needs no parsing. Filters that
 * matter for picking rows (eq, neq, in, is) are applied; everything else is
 * accepted and ignored. Writes succeed and change nothing.
 */

import { DB, userFor } from "./fixtures";

/**
 * The demo user has accepted the terms, so screenshots show the application
 * rather than the acceptance gate. Set to false to capture the gate itself.
 */
const DEMO_LEGAL_ACCEPTED = true;

type Row = Record<string, unknown>;
type Result = { data: unknown; error: null; count?: number };

function query(table: string) {
  let rows: Row[] = [...((DB[table] as Row[] | undefined) ?? [])];
  let mode: "many" | "single" | "maybe" = "many";
  let head = false;

  const api: Record<string, unknown> = {
    select(_cols?: string, opts?: { head?: boolean }) {
      if (opts?.head) head = true;
      return proxy;
    },
    eq(col: string, val: unknown) {
      rows = rows.filter((r) => r[col] === val);
      return proxy;
    },
    neq(col: string, val: unknown) {
      rows = rows.filter((r) => r[col] !== val);
      return proxy;
    },
    in(col: string, vals: unknown[]) {
      rows = rows.filter((r) => vals.includes(r[col]));
      return proxy;
    },
    is(col: string, val: unknown) {
      rows = rows.filter((r) => (r[col] ?? null) === val);
      return proxy;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      const dir = opts?.ascending === false ? -1 : 1;
      rows.sort((a, b) => {
        const x = a[col] as string | number | null;
        const y = b[col] as string | number | null;
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return (x < y ? -1 : 1) * dir;
      });
      return proxy;
    },
    limit(n: number) {
      rows = rows.slice(0, n);
      return proxy;
    },
    single() {
      mode = "single";
      return proxy;
    },
    maybeSingle() {
      mode = "maybe";
      return proxy;
    },
    then(resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) {
      const data = mode === "many" ? rows : (rows[0] ?? null);
      const result: Result = { data: head ? null : data, error: null, count: rows.length };
      return Promise.resolve(result).then(resolve, reject);
    },
  };

  // Any method not listed above (insert, update, gte, or, ilike...) is a
  // no-op that keeps the chain going.
  const proxy: unknown = new Proxy(api, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return () => proxy;
    },
  });
  return proxy;
}

const user = userFor(new URLSearchParams(window.location.search).get("as"));
const session = {
  access_token: "demo",
  refresh_token: "demo",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
};

const channel = {
  on: () => channel,
  subscribe: (cb?: (status: string) => void) => {
    cb?.("SUBSCRIBED");
    return channel;
  },
  unsubscribe: async () => "ok",
  send: async () => "ok",
  track: async () => "ok",
  presenceState: () => ({}),
};

export const supabase = {
  from: (table: string) => query(table),
  // Named, because some RPCs decide whether the application renders at all.
  // has_accepted_legal returning null would leave the demo un-gated only by
  // the accident that the gate tests for false rather than for falsy.
  rpc: (name: string) =>
    Promise.resolve({
      data: name === "has_accepted_legal" ? DEMO_LEGAL_ACCEPTED : null,
      error: null,
    }),
  channel: () => channel,
  removeChannel: async () => "ok",
  getChannels: () => [],
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    onAuthStateChange: (cb: (event: string, s: unknown) => void) => {
      setTimeout(() => cb("SIGNED_IN", session), 0);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user }, error: null }),
  },
  storage: {
    from: () => ({
      createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
      createSignedUrls: async () => ({ data: [], error: null }),
      upload: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
};

export function setParticipantCodes() {}
export function clearParticipantCodes() {}
