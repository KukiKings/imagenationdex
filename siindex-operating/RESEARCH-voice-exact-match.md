# Research: Exact match — chat voice = introduction voice

**Question:** How does SIINDEX website chat sound *exactly* like the introduction video?

**Answer (verified against ElevenLabs + Supabase primary docs):**  
Chat uses **text-to-speech**. The intro uses **baked audio**. They only match when TTS is driven by a **voice_id cloned from the intro audio**.

---

## 1. Why they differ today

| Surface | Mechanism |
|---------|-----------|
| Introduction | Fixed audio track inside `siindex-01-name-intro.mp4` (Grok Imagine take) |
| Chat replies | ElevenLabs TTS with voice id `ELEVENLABS_VOICE_ID` or default `19STyYD15bswVz51nqLf` |

Different pipelines → different speakers. Tuning stability/style only reduces “robot”; it does **not** produce the intro speaker.

---

## 2. Correct fix (Path A) — Instant Voice Clone

Primary sources: ElevenLabs Instant Voice Cloning API (`POST /v1/voices/add`), IVC quickstart.

### Steps the Voice/Ops agents implement

1. **Extract clean speech** from the intro (1–2 minutes ideal; 30s–45s can work). Prefer speech-only, minimal bed/noise.
2. **Call Instant Voice Clone API** with `ELEVENLABS_API_KEY` (already on Supabase):
   - Endpoint: `https://api.elevenlabs.io/v1/voices/add`
   - Multipart: `name` + `files` (mp3/wav)
   - Optional: `remove_background_noise=true` if the take has noise
3. **Receive `voice_id`** from the response.
4. **Point website TTS at that id:**
   - Secret `ELEVENLABS_VOICE_ID=<voice_id>`, **or**
   - Row in `siindex_runtime_config` key `elevenlabs_voice_id` (already coded)
5. **Redeploy** `siindex-website-voice-tts` so production uses the new resolution path.
6. **Ear test:** intro play vs one chat reply — same speaker = pass.

### Sample quality (ElevenLabs guidance)

- Target **1–2 minutes** clear speech; avoid >3 minutes for IVC
- Quality of capture matters more than length
- One consistent speaker; no competing voices
- Volume roughly −23 to −18 dB RMS, true peak ~−3 dB
- MP3 ≥128 kbps acceptable

Our intro is ~45s speech — within workable IVC range.

### Repo already has

- `supabase/functions/siindex-website-voice-setup` — clones from public intro URL, stores voice id
- `supabase/functions/siindex-website-voice-tts` — resolves env → DB config → fallback
- Migration `siindex_runtime_config`

---

## 3. What does *not* achieve exact match

| Approach | Why it fails exact match |
|----------|---------------------------|
| Only changing stability/style/speed | Same wrong voice id, softer delivery |
| Browser `speechSynthesis` | Device voice, not intro |
| Speech-to-speech / Voice Changer | Converts *existing audio* to another voice; does not TTS arbitrary chat text |
| Regenerating intro with current chat voice (Path B) | Matches only if intro is *replaced*; user chose Path A (intro is reference) |

---

## 4. If IVC is “close but not exact”

ElevenLabs docs: **Instant Voice Clone** approximates from short audio (no full model train). **Professional Voice Clone** fine-tunes a dedicated model (higher fidelity) but needs **~30+ minutes** of clean speech and Creator+ plan, plus hours of training.

For a unique Imagine-generated voice, start with **IVC**. If ear test fails, plan PVC with more SIINDEX speech samples (media swarm produces more lines in the same voice).

---

## 5. Deploy channel (why GitHub alone is not enough)

Supabase edge code on GitHub does not change live TTS until **functions are deployed**.

Documented paths:

- `supabase functions deploy` (CLI) with project linked
- GitHub Action: `supabase/setup-cli` + `SUPABASE_ACCESS_TOKEN` + project ref on push to `main`
- Supabase Branching / GitHub integration (auto deploy on merge)

Secrets stay in Supabase (`ELEVENLABS_API_KEY`, optional `ELEVENLABS_VOICE_ID`, `SIINDEX_VOICE_SETUP_TOKEN`). Never in browser code.

---

## 6. Swarm execution order

1. Deploy migration `20260809_siindex_runtime_config.sql`
2. Deploy `siindex-website-voice-tts` + `siindex-website-voice-setup`
3. Ensure `ELEVENLABS_API_KEY` is set (already used by live TTS)
4. Set `SIINDEX_VOICE_SETUP_TOKEN`
5. Invoke setup once → writes intro-cloned `voice_id`
6. Ear test on imagenationdex.com
7. Mark job **done** only on exact-match pass

---

## 7. Sources

- ElevenLabs Instant Voice Cloning + API `POST /v1/voices/add`
- ElevenLabs IVC vs PVC (clone quality)
- ElevenLabs Voice Changer / STS (not a TTS substitute)
- Supabase Edge Functions deploy + GitHub Actions CI
- Supabase secrets for functions

**Bottom line:** Exact sameness = **intro audio → IVC → voice_id → all chat TTS**. No other shortcut satisfies “exactly the same as the introduction voice.”
