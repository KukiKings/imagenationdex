# Defect fix board — 2026-08-09

Deep research of live imagenationdex.com. Fixes shipped same day.

## Sub-agent assignments

| Agent | Issues | Status |
|-------|--------|--------|
| **Grok (build)** | Home ask path, mobile nav, meeting links, transcript, SW cache | Fixed this commit |
| **Grok (build)** | Interview → meeting brief link | Fixed this commit |
| **Grok (build)** | siindex.html false "live avatar" click-through to Planned | Follow-up in same pack if included |
| **Codex** | Optional: speak-core knowledge integration tests when credits available | Assigned |
| **Claude** | Post-deploy: confirm Vercel Ready; no schedule drift | Assigned |
| **AJ** | Imagine lip-sync film when ready | Not a code defect |

## Issues found and resolution

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| D1 | High | Home ask() returned early into SIINDEXVoice without guaranteed on-screen public knowledge answer | Always answer from SIINDEX_PUBLIC first; speak locally |
| D2 | High | Mobile CSS hid all nav links except CTA | Keep SIINDEX / Interview / Present / FAQ / Speak visible |
| D3 | Med | Cook Islands meeting brief not linked from home | Added button |
| D4 | Med | Interview Mode missing meeting brief link | Added banner link |
| D5 | Med | Intro transcript shorter than locked script | Expanded transcript |
| D6 | Med | Stale SW could pin old shells | Bumped SW to indx-v7-defect-fix |
| D7 | Med | siindex.html "live avatar" → Planned shell | Remove false live-avatar navigation |
| D8 | Low | "Are you AI?" chip | Intentional SI-vs-AI contrast — keep |
| D9 | Info | Lip-sync intro not true lip-sync | Known; not claimed on home player |

## Verification checklist

- [ ] Hard refresh home — Talk chips show SIINDEX text answers immediately
- [ ] Phone width — Interview / Present / FAQ still in nav
- [ ] Open /cook-islands-meeting.html from home modes
- [ ] Interview banner → Meeting brief
- [ ] Play introduction still works
- [ ] /siindex.html portrait does not jump to Planned as live avatar
