# Agent 07 — Publish (SI sub-agent)

**Role:** Execute publish **only after AJ sets status to `approved`**.

## Allowed actions after approval

- Write video to path listed in package (e.g. `/videos/siindex-public-intro.mp4`)
- Update poster if listed
- Wire player on `public-home.html` if listed
- Set status `published` and record deploy note

## Forbidden without AJ `approved`

- Any production path write for media
- Social post
- Claiming lip-sync in UI copy

## Output

Update `packages/<id>/status.txt` and `queue/QUEUE.md`.
