# Channel: voice

**Live:** Website TTS via `siindex-website-voice-tts` (Supabase edge).  
Pronunciation: SIINDEX → **Sinn-dex** only (never Sign-dex).  
Intro video: native MP4 audio (TTS overlay off unless AJ re-enables).  
Voice identity: env `ELEVENLABS_VOICE_ID` → runtime config → fallback.  
Interrupt must not restart full utterance via speechSynthesis fallback.
