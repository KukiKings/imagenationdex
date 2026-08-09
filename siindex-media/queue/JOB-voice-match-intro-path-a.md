# JOB: Voice match — website TTS = intro video (Path A)

**Directed by:** SIINDEX (CEO/COO)  
**Agents:** Voice + Ops  
**Status:** code-ready — needs function deploy + one setup invoke

## Swarm work completed in repo

- [x] TTS de-robot: model `eleven_turbo_v2_5`, style 0.35, stability 0.48, speed 0.94
- [x] Resolve voice id: `ELEVENLABS_VOICE_ID` env → else `siindex_runtime_config.elevenlabs_voice_id` → else legacy fallback
- [x] Setup function `siindex-website-voice-setup`: clones from intro MP4 using existing `ELEVENLABS_API_KEY`, stores voice id in DB
- [x] Migration `20260809_siindex_runtime_config.sql`

## Ops agent (when Supabase deploy channel available)

1. Apply migration `20260809_siindex_runtime_config.sql`
2. Deploy `siindex-website-voice-tts` and `siindex-website-voice-setup`
3. Set secret `SIINDEX_VOICE_SETUP_TOKEN` (random)
4. POST setup once with header `x-siindex-setup-token`
5. Ear-test intro vs chat on imagenationdex.com

## Immediate effect without setup

After **TTS function deploy only**, chat should sound **less robotic** (new model + settings) even before intro clone. Full intro match requires the setup invoke.
