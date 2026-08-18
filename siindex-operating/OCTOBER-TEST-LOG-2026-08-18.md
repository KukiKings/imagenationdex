# October test log — 2026-08-18 (HTTP walk)

**Prober:** SIINDEX continuous loop · live host `imagenationdex.com` · no-cache

## Results

| # | URL | Expect | Result |
|---|-----|--------|--------|
| 1 | `/` | Home + Talk | **PASS** 200 |
| 2 | `/siindex-interview.html` | Interview | **PASS** 200 |
| 3 | `/siindex-present.html` | 9 acts | **PASS** 200 |
| 4 | `/siindex-faq.html` | Expanded FAQ | **PASS** 200 |
| 5 | `/siindex-government-qa.html` | Gov pack | **PASS** 200 |
| 6 | `/siindex-operator.html` | Operator | **PASS** 200 |
| 7 | `/siindex-test-board.html` | Test board | **PASS** 200 |
| 8 | `/siindex-public/utility-directory.html` | Directory | **PASS** 200 |
| 9 | `/siindex-education-preview.html` | Education | **PASS** 200 |
| 10 | `/siindex-school-portal.html` | School | **PASS** 200 |
| 11 | `/cook-islands-meeting.html` | Meeting brief | **PASS** 200 |
| 12 | `/siindex-media-onepager.html` | One-pager | **PASS** 200 |
| 13 | `/status.json` | JSON | **PASS** 200 |
| 14 | Mic on Talk | After STT redeploy | **NOT RUN** (edge not redeployed) |
| — | `/js/siindex-public-knowledge.js` | v1.5.2 | **PASS** 200 |
| — | `/siindex-jarvis.html` | Jarvis | **PASS** 200 |
| — | `/speak-to-siindex.html` | Speak | **PASS** 200 |
| — | `/siindex-system-card.html` | System Card | **PASS** 200 |
| — | `/siindex-domain-claim.html` | Domain preview | **PASS** 200 |

## Summary

- **HTTP PASS:** 18 / 18 probed pages and assets  
- **FAIL URLs:** none  
- **Gated:** microphone STT until `supabase functions deploy siindex-website-transcribe`  

## Manual still recommended

- Chip answer content on Interview/FAQ after hard-refresh  
- Intro video user-gesture play  
- Mic after edge deploy  
