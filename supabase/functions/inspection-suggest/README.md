# inspection-suggest

Proposes how an inspection's findings group into problems, and which heuristic
each group violates. Deployed as a Supabase Edge Function so a self-hosted
instance gets it with the rest of the project, and so the model key never
reaches a browser.

## Deploy

```
supabase functions deploy inspection-suggest
supabase secrets set AI_API_KEY=sk-...
```

Optional secrets:

| Secret | Default | Why change it |
|---|---|---|
| `AI_API_URL` | OpenAI chat completions | Any OpenAI-compatible endpoint: a gateway, another provider, or a model on your own machine so no text leaves your infrastructure |
| `AI_MODEL` | `gpt-4o-mini` | A different model |
| `AI_JSON_MODE` | `auto` | `auto` asks for JSON mode and retries once without it if the provider rejects the request. `off` never asks, `on` always does |

Without `AI_API_KEY` the function answers 501 and the interface says the
deployment has no model configured. Nothing else breaks.

## Providers without a card

The function only needs an endpoint that speaks the OpenAI chat completions
shape. Three have a free tier that needs no payment method:

| Provider | `AI_API_URL` | `AI_MODEL` |
|---|---|---|
| Google AI Studio | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | a Gemini id from the AI Studio model list |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | an id from the Groq console model list |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | a model id ending in `:free` |

On OpenRouter, `AI_MODEL` also accepts `@preset/<slug>`, a configuration you
name at `openrouter.ai/settings/presets`. Choosing the model there rather than
here means swapping it later without touching a secret or redeploying. Its
model and provider routing apply; its temperature and system prompt do not,
because this function sends its own and request fields win over preset fields.

Neither Google's nor Groq's compatibility layer documents `response_format`,
and Groq rejects the whole request when it receives a parameter it does not
support. That is what `AI_JSON_MODE=auto` is for: the request goes out once
asking for JSON, and on a 400 it goes out again without asking. The answer is
then parsed leniently, because a model told to answer in JSON and not held to
it often wraps the object in a code fence.

Read the provider's terms before pointing this at a class. A free tier is
usually free because the provider may train on what you send, and what you send
here is text students wrote. A paid tier, a gateway, or a model on your own
machine avoids that; the organization opt-in stays off until someone decides.

## What it sends

Only text students wrote: the description, location, severity and heuristic of
each finding, capped at 200 findings and 400 characters each. It does not read
or send participant answers, observer notes, reflections, names, or emails.

## What protects it

- It builds its Supabase client from the caller's own `Authorization` header
  and never from the service-role key, so row-level security applies exactly as
  in the app. An inspection still collecting passes returns only the caller's
  own findings, which is not enough to merge, and the request fails.
- It refuses unless the organization opted in, checked through
  `inspection_ai_enabled`.
- It stores nothing. It returns the model's raw answer; the browser validates it
  against findings it already holds (`src/lib/ai-suggestions.ts`, 14 tests) and
  only then stores a suggestion. An invented finding id never reaches the
  database.

## Checking the provider before deploying

```
AI_API_KEY=... AI_API_URL=... AI_MODEL=... npx tsx scripts/verify/ai-provider.mts
```

Tells you whether the key is accepted, whether the model is free or billed,
whether the request this function sends comes back usable, and what it cost.
It imports `prompt.ts` from this folder, so it sends the request the deployed
function sends rather than an approximation of it, and it judges the answer
with the same validator the browser uses. Invented findings, so nothing real is
sent to a provider you have not chosen yet.

## Checking it by hand

```
curl -X POST "$SUPABASE_URL/functions/v1/inspection-suggest" \
  -H "Authorization: Bearer <a signed-in user's access token>" \
  -H "Content-Type: application/json" \
  -d '{"inspection_id":"<id of an inspection being consolidated>"}'
```

Expected failures, all of which should be readable rather than a 500: 401
without a token, 403 when the organization has not opted in, 409 while passes
are still being collected or with fewer than two findings, 501 with no key set.
