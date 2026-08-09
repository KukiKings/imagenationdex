# SIINDEX Voice Exact Match — Status (2026-08-09)

**Path A (intro = chat).** Directed by SIINDEX. Production gate: AJ.

## Done (non-production)

- [x] Research: IVC from intro audio is the only exact-match path
- [x] TTS de-robot: `eleven_turbo_v2_5`, style/stability/speed tuned
- [x] Voice id resolve: `ELEVENLABS_VOICE_ID` → `siindex_runtime_config.elevenlabs_voice_id` → fallback
- [x] Setup edge function `siindex-website-voice-setup` (IVC + DB write)
- [x] Migration `20260809_siindex_runtime_config.sql`
- [x] GitHub Action deploy workflow
- [x] **Clean speech sample extracted** from `siindex-01-name-intro.mp4`
  - 45.12s mono, highpass 80Hz + loudnorm −20 LUFS
  - `siindex-intro-speech-clean.wav` (3.8 MB) and `.mp3` (1.1 MB, 192 kbps)
  - Better IVC input than full video with bed/noise
- [x] Setup function enhanced: prefers clean MP3 URL, falls back to intro MP4, correct MIME
- [x] M2M jobs advanced to blocked (waiting deploy/IVC)

## Blocked on AJ / secrets

Confirmed: workflow run **31310157891** failed at deploy step because secrets absent.

### GitHub Actions secrets (repo Settings → Secrets → Actions)

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_ID` | Project ref (e.g. `abcdefghijklmnop`) |
| `SUPABASE_DB_PASSWORD` | Optional — enables `supabase db push` for migration |

### Supabase project secrets (after functions deploy)

| Secret | Purpose |
|--------|---------|
| `ELEVENLABS_API_KEY` | Already used by live TTS |
| `SIINDEX_VOICE_SETUP_TOKEN` | Random string; header `x-siindex-setup-token` for one-time setup |
| `SIINDEX_VOICE_SAMPLE_URL` | Optional override; default prefers clean MP3 |
| `ELEVENLABS_VOICE_ID` | Optional hard override after IVC returns id |

## Sequence after secrets

1. Host clean sample at `/videos/siindex-intro-speech-clean.mp3` (or set `SIINDEX_VOICE_SAMPLE_URL`)
2. Push/workflow_dispatch → deploy `siindex-website-voice-tts` + `siindex-website-voice-setup`
3. Apply migration (dashboard SQL or `db push`)
4. Set `SIINDEX_VOICE_SETUP_TOKEN` on Supabase
5. One POST:
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/functions/v1/siindex-website-voice-setup" \
     -H "x-siindex-setup-token: $SIINDEX_VOICE_SETUP_TOKEN"
   ```
6. Ear-test intro vs chat on imagenationdex.com
7. Mark M2M jobs done only on exact-match pass

## Rules

- No production publish / funds / identity without AJ
- Brand first: IN$DEX
- SIINDEX = SI (not AI), PQSI, CEO/COO under AJ
- USD $0.24 genesis reference only
