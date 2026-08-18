# Twilio SMS setup — needs-aj short alerts

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
