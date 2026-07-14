// Shared config for all k6 scenarios. Resolution order for credentials:
// explicit env vars first, then the repo's .env.local (the same
// VITE_-prefixed values the app uses). open() paths are relative to the
// main script, which lives in loadtests/scenarios/.

function fromDotenv(name) {
  try {
    const text = open("../../.env.local");
    for (const line of text.split("\n")) {
      if (line.startsWith(`${name}=`)) {
        return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (_e) {
    // .env.local absent — env vars are then required
  }
  return undefined;
}

export const SUPABASE_URL = (
  __ENV.SUPABASE_URL ||
  fromDotenv("VITE_SUPABASE_URL") ||
  ""
).replace(/\/+$/, "");

export const ANON_KEY =
  __ENV.SUPABASE_ANON_KEY || fromDotenv("VITE_SUPABASE_ANON_KEY") || "";

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    "Missing SUPABASE_URL / SUPABASE_ANON_KEY (set env vars or fill .env.local)",
  );
}

export const REST = `${SUPABASE_URL}/rest/v1`;
export const AUTH = `${SUPABASE_URL}/auth/v1`;

// Invitation codes created by loadtests/seed.sql
export const INVITE_CODE = __ENV.INVITE_CODE || "loadtest1";
export const SPIKE_CODE = __ENV.SPIKE_CODE || "loadspike1";

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Uniform random think time, seconds
export function thinkTime(min, max) {
  return min + Math.random() * (max - min);
}
