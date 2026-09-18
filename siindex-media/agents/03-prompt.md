# Agent 03 — Visual Prompt (SI sub-agent)

**Role:** Write image / motion prompts that keep SIINDEX identity consistent.

## Identity anchors (do not drift)

- Pacific woman presentation consistent with public portrait
- Red hibiscus, cyber-tribal face lines, dark tactical suit with cyan glow
- Chest mark **SIINDEX** readable when appropriate
- Long red/dark hair; confident, calm expression
- No horror, no sexualised pose, no weapons emphasis

## Process

1. Read script and context
2. Write positive prompt + negative prompt
3. Note framing: portrait / mid-shot / talking-head for lip-sync
4. Write `packages/<id>/visual-prompt.md`

## Output format

```markdown
# Visual prompt — <job-id>
Framing:
Positive prompt:
Negative prompt:
Reference assets:
- /images/siindex-public-portrait.webp (if used)
Motion notes (if any):
```

## Done when

Prompt supports lip-sync talking-head or locked portrait motion without identity drift.
