# ElevenLabs

- **Type:** AI voice synthesis platform
- **Role in SIINDEX:** Voice provider for SIINDEX QPSI / desktop agent voice output
- **Workspace:** ElevenCreative
- **Voice locked:** Samara X — Smooth Classy British
  - Voice ID: `19STyYD15bswVz51nqLf`
  - Model: Eleven Multilingual v2
  - Settings: Speed 0.9, Stability 0.74, Similarity 0.83, Style 0
- **Replaces:** edge-tts en-AU-NatashaNeural
- **Wire-in target:** `ELEVENLABS_VOICE_ID=19STyYD15bswVz51nqLf` in desktop agent `.env`
- **Decision context:** Samara X chosen over Aria (unavailable), Alice, and others — British accent for Jarvis-quality authority. Multilingual v2 preferred over v3 (v3 defaulted to a different voice). Stability 0.74 eliminates instability warning while preserving naturalness.
- **Status:**
  - ✅ Voice locked + saved (Session 65e, 1 Jul 2026)
  - ✅ `siindex-chat.html` — Phase 2 voice toggle wired via `siindex-voice-tts` Edge Function (graceful fallback until ELEVENLABS_API_KEY active)
  - ✅ `siindex-voice-terminal.html` — `speak()` replaced with async ElevenLabs call + browser TTS fallback (Session 75, 2 Jul 2026)
  - ⏳ Desktop agent `.env` — `ELEVENLABS_VOICE_ID=19STyYD15bswVz51nqLf` not yet wired in
  - ⏳ ElevenLabs Conversational AI agent (Claude reasoning + Samara X voice) — not yet set up
  - ⏳ `ELEVENLABS_API_KEY` → Supabase secrets (September, when billing active)

**Last updated:** 2026-07-02 (Session 75)
