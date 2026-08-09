# Web-safe presence loop

**Goal:** Living intro visual without freeze.

## Spec (AJ production)
- H.264 **Constrained Baseline**, **no B-frames**
- Silent (TTS owns audio)
- ~8s loop, 540×960, faststart
- Target size &lt; 1 MB

## Local artifact
Encoded in ops sessions as `siindex-presence-loop.mp4` (~840 KB).

## Live interim
Homepage presence source uses existing CDN asset:
`/videos/siindex-04-meditation-loop.mp4` until the optimized file is uploaded to `videos/siindex-presence-loop.mp4`.

## Upload (AJ / ops)
```bash
# from repo root after placing the file
git add videos/siindex-presence-loop.mp4
git commit -m "media: web-safe presence loop"
git push
```
Then set homepage source to `/videos/siindex-presence-loop.mp4`.
