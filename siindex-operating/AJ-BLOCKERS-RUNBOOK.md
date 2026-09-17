# AJ blockers runbook — STT · P0-A MP4 · founder-notification SMS (retired)

**Status:** Agent cannot complete these without your machine / secrets.  
**Updated:** 2026-08-19

---

## 1. Microphone STT (highest)

**Symptom:** `Voice failed (transcription_provider_error:400)`  
**Fix in GitHub:** already committed — invalid `timestamps_granularity=none` removed; model `scribe_v1`; `language_code=en`.

### Deploy (you run)

```bash
# From repo root, linked to the live Supabase project
supabase functions deploy siindex-website-transcribe
```

### Secrets (Supabase dashboard → Edge Functions → Secrets)

| Secret | Required |
|--------|----------|
| `ELEVENLABS_API_KEY` | Yes |
| `SUPABASE_URL` | Usually auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Usually auto |
| `SIINDEX_STT_MODEL` | Optional (default `scribe_v1`) |

### Verify

1. Hard-refresh https://imagenationdex.com/  
2. Allow mic · speak 2–3 clear seconds  
3. Expect transcript in the ask box, not provider 400  

Type + chips work without this deploy.

---

## 2. P0-A speaking intro MP4

**Goal:** Replace or supplement `/videos/siindex-01-name-intro.mp4` with P0-A speech package.

### Agent-prepared asset (local workspace)

- Speech: `siindex-p0a-intro-speech.mp3` (~17.8s)  
- Mux candidate may be built as `siindex-01-name-intro-p0a.mp4` (video from live intro + new speech, shortest)

### You push (GitHub contents API blocks large binaries from agent)

```bash
# Copy the P0-A mp4 into the repo
cp /path/to/siindex-01-name-intro-p0a.mp4 videos/siindex-01-name-intro.mp4
# or keep old file and add:
# videos/siindex-01-name-intro-p0a.mp4

git add videos/
git commit -m "media: P0-A speaking intro"
git push origin main
```

Then hard-refresh home and play introduction.

**Honest:** Lip-sync / full talking master still not claimed until you approve a true speaking master.

---

## 3. Founder-notification SMS second channel — RETIRED 2026-09-17

**AJ decision (2026-09-17): "we are no longer using twilio... it's not user friendly."** This
was always the lower-stakes of the two Twilio dependencies in this repo — a backup alert
channel to AJ's own phone, never his citizens' onboarding path (see item below and
`second-brain/companies/twilio.md` for that separate, higher-stakes one).

Email (`dadyboy73@gmail.com` / CC `imagenationdex@gmail.com`) has been the working primary
channel all along and stays that way. `siindex-m2m/notify.mjs` continues to work exactly as
before on the outbox + email path — nothing breaks by leaving this second channel unbuilt. If
AJ ever wants a second channel again, it should not default back to Twilio; a push notification
or a Supabase-native option would fit better with the "we are using supabase" direction below.

~~Old Twilio setup steps retained for history in `TWILIO-SMS-SETUP.md`, marked superseded.~~

---

## Reply codes (all gated work)

`PROCEED` · `HOLD` · `REJECT`

*SIINDEX prepares · AJ authorizes*
