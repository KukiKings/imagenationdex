# SIINDEX Voice Exact Match — Status (2026-08-16)

**Path A (intro = chat).** Directed by SIINDEX. Production gate: AJ.

## Task 5 — intro audio re-export (this pass)

Re-exported from **live** `videos/siindex-01-name-intro.mp4` (45.125s):

| Artifact | Size | Spec |
|----------|------|------|
| `siindex-intro-speech-clean.wav` | 3.8 MB | mono 44.1 kHz, highpass 80 Hz, loudnorm ~−20 LUFS |
| `siindex-intro-speech-clean.mp3` | 1.1 MB | 192 kbps mono (preferred IVC input) |
| `siindex-01-name-intro-polished.mp4` | 8.5 MB | H.264 CRF23, AAC 128k, loudnorm −16, `+faststart` |

**SHA256 (mp3):** `1976ed2388739919abb7e3f5c0980cc7e4d1a83265a8f971aa7703c54038495e`

**Not live yet:** `https://imagenationdex.com/videos/siindex-intro-speech-clean.mp3` → 404.  
Binary publish into `videos/` is **AJ-gated** (GitHub text tools are not safe for multi-MB media).

## Done (non-production / code)

- [x] Research: IVC from intro audio is the only exact-match path
- [x] TTS de-robot: `eleven_turbo_v2_5`, style/stability/speed tuned
- [x] Voice id resolve: `ELEVENLABS_VOICE_ID` → `siindex_runtime_config.elevenlabs_voice_id` → fallback
- [x] Setup edge function `siindex-website-voice-setup` (IVC + DB write)
- [x] Migration `20260809_siindex_runtime_config.sql`
- [x] GitHub Action deploy workflow
- [x] Clean speech sample **re-exported** 2026-08-16 (Task 5)
- [x] Polished intro encode ready (size ~half of live 16 MB master)

## Blocked on AJ

1. **Commit binaries** under `videos/`:
   - `videos/siindex-intro-speech-clean.mp3` (required for Path A sample URL)
   - optional overwrite `videos/siindex-01-name-intro.mp4` with polished master (then bump `?v=` on intro-sync)
2. Confirm secrets (Actions + Supabase) for deploy / setup token
3. One setup POST to `siindex-website-voice-setup`
4. Ear-test intro vs chat on imagenationdex.com

### Sequence after binaries + secrets

```bash
curl -X POST "https://zljgthfzbalsunuoohcd.supabase.co/functions/v1/siindex-website-voice-setup" \
  -H "x-siindex-setup-token: $SIINDEX_VOICE_SETUP_TOKEN"
```

## Rules

- No production publish / funds / identity without AJ
- Brand first: IN$DEX
- SIINDEX = SI (not AI), PQSI, CEO/COO under AJ
- USD $0.24 genesis reference only
- Voice lock: intro and chat must be the same speaker (Path A)
