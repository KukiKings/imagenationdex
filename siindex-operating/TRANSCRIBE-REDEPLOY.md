# Mic STT fix — redeploy required

**Symptom:** `Voice failed (transcription_provider_error:400)`

**Cause:** Edge function sent ElevenLabs `timestamps_granularity=none` (invalid; only `word`|`character`).

**Fix in repo (2026-08-18):** `supabase/functions/siindex-website-transcribe/index.ts`
- `timestamps_granularity` → `word`
- model default `scribe_v1`
- `language_code=en`

**Action (AJ / ops):**

```bash
supabase functions deploy siindex-website-transcribe
```

Confirm secret `ELEVENLABS_API_KEY` is set.

Until deploy, type + chips remain the working path.
