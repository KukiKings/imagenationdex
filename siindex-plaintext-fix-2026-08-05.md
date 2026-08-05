# SIINDEX plain-text fix — deployed 5 August 2026

## Status

**Deployed to production.** `siindex-website-runtime` v6 → **v7**, Supabase project
`zljgthfzbalsunuoohcd`. Verified live on `https://imagenationdex.com/`.

**Not yet in the GitHub repo.** This is the one open risk — see "Do this next".

## What was wrong

SIINDEX rendered raw Markdown to visitors on the homepage. Measured on production
before the fix: **16 literal `**` pairs in a single reply.** The visible text read:

> `**SIINDEX Visitor Mode itself** — you're using it now.`

The same string is what gets sent to ElevenLabs, so she spoke the asterisks too.

This breaks Rule 4 of the Master Mega-Prompt pack ("Strip Markdown formatting before
displaying, storing or speaking assistant output") and fails the Mama Noe gate on the
single surface a Cook Islands reporter or FSC official will actually use.

## What was NOT wrong — a correction

My first diagnosis was that `SYSTEM_PROMPT` lacked a formatting instruction. **That was
wrong.** I had grepped the local repo copy, which is dated 29 July and four days stale.
The deployed v6 already contained:

```
- Use plain text only. Do not use Markdown, asterisks, headings, tables, or code fences.
```

The instruction was there. `claude-haiku-4-5` was simply not obeying it. Adding a
stronger instruction would have fixed nothing.

**Lesson, same shape as the recurring canon failures:** the local repo is not evidence
of what production runs. Fetch the deployed artifact before diagnosing it.

## The fix

Deterministic, server-side, in the SSE streaming loop. An instruction is a request; this
is a guarantee. Three new functions in `supabase/functions/siindex-website-runtime/index.ts`:

- `stripMarkdown()` — removes `**bold**`, `__bold__`, `` `code` ``, code fences, ATX
  headings, blockquote markers, horizontal rules and `[text](url)` links; normalises
  `*` and `+` bullets to `- `. Emphasis handled `**` first so single-`*` rules cannot
  mangle a bold run.
- `safeCut()` — a Markdown marker can arrive split across two provider chunks. Refuses
  to cut at any index where the `**` or `` ` `` count in the prefix is odd.
- `flushIndex()` — emits only text past a stable boundary (paragraph break, then line
  break above 160 chars, then last space above 400 chars), so a marker is always whole
  before stripping. Remainder flushed in the `finally` block.

Everything else in the file is byte-identical to v6: origin allowlist, CORS, provider
consent gate, visitor hashing, rate limits (6/min, 60/day), `security_events` audit
inserts, 30s upstream timeout, `verify_jwt: false`.

## Verification

Real user clicks on `https://imagenationdex.com/`, fresh page load, conversation
storage cleared each run.

| Check | Before (v6) | After (v7) |
|---|---|---|
| Literal `**` pairs on page | 16 | **0** |
| Stray backticks | 0 | **0** |
| Markdown headings | none | **none** |
| `siindex-website-runtime` | 200 | **200** |
| `siindex-website-voice-tts` | 200 | **200** |

## Do this next — highest priority

The fix lives in Supabase but **not in `KukiKings/imagenationdex`**. If anyone deploys
`siindex-website-runtime` from repo source, production silently reverts to rendering
asterisks. This is exactly the failure pattern that has already cost this project days:
the waitlist RPC on 31 July, and the "Fixed locally, deployment evidence pending" rows
in §8.1 of the 5 August pack, whose branch was never published and is now lost.

Retrieve the exact deployed source and commit it:

```
supabase functions download siindex-website-runtime --project-ref zljgthfzbalsunuoohcd
```

Then commit to `supabase/functions/siindex-website-runtime/index.ts`.

Rollback if ever needed: v6 remains in the Supabase function version history.

## Also observed, not fixed

1. **A stale/wedged session stops responding.** After an earlier conversation left the
   widget on "Preparing SIINDEX's voice…", subsequent clicks produced no network calls
   at all. A page reload cleared it. Seen once, not reproduced cleanly — worth a timeout
   and a reset path on the speaking state before 6 December.
2. **One unverified claim in a reply.** SIINDEX said visitors can talk to her "through
   typed chat, phone call, or spoken reply". There is no phone-call channel. Not in the
   VERIFIED STATUS block, so it was invented. Consider adding an explicit negative.
3. **Microphone gate is now unblocked.** §8.1 recorded the mic path as untestable
   because the cloud browser exposed neither `mediaDevices` nor `MediaRecorder`. Both are
   present in a normal desktop Chrome on a secure context, permission state `prompt`.
   The physical-device founder test can proceed.
