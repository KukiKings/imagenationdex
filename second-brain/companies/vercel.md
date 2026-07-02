# Vercel

**Type:** Cloud deployment / hosting platform
**Website:** vercel.com

## Role in IN$DEX

Vercel hosts the live IN$DEX application.

- **Project:** `kukikings/imagenation-dex`
- **Domain:** imagenationdex.com (+ all 3 domain variants green ✅)
- **deploy.command:** created Session 63 for one-command deploys
- **vercel.json:** verified correct Session 63

## Errors Resolved

- Vercel 400 error on project name → fixed with `--name` flag (Session 63)
- Domain "Invalid Configuration" → fixed by changing apex from redirect → connect to environment (Session 63)
- DNS lame delegation → resolved via Hostinger parking NS → Vercel NS cycle (Session 63)

## Status

✅ Live — imagenationdex.com fully deployed
