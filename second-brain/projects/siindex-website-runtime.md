# siindex-website-runtime

**Type:** Supabase Edge Function — the public-website SIINDEX conversation surface
**Path in repo:** `supabase/functions/siindex-website-runtime/index.ts`
**Supabase project ref:** `zljgthfzbalsunuoohcd` (as reported in the 5 Aug fix note; not independently verified by this pass — the nightly task does not touch Supabase)
**Public surface:** `https://imagenationdex.com/`
**Sibling function:** `siindex-website-voice-tts` (ElevenLabs — see [[elevenlabs]])

First recorded in the second brain: 2026-08-05.

---

## What it is

The runtime behind the SIINDEX widget on the marketing site — the single surface a
Cook Islands reporter, an FSC official or a first-time visitor actually touches. It
streams model output over SSE and passes the same string to text-to-speech, so any
rendering defect is both *seen* and *heard*.

Model in use as reported: `claude-haiku-4-5`.

## Version history (as recorded, not independently verified)

| Version | Date | Note |
|---|---|---|
| v6 | ≤ 29 Jul 2026 | Rendered raw Markdown to visitors. 16 literal `**` pairs measured in one reply |
| v7 | 5 Aug 2026 | Deterministic server-side Markdown stripping in the SSE loop |

v7 adds three functions — `stripMarkdown()`, `safeCut()` (refuses to cut a chunk at an
odd `**` / backtick count), `flushIndex()` (emits only past a stable boundary). Everything
else reported byte-identical to v6: origin allowlist, CORS, provider consent gate, visitor
hashing, rate limits (6/min, 60/day), `security_events` audit inserts, 30s upstream
timeout, `verify_jwt: false`.

## ⏳ Open risk — deployed code is not in the repo

**The v7 source lives in Supabase and not in `KukiKings/imagenationdex`.** Anyone deploying
this function from repo source silently reverts production to rendering asterisks.

Retrieval command recorded in the fix note:

```
supabase functions download siindex-website-runtime --project-ref zljgthfzbalsunuoohcd
```

This is the third instance of the same failure class — see [[production-vs-repo-drift]].

## ⏳ Also observed on 5 Aug, not fixed

1. A stale/wedged session stops responding — widget stuck on "Preparing SIINDEX's voice…",
   no subsequent network calls at all. Cleared by page reload. Seen once, not reproduced.
   Wants a timeout and a reset path on the speaking state.
2. **SIINDEX invented a capability.** She told a visitor they can reach her "through typed
   chat, phone call, or spoken reply". **There is no phone-call channel.** It was not in the
   VERIFIED STATUS block, so it was fabricated at generation time. An explicit negative is
   proposed, not yet added. This is a capability claim in SIINDEX's own voice on the public
   homepage — audit Check 4 territory.
3. Microphone gate unblocked — a normal desktop Chrome on a secure context exposes both
   `mediaDevices` and `MediaRecorder`, permission state `prompt`. The physical-device
   founder test recorded as untestable in §8.1 can now proceed.

## Unreachable references

The fix note cites **"§8.1 of the 5 August pack"** and a branch described as *never
published and now lost*. Neither the pack nor the branch is in this repository, and no
file matching it exists in the project folder. Recorded as **reported, not verified** —
see `canon-locations.md` for the standing problem of canon held outside the repo.

It also cites a **6 December** deadline for the speaking-state fix. December already
appears in the 30 Jul decision set (CCSS Level 1 artefact, reputation-feed vendor choice),
but **6 December specifically is new and unratified** — ⏳ not canon.

## Related

[[elevenlabs]] · [[supabase]] · [[mama-noe]] · [[production-vs-repo-drift]] · `canon-locations.md`
