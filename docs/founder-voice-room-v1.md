# SIINDEX Founder Voice Room v1

This checkpoint adds a private, founder-authenticated voice interface without changing the public SIINDEX experience.

## Security boundary

- Supabase Auth session required.
- Founder role resolved server-side from `founder_authority`.
- Supabase native AAL2 MFA required.
- Existing `siindex-runtime` remains the authoritative reasoning and memory layer.
- New TTS endpoint accepts only founder AAL2 JWTs.
- ElevenLabs Flash v2.5 streams 24 kHz PCM through the authenticated endpoint.
- The browser plays PCM chunks incrementally through Web Audio instead of waiting for a complete file.
- TTS is limited to 12 successful requests per minute and 2,000 characters per request.
- The room has no deployment, payment, token, liquidity, publishing or database-write tools.
- Model and voice calls can be interrupted by AJ.
- Typed fallback remains available.

## Verification standard

1. Open the Vercel preview over HTTPS.
2. Confirm the room is locked while signed out.
3. Sign in with AJ's founder account.
4. Complete MFA and verify that Executive Mode unlocks.
5. Ask an unscripted spoken question.
6. Confirm the response streams from `siindex-runtime`.
7. Confirm spoken output comes from the authenticated founder TTS endpoint.
8. Interrupt SIINDEX while she is responding.
9. Ask a typed question.
10. Confirm `siindex_sessions`, `siindex_session_messages` and `security_events` receive genuine records.
