# session-summary

Proposes the problems a study's sessions point to, by grouping observations
that describe the same thing across different sessions. The counterpart of
`inspection-suggest`: the same merge problem, with the evidence spread across
sessions instead of across evaluators.

## Deploy

```
supabase functions deploy session-summary
```

It shares `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` and `AI_JSON_MODE` with
`inspection-suggest`, so a project that already deployed that one needs no new
secrets.

## What it sends, in two tiers

**Tier A, always.** What the team wrote: observer notes, the moderator's
recorded corrections, and the titles of problems already entered, so the model
proposes only what is not yet covered.

**Tier B, only where consent allows.** What participants wrote, in task
question answers. A session contributes this only if
`sessions_with_participant_text_ai` returns it, which requires the study to
have turned participant text on and the session's own `consent_accepted_at` to
be at or after the moment it was turned on. A study that ran under the older
consent wording can therefore never be included, whatever is ticked afterwards.
Pilot sessions are excluded, as they are from every other study aggregate.

Sessions are numbered 1, 2, 3 in the prompt. No session id, participant name,
email or date is ever sent.

## What protects it

- It builds its Supabase client from the caller's own `Authorization` header
  and never from the service-role key.
- It refuses unless the organization opted in (`template_ai_enabled`).
- It refuses until the team has written at least one problem itself
  (`template_synthesis_started`). A summary is for what you might have missed,
  not a substitute for looking.
- The consent rule is decided in the database, not here. This function asks
  `sessions_with_participant_text_ai` and uses what it returns.
- It stores nothing. It returns the model's raw answer plus the ids it sent;
  the browser validates one against the other before a row is written.

## Checking it by hand

```
curl -X POST "$SUPABASE_URL/functions/v1/session-summary" \
  -H "Authorization: Bearer <a signed-in user's access token>" \
  -H "Content-Type: application/json" \
  -d '{"template_id":"<a study with sessions and at least one problem>"}'
```

Readable failures: 401 without a token, 403 when the organization has not
opted in, 409 before the team has written a problem or when there is too little
written down, 501 with no key set.
