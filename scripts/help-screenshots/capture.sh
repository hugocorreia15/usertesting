#!/usr/bin/env bash
# Capture help-page screenshots from the demo build.
#
#   bash scripts/help-screenshots/capture.sh            # every shot
#   bash scripts/help-screenshots/capture.sh 21 22      # only these
#
# Starts the demo build (real app, stubbed database, fictional data), drives it
# with agent-browser at the same 1440x900 viewport as the existing help images,
# writes public/help/NN-name.png, and stops the server it started.
#
# `?as=<name>` picks which fictional user is signed in; see fixtures.ts.

set -euo pipefail
cd "$(dirname "$0")/../.."

PORT=5198
BASE="http://localhost:$PORT"
OUT="public/help"
AB="agent-browser --session help-shots"
LOG="$(mktemp)"

started_server=false
if ! curl -s -o /dev/null --max-time 2 "$BASE/"; then
  npx vite --config scripts/help-screenshots/vite.config.ts >"$LOG" 2>&1 &
  SERVER_PID=$!
  started_server=true
  for _ in $(seq 1 60); do
    curl -s -o /dev/null --max-time 2 "$BASE/" && break
    sleep 1
  done
fi

cleanup() {
  $AB close >/dev/null 2>&1 || true
  if $started_server; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -f "$LOG"
}
trap cleanup EXIT

$AB set viewport 1440 900 >/dev/null

# open PATH, wait for TEXT to be on the page, let the page's entrance animation
# finish.
visit() {
  $AB open "$BASE$1" >/dev/null
  $AB wait --text "$2" >/dev/null
  $AB wait 1200 >/dev/null
}

# Scroll the app's main column so the element whose own text is TEXT sits
# OFFSET px below the top of that column, which starts under the fixed header.
scroll_to_text() {
  local text="$1" offset="${2:-80}"
  $AB eval "(() => {
    const main = document.querySelector('main');
    const el = [...document.querySelectorAll('h1,h2,h3,div,p,span,button,label')]
      .find(n => [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim() === '$text'));
    if (!main || !el) return 'not found: $text';
    main.scrollTop += el.getBoundingClientRect().top - main.getBoundingClientRect().top - $offset;
    return 'ok';
  })()"
  $AB wait 400 >/dev/null
}

shoot() {
  $AB screenshot "$OUT/$1" >/dev/null
  echo "  wrote $OUT/$1"
}

SHOTS=("$@")
want() {
  [ ${#SHOTS[@]} -eq 0 ] && return 0
  local n
  for n in "${SHOTS[@]}"; do [ "$n" = "$1" ] && return 0; done
  return 1
}

if want 17; then
  visit "/inspections/i2?as=bruno" "Your pass"
  # Just enough to show the Submit button without losing the page title.
  $AB eval "document.querySelector('main').scrollTop = 30" >/dev/null
  $AB wait 300 >/dev/null
  shoot 17-inspection-pass.png
fi

if want 18; then
  visit "/inspections/i1?as=bruno" "What the passes showed"
  scroll_to_text "What the passes showed" 16
  shoot 18-inspection-results.png
fi

if want 19; then
  visit "/templates/tpl-thermo?as=ana" "Instructor review"
  scroll_to_text "Heuristic inspection" 16
  shoot 19-instructor-review.png
fi

if want 20; then
  visit "/sessions/s1/corate?as=carla" "Independent scoring"
  shoot 20-corate.png
fi

if want 21; then
  visit "/sessions/s1?as=bruno" "What the session recorded"
  scroll_to_text "Reflection" 16
  shoot 21-reflection.png
fi

if want 22; then
  visit "/sessions/s1?as=bruno" "Anonymize"
  $AB find role button click --name "Anonymize" --exact >/dev/null
  $AB wait --text "Anonymize this participant?" >/dev/null
  $AB wait 500 >/dev/null
  shoot 22-anonymize.png
fi

if want 23; then
  visit "/organizations/org-hci?as=ana" "Class overview"
  scroll_to_text "Class overview" 16
  shoot 23-class-overview.png
fi

if want 24; then
  visit "/sessions/s1?as=bruno" "How the session was run"
  scroll_to_text "How the session was run" 16
  shoot 24-session-run.png
fi

if want 25; then
  visit "/inspections/i1?as=bruno" "After testing"
  scroll_to_text "After testing" 16
  shoot 25-after-testing.png
fi

if want 26; then
  visit "/templates/tpl-thermo?as=bruno" "Sessions"
  # The tab carries its count, and the sidebar has a button of the same name.
  $AB find role tab click --name "Sessions (3)" >/dev/null
  $AB wait --text "What these sessions point to" >/dev/null
  $AB wait 800 >/dev/null
  scroll_to_text "What these sessions point to" 16
  shoot 26-session-summary.png
fi
