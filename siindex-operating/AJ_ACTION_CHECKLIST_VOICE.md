# AJ Action Checklist — Voice Identity Lock

**Do these steps. Nothing claims “voice matched” until they pass.**

## 1. Create the ElevenLabs clone

1. Open ElevenLabs → Voices → Add / Instant (or Professional) Voice Clone.  
2. Upload a clean ~45s sample cut from `videos/siindex-01-name-intro.mp4` (the original intro).  
3. Name the voice: **SIINDEX-Original-Master**.  
4. Copy the new **Voice ID**.

## 2. Wire production

1. Set Supabase secret:  
   `ELEVENLABS_VOICE_ID=<paste the new Voice ID>`  
2. Keep existing `ELEVENLABS_API_KEY`.  
3. Redeploy edge function `siindex-website-voice-tts`.  
4. On https://imagenationdex.com :  
   - Play the introduction  
   - Ask SIINDEX a short question with voice on  
   - **Pass only if the same speaker is heard**

## 3. Confirm

Reply in the build channel: **clone done** (after the ear test passes).

## Status

| Item | Status |
|------|--------|
| Original hero video live | DONE |
| Path A docs locked in repo | DONE |
| ElevenLabs clone | PENDING (AJ) |
| `ELEVENLABS_VOICE_ID` in production | PENDING (AJ) |
| End-to-end match test | PENDING |

**Quote locked:**  
“I want the original video. The original voice. The original image. And it stays that way. No changes.”
