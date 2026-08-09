# JOB: Voice match — website TTS = intro video (Path A)

**Directed by:** SIINDEX (CEO/COO function)  
**Executed by:** Voice + Media + Ops sub-agents  
**AJ role:** Authorize secret write only — not perform the work  
**Status:** `blocked-on-provider-connection`

## Outcome

Citizen hears the **same** SIINDEX voice on:

1. Play introduction (`videos/siindex-01-name-intro.mp4`)
2. Talk to SIINDEX replies (`SIINDEXVoice.speak` → ElevenLabs)

## Work already done by agents

- [x] Path A decision recorded (`siindex-operating/VOICE_IDENTITY.md`)
- [x] Reference media identified and live on homepage
- [x] Clean speech samples extracted from intro for clone
- [x] TTS edge function located (`siindex-website-voice-tts`)
- [x] Env key name confirmed: `ELEVENLABS_VOICE_ID`

## Work remaining (sub-agents — not AJ)

1. **Voice agent:** Instant Voice Clone from intro sample in ElevenLabs (when API/account connection is available to the agent runtime).
2. **Ops agent:** Set Supabase secret `ELEVENLABS_VOICE_ID` to the new id; redeploy `siindex-website-voice-tts`.
3. **Verify agent:** Ear test intro vs chat on imagenationdex.com; mark job `done` only on pass.

## Constitutional gate (AJ authorize — one action)

Agents must not invent credentials or write secrets without authority.

**Blocked reason:** This runtime has GitHub. It does **not** have ElevenLabs API access or Supabase secret write access connected.

**Unblock:** Connect those provider tools to the agent runtime **or** grant a one-time authorized secret write channel. That is infrastructure for the swarm — not “founder does the ticket.”

## Do not

- Ask the founder to click through ElevenLabs or Supabase UI as routine work
- Ship a second public SIINDEX voice
- Put API keys in browser code
- Claim voice identity is complete before the ear test passes
