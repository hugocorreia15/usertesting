/**
 * Avalux auto-instrumentation snippet (P2.5).
 *
 * Embed in the system under test to stream click / keydown / navigation
 * events into a running Avalux session, keyed by the session join code:
 *
 *   <script src="https://avalux.pt/avalux-instrument.js" defer
 *     data-supabase-url="https://<project>.supabase.co"
 *     data-anon-key="<anon key>"
 *     data-join-code="<session join code>"></script>
 *
 * Privacy: never records typed text — printable keys are logged as
 * "char"; clicks record an element descriptor (tag#id.class), never
 * content. Events are accepted server-side only while the session is
 * in progress (RLS, migration 040). Batched every 2 s; the final batch
 * is flushed with sendBeacon when the page hides.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var baseUrl = (script.getAttribute("data-supabase-url") || "").replace(/\/+$/, "");
  var anonKey = script.getAttribute("data-anon-key") || "";
  var joinCode = script.getAttribute("data-join-code") || "";
  if (!baseUrl || !anonKey || !joinCode) {
    console.warn("[avalux] missing data-supabase-url / data-anon-key / data-join-code");
    return;
  }

  var restUrl = baseUrl + "/rest/v1";
  var sessionId = null;
  var buffer = [];
  var FLUSH_MS = 2000;
  var MAX_DETAIL = 120;

  function headers() {
    return {
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
  }

  function describeElement(el) {
    if (!el || !el.tagName) return null;
    var d = el.tagName.toLowerCase();
    if (el.id) d += "#" + el.id;
    else if (el.className && typeof el.className === "string") {
      var cls = el.className.trim().split(/\s+/).slice(0, 2).join(".");
      if (cls) d += "." + cls;
    }
    return d.slice(0, MAX_DETAIL);
  }

  function record(type, detail) {
    if (!sessionId) return;
    buffer.push({
      session_id: sessionId,
      event_type: type,
      occurred_at: new Date().toISOString(),
      path: location.pathname + location.hash,
      detail: detail ? String(detail).slice(0, MAX_DETAIL) : null,
    });
  }

  function flush(useBeacon) {
    if (!buffer.length || !sessionId) return;
    var batch = buffer.splice(0, buffer.length);
    var body = JSON.stringify(batch);
    if (useBeacon && navigator.sendBeacon) {
      // sendBeacon cannot set headers; fall back to keepalive fetch
      fetch(restUrl + "/auto_events", {
        method: "POST",
        headers: headers(),
        body: body,
        keepalive: true,
      }).catch(function () {});
      return;
    }
    fetch(restUrl + "/auto_events", {
      method: "POST",
      headers: headers(),
      body: body,
    }).catch(function () {
      // put the batch back once on failure; drop on repeat to avoid
      // unbounded growth in offline pages
      if (buffer.length < 500) buffer = batch.concat(buffer);
    });
  }

  function start() {
    document.addEventListener(
      "click",
      function (e) {
        record("click", describeElement(e.target));
      },
      true,
    );
    document.addEventListener(
      "keydown",
      function (e) {
        // never log typed characters
        var key = e.key && e.key.length === 1 ? "char" : e.key;
        record("keydown", key);
      },
      true,
    );
    window.addEventListener("popstate", function () {
      record("navigation", location.href);
    });
    window.addEventListener("hashchange", function () {
      record("navigation", location.href);
    });
    ["pushState", "replaceState"].forEach(function (fn) {
      var orig = history[fn];
      history[fn] = function () {
        var out = orig.apply(this, arguments);
        record("navigation", location.href);
        return out;
      };
    });
    record("navigation", location.href); // initial pageview

    setInterval(flush, FLUSH_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush(true);
    });
  }

  // Resolve the join code to a session id (anon-readable by RLS)
  fetch(
    restUrl +
      "/test_sessions?join_code=eq." +
      encodeURIComponent(joinCode) +
      "&select=id,status",
    { headers: headers() },
  )
    .then(function (r) {
      return r.json();
    })
    .then(function (rows) {
      if (rows && rows.length > 0) {
        sessionId = rows[0].id;
        start();
        console.info("[avalux] instrumentation active for session", sessionId);
      } else {
        console.warn("[avalux] no session found for join code", joinCode);
      }
    })
    .catch(function (e) {
      console.warn("[avalux] failed to resolve session", e);
    });
})();
