// Thin PostgREST helpers over k6/http. Every request carries a `name`
// tag so per-endpoint latency shows up in the summary without exploding
// URL cardinality (PostgREST URLs embed UUIDs).

import http from "k6/http";
import { check, fail } from "k6";
import { REST, ANON_KEY } from "./config.js";

export function headers(extra, token) {
  return Object.assign(
    {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      "Content-Type": "application/json",
    },
    extra || {},
  );
}

function parse(res, name) {
  try {
    return res.json();
  } catch (_e) {
    fail(`${name}: non-JSON response (status ${res.status})`);
  }
}

// GET returning an array of rows
export function select(query, name, token) {
  const res = http.get(`${REST}/${query}`, {
    headers: headers({}, token),
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
  return parse(res, name);
}

// POST one row, returning the created row
export function insertOne(table, row, name, token) {
  const res = http.post(`${REST}/${table}`, JSON.stringify(row), {
    headers: headers({ Prefer: "return=representation" }, token),
    tags: { name },
  });
  check(res, { [`${name} 201`]: (r) => r.status === 201 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
  return parse(res, name)[0];
}

// POST many rows, no representation needed
export function insertMany(table, rows, name, token) {
  const res = http.post(`${REST}/${table}`, JSON.stringify(rows), {
    headers: headers({ Prefer: "return=minimal" }, token),
    tags: { name },
  });
  check(res, { [`${name} 201`]: (r) => r.status === 201 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
}

// POST upsert (mirrors supabase-js .upsert with onConflict)
export function upsert(table, onConflict, row, name, token) {
  const res = http.post(
    `${REST}/${table}?on_conflict=${onConflict}`,
    JSON.stringify(row),
    {
      headers: headers(
        { Prefer: "return=minimal,resolution=merge-duplicates" },
        token,
      ),
      tags: { name },
    },
  );
  check(res, { [`${name} ok`]: (r) => r.status === 201 || r.status === 200 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
}

// PATCH matching rows, returning them (mirrors .update().eq().select())
export function update(query, patch, name, token) {
  const res = http.patch(`${REST}/${query}`, JSON.stringify(patch), {
    headers: headers({ Prefer: "return=representation" }, token),
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
  return parse(res, name);
}

// POST /rpc/<fn>; returns the raw JSON result (may be null)
export function rpc(fn, args, name, token) {
  const res = http.post(`${REST}/rpc/${fn}`, JSON.stringify(args), {
    headers: headers({}, token),
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 }) ||
    fail(`${name}: ${res.status} ${res.body}`);
  return parse(res, name);
}
