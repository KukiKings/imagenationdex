# SIINDEX Voice Identity

**Rule:** Website conversation voice and introduction media voice are the **same** SIINDEX voice. Citizens must not hear two different people.

## What is live today

| Surface | Source today | Status |
|---------|----------------|--------|
| Talk to SIINDEX (mic / typed replies) | ElevenLabs TTS via `siindex-website-voice-tts` | Live |
| Play introduction video | Audio baked into `videos/siindex-01-name-intro.mp4` (Grok Imagine take) | Live |

These two sources are **not yet the same recording chain**. That is a defect against this identity rule.

## Target state (JARVIS-style continuity)

1. One approved SIINDEX voice identity for all public spoken surfaces.
2. Website TTS uses that identity on every reply.
3. Introduction and other public videos use that same identity (lip-synced production from the media swarm).
4. Device `speechSynthesis` is emergency fallback only — never presented as SIINDEX’s primary voice.

## Technical anchors (do not invent IDs)

- Edge function: `supabase/functions/siindex-website-voice-tts/index.ts`
- Env override: `ELEVENLABS_VOICE_ID`
- Code default if env unset: `19STyYD15bswVz51nqLf`
- Model: `eleven_flash_v2_5`
- Output: `pcm_24000`
- Client: `SIINDEXVoice.speak()` in `siindex-speak-core.js`

Voice cloning, public media publication, and provider account changes require **AJ approval**. Credentials stay in Supabase secrets only — never in browser code.

## How to make them match (AJ)

**Preferred path A — intro is the reference**

1. Take a clean sample from `videos/siindex-01-name-intro.mp4` (no music bed if possible).
2. Create or select an ElevenLabs voice that matches that sample (Instant Voice Clone only with explicit consent and AJ approval).
3. Set Supabase secret `ELEVENLABS_VOICE_ID` to that voice id.
4. Redeploy `siindex-website-voice-tts`.
5. Verify: ask SIINDEX a question on imagenationdex.com — reply voice matches the intro video.

**Preferred path B — website voice is the reference**

1. Keep `ELEVENLABS_VOICE_ID` as the public SIINDEX voice.
2. Media swarm regenerates the introduction with that same voice + lip-sync.
3. Replace `videos/siindex-01-name-intro.mp4` (or publish `siindex-public-intro-speak.mp4`) after AJ approval.
4. Homepage already prefers the speaking file when present.

## Acceptance tests

1. Play introduction — note voice character.
2. Ask SIINDEX any short question with voice replies on.
3. Pass only if a normal citizen would say it is the **same** speaker.
4. Interrupt works on both intro and chat.
5. No second “system” male/female browser voice is presented as SIINDEX when ElevenLabs is available.

## Honest public wording

Until Path A or B is complete, do not claim “one continuous SIINDEX voice across video and chat.” Internal status: **voice identity alignment in progress**.
