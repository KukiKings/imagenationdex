# Supabase

**Type:** Database / auth / edge functions (Postgres-as-a-service)
**Website:** supabase.com

## Role in IN$DEX

Supabase is the backend for SIINDEX — database, auth, and Edge Functions powering chat/voice.

- **Client SDK:** pinned @2.108.2 with SHA-384 SRI (Session 61 — supply-chain hardening)
- **Edge Function `siindex-chat`:** upgraded `claude-haiku-4-5-20251001` → `claude-opus-4-8` (fallback `claude-sonnet-4-6`) — Session 77
- **Edge Function `siindex-voice-tts`:** v4 — ElevenLabs Samara X integration (Session 79)
- **Secrets:** `TELEGRAM_BOT_TOKEN` pending migration (SIINDEXbot token exposed in chat Session 79 — needs BotFather revoke + reissue)

## Status

✅ Live — chat + voice Edge Functions active. ⏳ Bot token migration to Supabase secrets pending.
