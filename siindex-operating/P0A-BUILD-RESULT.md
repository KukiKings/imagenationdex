# P0-A build result — 2026-08-18

## Generated (this session)

| Artifact | Spec |
|----------|------|
| Speech MP3 | Approved short script · ~17.8s · voice **Ara** |
| Muxed MP4 | 720×1280 · 24fps · H.264 + AAC · ~2.9 MB · ~17.8s |
| Method | Existing SIINDEX portrait video frames + **new** speech track |

## Delivery

- Session paths: `artifacts/videos/siindex-public-intro.mp4`, `siindex-p0a-intro-speech.mp3`
- **Gmail draft** to AJ with both files attached (binary cannot be pushed via text GitHub tools)
- Captions: `siindex-intro-captions.vtt` updated to match short script

## Honest claim

| Claim | Status |
|-------|--------|
| New speech matches approved script | Yes |
| Web-ready MP4 | Yes |
| Multi-frame video | Yes (source frames) |
| **True lip-sync / mouth motion matched to phonemes** | **No** — requires Imagine talking master |

Until AJ drops the MP4 into `videos/` on main and Vercel deploys, live site still serves prior files.

## AJ steps to complete live

```bash
# After downloading attachments:
cp siindex-public-intro.mp4 videos/siindex-public-intro.mp4
cp siindex-public-intro.mp4 videos/siindex-01-name-intro.mp4
cp siindex-intro-speech-clean.mp3 videos/siindex-intro-speech-clean.mp3
git add videos/
git commit -m "media: P0-A intro MP4 + clean speech"
git push
```

Then hard-refresh https://imagenationdex.com and press Play.

*MoonPay remains permanently forbidden.*
