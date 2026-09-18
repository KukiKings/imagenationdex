# Twilio SMS setup — SUPERSEDED 2026-09-17, kept for history only

**AJ decision (2026-09-17): "we are no longer using twilio... it's not user friendly."** Do not
follow the steps below. Email is the working primary channel for founder alerts and needs no
change. See `AJ-BLOCKERS-RUNBOOK.md` §3 for the current status. This file is retained only so
the reasoning trail isn't lost, not as a live setup guide.

---

*(Original doc below, for history only.)*

**Priority:** Email first · SMS second  
**AJ mobile (locked):** `+61451565863`  
**Email:** `dadyboy73@gmail.com` · CC `imagenationdex@gmail.com`

## Env (secrets only — never commit tokens)

```bash
AJ_NOTIFY_EMAIL=dadyboy73@gmail.com
AJ_NOTIFY_EMAIL_CC=imagenationdex@gmail.com
AJ_NOTIFY_SMS=+61451565863
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

## Steps

1. Create Twilio account · get SID, token, from-number  
2. Put secrets in runtime (Vercel / server env / GitHub Actions secrets)  
3. `node siindex-m2m/notify.mjs test`  
4. Confirm SMS on +61451565863  

Until secrets are set, notify stays **outbox + email path only**.

*Every task still asks AJ — SMS is delivery, not auto-approve*
