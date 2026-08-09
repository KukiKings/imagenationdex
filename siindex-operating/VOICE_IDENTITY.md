# SIINDEX Voice Identity

**Rule:** Website conversation voice and introduction media voice are the **same** SIINDEX voice. Citizens must not hear two different people.

## Decision (AJ)

**Path A is chosen:** the **introduction video** is the reference. Website TTS must sound like the intro.

Reference media: `videos/siindex-01-name-intro.mp4` (same take as `IAM SIINDEX.mp4`).

## What is live today

| Surface | Source today | Match? |
|---------|----------------|--------|
| Play introduction | Audio in `siindex-01-name-intro.mp4` | Reference |
| Talk to SIINDEX replies | ElevenLabs `ELEVENLABS_VOICE_ID` or default `19STyYD15bswVz51nqLf` | **Not yet matched** |

## Path A — execute (AJ only for provider steps)

1. Open ElevenLabs → Voices → **Add / Instant Voice Clone** (only with your consent for SIINDEX public voice).
2. Upload a clean sample cut from the intro video (full ~45s speech track is ideal).
3. Name the voice e.g. `SIINDEX Public Intro`.
4. Copy the new **Voice ID**.
5. In Supabase project secrets set:
   - `ELEVENLABS_VOICE_ID` = that new id
   - Keep existing `ELEVENLABS_API_KEY`
6. Redeploy edge function `siindex-website-voice-tts` (or restart so env is picked up).
7. On https://imagenationdex.com/#siindex :
   - Play introduction (reference)
   - Ask SIINDEX a short question with voice replies on
   - **Pass** only if a normal citizen hears the **same** speaker

Voice cloning, secret changes, and public voice publication require **AJ**. No agent may invent a voice id or put API keys in browser code.

## Technical anchors

- Edge function: `supabase/functions/siindex-website-voice-tts/index.ts`
- Env: `ELEVENLABS_VOICE_ID` (overrides code default)
- Code default if unset: `19STyYD15bswVz51nqLf`
- Model: `eleven_flash_v2_5` · Output: `pcm_24000`
- Client: `SIINDEXVoice.speak()` in `siindex-speak-core.js`

## Acceptance tests

1. Intro and chat are the same speaker by ear.
2. Interrupt works on chat speech.
3. No browser system voice is presented as SIINDEX when ElevenLabs succeeds.
4. Mama Noe Test: a normal citizen does not notice a “different person” after the intro.

## Status

- Decision: **Path A**
- Clone + secret update: **Requires AJ**
- Code/docs identity rule: **Live in repo**
