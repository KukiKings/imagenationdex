# Voice exact-match status (live probe 2026-08-09)

## Production facts (probed, not assumed)

| Check | Result |
|-------|--------|
| `siindex-website-voice-tts` | **Live** — returns `audio/pcm;rate=24000` |
| `X-Siindex-Voice-Model` header | `eleven_flash_v2_5` (**old deploy**, not turbo patch yet) |
| `siindex-website-voice-setup` | **404 NOT DEPLOYED** |
| Intro media | `https://imagenationdex.com/videos/siindex-01-name-intro.mp4` **200** |
| Chat pipeline | ElevenLabs via speak-core → edge TTS |
| Intro pipeline | Baked audio in MP4 |

**Conclusion:** Exact match is impossible on production until setup is deployed and run once with `ELEVENLABS_API_KEY` (already present for live TTS).

## Swarm completed

- Path A code (TTS resolve env → DB → fallback)
- IVC setup function (clone intro → store voice_id)
- Migration `siindex_runtime_config`
- GitHub Action `.github/workflows/deploy-supabase-functions.yml`
- Research notes

## Single gate

GitHub Actions secrets (one-time infrastructure for the swarm):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID` = `zljgthfzbalsunuoohcd`
- `SIINDEX_VOICE_SETUP_TOKEN` (any strong random; also set on Supabase function secrets)
- Optional: `SUPABASE_DB_PASSWORD` for migration push
- Optional: `ELEVENLABS_VOICE_ID` after setup returns the new id

After secrets exist: push or workflow_dispatch → deploy → POST setup → ear test.

No browser API keys. No founder ElevenLabs UI required for the clone itself.
