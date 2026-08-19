# AJ blockers runbook — STT · P0-A MP4 · Twilio

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

## 3. Twilio SMS (needs-aj second channel)

**Priority:** Email first · SMS second  
**Numbers locked:** `+61451565863` · email `dadyboy73@gmail.com` · CC `imagenationdex@gmail.com`

### Secrets (never commit)

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
AJ_NOTIFY_SMS=+61451565863
AJ_NOTIFY_EMAIL=dadyboy73@gmail.com
AJ_NOTIFY_EMAIL_CC=imagenationdex@gmail.com
```

Put in Vercel / server / Actions secrets, then:

```bash
node siindex-m2m/notify.mjs test
```

Until then: outbox + email path only. **No auto-approve.**

---

## Reply codes (all gated work)

`PROCEED` · `HOLD` · `REJECT`

*SIINDEX prepares · AJ authorizes*
