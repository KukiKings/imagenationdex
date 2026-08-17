# Intro + Talk readiness gate (pre-launch / October)

Truth-as-you-build. Do not claim complete until each row is true on production.

## Live now (verified code paths)

| Item | Status |
|------|--------|
| Native intro play on user gesture (not force-mute only) | YES |
| Sin-dex pronunciation in status + transcript | YES |
| Captions VTT served + `<track>` on video | YES (`/siindex-intro-captions.vtt`) |
| Transcript on page matches short approved script | YES |
| Talk chips + typed ask (on-device public knowledge) | YES |
| Mic → MediaRecorder → `siindex-website-transcribe` | YES (needs clear 2–3s speech) |
| Presence honesty note (no false lip-sync claim) | YES (talk-ready.js) |
| Welcome message in Talk panel | YES (talk-ready.js) |

## Blocked until AJ / ops

| Item | Status |
|------|--------|
| Front-facing **speaking** MP4 (mouth motion under speech) | BLOCKED — AJ gate |
| Lip-sync marketing language | FORBIDDEN until speaking file live |
| Live accounts / wallets / payments in Visitor Mode | NOT LIVE (correct) |

## Crucial additions completed this pass

1. Talk first-run welcome so empty panel is not a dead end
2. Presence honesty badge on intro video card
3. Mic guidance: chips/type primary; speak 2–3 seconds
4. Captions route allowed in `vercel.json` (`.vtt`)
5. speak-core v3.0.6 MIME/filename fix for Safari mp4
6. home-ask-form restored; public-boot soft-fail optional scripts
7. Presence-integrity agent spec (`agents/08-presence-integrity.md`)

## Citizen / influencer / institutional bar

- WCAG: captions + transcript for intro synchronized media
- Honest status: what is live vs planned vs paused
- SI not AI; brand IN$DEX first
- No invented licences, prices, or completed registration

## Next hard tasks (after this section green)

1. AJ: ship speaking intro MP4 → replace still master
2. Presence agent automated motion check in CI
3. Mic success rate monitor (transcribe correlation_ids)
4. Only then: pre-launch marketing on intro/Talk as “wow” surface
