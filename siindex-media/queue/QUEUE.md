# SIINDEX Media Queue

**How to pick a job:** Read this file → take top non-blocked job → update `packages/<id>/status.txt` → stop at `needs-aj` unless AJ already approved production.

## Priority order (A–D programme)

| Priority | Job ID | Title | Path | Status |
|----------|--------|-------|------|--------|
| 1 | `intro-home-15s` | **A** Home short intro | Public home player | approved + voice ready |
| 2 | `present-pqsi-45s` | **B** Full PQSI introduction | Present / Interview | draft → voice ready |
| 3 | `bundle-home-and-present` | **C** Both A+B wired | Home + Present | planned |
| 4 | `transcript-only-refresh` | **D** Copy/transcript only | public-home text | ready anytime |
| 5 | `interview-open-15s` | Interview open | Interview Mode | voice ready |
| 6 | `onboarding-welcome-10s` | Function demo CLIP 1 | Pre-launch demo only | voice ready |

## Status meanings

draft · in-progress · needs-aj · approved · published · blocked

## Visual language (from Grok Imagine — locked for all jobs)

- Crimson / red-black hair, red hibiscus
- Cyan bio-tattoos: **conveyor-belt** flow along skin paths, soft glow, no slide-off
- Black SIINDEX suit, cyan hex details
- Neon Pacific-futurist city backdrop
- Light breathing, blinks, stable camera
- Full-body or medium shot per job brief

## Audio masters (workspace)

Produced under AJ approval for intro programme:

- `artifacts/siindex-media/A-home-intro-15s.mp3`
- `artifacts/siindex-media/B-present-pqsi-45s.mp3`
- `artifacts/siindex-media/C-interview-open-15s.mp3`
- `artifacts/siindex-media/C-onboarding-welcome.mp3`

Lip-sync video still requires Imagine motion take muxed with these tracks (or Imagine-native speech take). Do not claim lip-sync on site until published file has mouth sync.
