# SIINDEX Canonical Tool Stack
**Canonised:** 27 Jun 2026 | **Author:** Claude (CEO/COO) | **Status:** LOCKED

Every tool evaluated against SIINDEX's stack. No guessing. Deep research conducted on all 17. Each entry: what it is → install method → Cowork or CLI-only → SIINDEX fit → verdict.

Rule: **Nothing ships to next build until this document is locked.** Update this file when install status changes.

---

## VERDICTS AT A GLANCE

| # | Tool | Bucket | Verdict | Priority |
|---|------|--------|---------|----------|
| 1 | Taste Skill | Design | INSTALL | Now |
| 2 | Impeccable | Design | INSTALL | Now |
| 3 | awesomedesign.md | Design | INSTALL | Now |
| 4 | Ponytail | Productivity | INSTALL | Now |
| 5 | NotebookLM MCP | Productivity | CONNECT | Soon |
| 6 | Playwright MCP | Productivity | INSTALL | Now |
| 7 | Codex Plugin | Productivity | CLAUDE CODE ONLY | When on CLI |
| 8 | GWS CLI | Productivity | FUTURE | Skip for now |
| 9 | GitHub MCP | Productivity | INSTALL | Now |
| 10 | Skill Creator | Productivity | ALREADY AVAILABLE | Use it |
| 11 | Last 30 Days | Data | INSTALL | Soon |
| 12 | Firecrawl MCP | Data | SKIP — Tavily covers this | Replaced |
| 13 | Auto Research | Data | SKIP | Irrelevant |
| 14 | Supabase MCP | Data | ALREADY CONNECTED | Active |
| 15 | Obsidian MCP | Data | SKIP | Redundant |
| 16 | LightRAG | Data | FUTURE | 50+ docs |
| 17 | Stripe MCP | Data | ✅ CONNECTED — Session 58 | Active |
| 18 | Tavily MCP | Data | ✅ CONNECTED — Session 58 | Active |

---

## DESIGN BUCKET

### 1. Taste Skill
**What it is:** Open-source Claude Code skill that stops AI from generating generic UI slop. Gives Claude opinionated design taste — reads the brief, infers direction, ships interfaces that don't look templated.
**GitHub:** `leonxlnx/taste-skill` | `nxpatterns/claude-taste-skill` — 37,400 ⭐
**Website:** tasteskill.dev
**Install method:** Copy SKILL.md from repo into project root as a Claude Code skill. Works in Cowork and CLI.
**Cowork compatible:** ✅ YES — skill file, no terminal required
**SIINDEX fit:** HIGH — We have 5+ screens still to build (feed, referral, light-node, sovereign-academy, marketplace 2.0). Taste skill applies to every one. Also use to audit existing God Mode screens before launch.
**Verdict:** ✅ INSTALL NOW
**Action:** Download taste-skill SKILL.md from `github.com/nxpatterns/claude-taste-skill` → add to SIINDEX skills directory.

---

### 2. Impeccable
**What it is:** 1 skill, 23 commands, live browser editor. The most popular design skill in the Claude ecosystem. Made by Paul Bakaus (former Google Developer Advocate, creator of jQuery UI). Now built into GitHub Copilot natively.
**GitHub:** `pbakaus/impeccable` — 35,800 ⭐
**Website:** impeccable.style
**Install method:** `npx impeccable install` from project root. Then `/impeccable init` inside Claude Code to generate PRODUCT.md and DESIGN.md context files.
**Key commands:** `/impeccable critique`, `/polish`, `/bolder`, `/quieter`, `/distill`, `/animate`, `/colorize`, `/typeset`
**Cowork compatible:** ✅ YES — skill files generated at init; Cowork reads them as context
**SIINDEX fit:** HIGH — `/critique` can audit every screen before ship. `/distill` can clean cluttered layouts. `/bolder` for CTAs. Run `/impeccable init` once to give every session our brand context. The live browser editor is the differentiator — use it to iterate screens visually.
**Verdict:** ✅ INSTALL NOW
**Action:** `npx impeccable install` in project root → `/impeccable init` → select "product" (not brand) → fill in SIINDEX context.

---

### 3. awesomedesign.md
**What it is:** 57+ brand design systems as plain DESIGN.md markdown files. Drop one into your project and Claude uses that brand's design language. 71,000 ⭐ — one of fastest-growing repos of 2026.
**GitHub:** `VoltAgent/awesome-design-md`
**Website:** github.com/VoltAgent/awesome-design-md
**Install method:** Browse repo → find DESIGN.md for target brand → copy into project root. No CLI needed.
**Fintech/crypto systems available:** Stripe (purple gradients, weight-300 elegance), Revolut (sleek dark, gradient cards, fintech precision), Kraken (purple-accented dark, data-dense dashboards)
**Cowork compatible:** ✅ YES — plain markdown file, Cowork reads it as context
**SIINDEX fit:** HIGH — We build a DeFi fintech app. Use Revolut DESIGN.md as the base design reference for new screens. Revolut's dark/gradient/fintech aesthetic aligns directly with SIINDEX brand. Drop it in and every new screen builds to that standard.
**Verdict:** ✅ INSTALL NOW
**Action:** Copy `Revolut DESIGN.md` (or Stripe) from VoltAgent/awesome-design-md into `/ImageNation DEX/DESIGN.md` — Claude will reference it automatically on every screen build.

---

## PRODUCTIVITY BUCKET

### 4. Ponytail
**What it is:** Skill that makes Claude think like a "lazy senior developer" — asks 5 questions before writing any code (Does this exist? Is it in stdlib? Is there a library?). Results: 54% less code, 47-77% lower cost, 3-6x faster.
**GitHub:** `DietrichGebert/ponytail` — 44,190 ⭐ in 9 days
**Install method:** Copy SKILL.md into project. Activates as a pre-code decision ladder.
**Cowork compatible:** ✅ YES — skill file
**SIINDEX fit:** MEDIUM — Benefits new screen builds by stopping Claude from reinventing patterns that already exist in the codebase. Less relevant for God Mode screens (we have a tight playbook). Very relevant for backend/infrastructure work (Supabase schema, edge functions, auth).
**Verdict:** ✅ INSTALL — activate specifically for backend/data work, not UI screens (our God Mode playbook already does what Ponytail does for UI).
**Action:** Download from DietrichGebert/ponytail → add to SIINDEX skills.

---

### 5. NotebookLM MCP
**What it is:** Connects Claude to Google NotebookLM via MCP. Create notebooks, query uploaded documents, generate audio overviews, slide decks, flashcards, quizzes — all for free via Google's servers.
**GitHub:** `alfredang/notebooklm-mcp` | `jacob-bd/notebooklm-mcp-cli`
**Install method:** MCP server — add to Claude settings via `nlm setup add claude-code`. Also available via Composio for Cowork.
**Cowork compatible:** ✅ YES — MCP, Composio Cowork integration documented
**SIINDEX fit:** MEDIUM — Use to build investor notebooks (whitepaper + business plan uploaded to NLM), generate audio pitch overviews, create briefing packets. Not in critical build path but high value for pre-launch investor/PR work.
**Verdict:** ✅ CONNECT SOON
**Action:** Set up via alfredang/notebooklm-mcp → add whitepaper-v1.md and business-plan as sources.

---

### 6. Playwright MCP
**What it is:** Official Microsoft MCP server for browser automation. Operates on accessibility tree (not pixels) — no vision model required. Tools: navigate, click, type, fill forms, screenshot, keyboard/mouse.
**GitHub:** `microsoft/playwright-mcp` — official
**Website:** playwright.dev/docs/getting-started-mcp
**Install method:** `claude mcp add playwright npx @playwright/mcp@latest` OR install via official Claude plugin at claude.com/plugins/playwright
**Cowork compatible:** ✅ YES — available as official Claude plugin
**SIINDEX fit:** HIGH — Can automatically test every SIINDEX screen: form submissions (deposit amounts, swap inputs, buy flows), edge cases (zero balance, max amounts, invalid inputs), mobile breakpoints. Eliminates manual QA. Run before every git push.
**Verdict:** ✅ INSTALL NOW
**Action:** Install from claude.com/plugins/playwright → add to SIINDEX workflow as pre-ship QA tool.

---

### 7. Codex Plugin (codex-plugin-cc)
**What it is:** Official OpenAI plugin (released March 30, 2026) that runs inside Claude Code. Commands: `/codex:review` (standard review), `/codex:adversarial-review` (devil's advocate — hunts 7 attack surfaces), `codex:rescue` (delegate whole features to Codex).
**GitHub:** `openai/codex-plugin-cc` — official OpenAI repo
**Install method:** Claude Code CLI only — `claude plugins install codex-plugin-cc`
**Cowork compatible:** ❌ NO — Claude Code terminal only
**SIINDEX fit:** MEDIUM — Adversarial review is genuinely valuable before ship (catches auth issues, race conditions, data loss vectors). But only accessible from terminal.
**Verdict:** CLAUDE CODE CLI ONLY — Install when AJ is working in terminal. Not available in Cowork sessions.
**Action:** Note for AJ to install via terminal: `claude plugins install codex-plugin-cc`. Use `/codex:adversarial-review` before every major ship.

---

### 8. GWS (Google Workspace CLI)
**What it is:** CLI + MCP for Google Drive, Gmail, Calendar, Sheets, Docs, Chat. Official repo: `googleworkspace/cli`. Community plugin adds 92 skills for email/standup/weekly digest workflows.
**GitHub:** `googleworkspace/cli` | `WadeWarren/gws-claude-plugin`
**Cowork compatible:** ✅ Partial — native MCP server, but setup is complex
**SIINDEX fit:** LOW — SIINDEX build stack runs on Slack + Linear, not Google Workspace. Gmail is used but the existing Gmail connector covers basic needs. GWS is overkill unless we're running heavy Google Docs/Sheets workflows.
**Verdict:** ⏳ FUTURE — connect only if SIINDEX investor relations or board comms move to Google Workspace.
**Action:** None now. Revisit post-launch.

---

### 9. GitHub MCP
**What it is:** Official GitHub MCP connector. Create issues, manage PRs, review code, push to repos, search codebase, manage branches — all from Claude via natural language.
**Install method:** Official Claude plugin at `claude.com/plugins/github`. Also in Anthropic's `claude-plugins-official` directory.
**Cowork compatible:** ✅ YES — official Claude plugin
**SIINDEX fit:** HIGH — Currently doing all git operations manually in Terminal. With GitHub MCP we can: create Linear-linked branches, open PRs, attach session notes as issue comments, manage the God Mode rollout tracking directly. Eliminates the manual `git add -A && git commit` step.
**Verdict:** ✅ INSTALL NOW
**Action:** Connect from claude.com/plugins/github → authenticate with SIINDEX repo.

---

### 10. Skill Creator
**What it is:** Official Anthropic skill (in `anthropics/skills` repo). Creates, modifies, and A/B tests skills. Runs eval optimization loops, compares skill vs no-skill performance, generates HTML performance reports.
**Install method:** Available in Claude skills marketplace via `/plugin` search. Already in Cowork skills ecosystem.
**Cowork compatible:** ✅ YES
**SIINDEX fit:** HIGH — We have 4 custom SIINDEX skills (indx-god-mode, indx-screen-audit, indx-session-closeout, siindex-voice-check). Skill Creator can A/B test them and prove they're working. Use to improve god-mode playbook description for higher trigger accuracy.
**Verdict:** ✅ ALREADY AVAILABLE — use it. Run Skill Creator on `indx-god-mode` to optimise its description.
**Action:** `/skill-creator` → select `indx-god-mode` → run A/B test vs no-skill baseline.

---

## DATA BUCKET

### 11. Last 30 Days
**What it is:** Skill that searches Reddit, X/Twitter, YouTube, HN, Polymarket, TikTok simultaneously and synthesises a grounded briefing. Was #1 on GitHub. Deep research beyond simple web search.
**GitHub:** `mvanhorn/last30days-skill`
**Install method:** Skill file — copy SKILL.md into project.
**Cowork compatible:** ✅ YES — skill-based, works in Cowork with connected web search
**SIINDEX fit:** MEDIUM — Market research (crypto sentiment, DeFi trends, competitor moves), daily briefings, investor narrative research. High value for pre-launch positioning and PR. Not in build critical path but sharp research tool.
**Verdict:** ✅ INSTALL SOON
**Action:** Download from mvanhorn/last30days-skill → add to SIINDEX skills. Use for competitor research sessions.

---

### 12. Firecrawl MCP
**What it is:** Official MCP server for web scraping. 6 tools: `scrape` (single page), `crawl` (entire site), `search` (web search + scraping), `map` (discover all site URLs), `extract` (structured data), `agent` (autonomous research). Cuts token use 80% vs raw HTML. Free tier: 10 scrapes/min.
**GitHub:** `firecrawl/firecrawl-mcp-server` — official
**Website:** firecrawl.dev
**Install method:** Claude.ai connector — Settings → Connections → Add custom connector → URL: `https://mcp.firecrawl.dev/YOUR_API_KEY/v2/mcp`. Sign up at firecrawl.dev/app/api-keys (free, no credit card).
**Cowork compatible:** ✅ YES — Cowork connector, documented setup
**SIINDEX fit:** HIGH — Scrape competitor DeFi platforms (Uniswap, PancakeSwap, Coinbase), pull regulatory docs, scrape tokenomics pages, crawl crypto news. Also: map and scrape every SIINDEX page for SEO audit pre-launch.
**Verdict:** ✅ CONNECT NOW — free tier is sufficient for research use
**Action:** Get API key at firecrawl.dev → add to Claude Settings → Connections.

---

### 13. Auto Research (Karpathy)
**What it is:** ML experiment loop. Requires NVIDIA GPU (20+ GB VRAM), Python 3.10+, uv. Runs automated ML training experiments in a loop, keeping only improvements. Released March 7, 2026, went viral (21,000+ stars).
**GitHub:** `karpathy/autoresearch`
**Cowork compatible:** ❌ NO — requires GPU, Python environment, ML training code
**SIINDEX fit:** NIL — SIINDEX is a DeFi web app, not a machine learning project. Auto Research optimises ML training loops. We have no use case.
**Verdict:** ❌ SKIP — irrelevant to SIINDEX at all stages.

---

### 14. Supabase MCP
**What it is:** Official Claude connector. PostgreSQL database, auth, edge functions, branching, TypeScript types — 32 tools. OAuth authentication (no API key paste). Available at `https://mcp.supabase.com/mcp`.
**Install method:** Claude.ai Settings → Connections → Supabase → OAuth flow.
**Cowork compatible:** ✅ YES — official Claude connector, Composio Cowork guide exists
**SIINDEX fit:** HIGH — Backend database for SIINDEX when we build: email capture (waitlist), user profiles (server-side), transaction logging, referral tracking. Supabase free tier handles 50,000 MAU.
**Verdict:** ✅ ALREADY CONNECTED — confirmed connected in Session 56. Active and ready.
**Action:** None — already set up. Use when building SIINDEX backend (waitlist, profiles, referral DB).

---

### 15. Obsidian MCP
**What it is:** MCP server that connects Claude to an Obsidian vault (local .md files with knowledge graph). Options: mcpvault (no Obsidian required), mcp-obsidian (requires Obsidian running). Enables backlink traversal, graph search, tag-based queries.
**Install method:** Various MCP servers (MarkusPfundstein/mcp-obsidian or bitbonsai/mcpvault)
**Cowork compatible:** ✅ Partial — requires local Obsidian install + vault setup
**SIINDEX fit:** LOW — We already built our own second-brain structure as plain markdown in the ImageNation DEX project folder. Claude reads it natively every session. Obsidian MCP would duplicate this with more setup complexity.
**Verdict:** ❌ SKIP — our markdown second-brain already solves this. Obsidian adds dependency without benefit.

---

### 16. LightRAG
**What it is:** Lightweight knowledge-graph RAG framework from University of Hong Kong (EMNLP 2025). Dual-layer: knowledge graph + vector embeddings. 28,000 GitHub stars. Extension `RAG-Anything` adds multimodal (images, charts, PDFs). MCP wrapper via `olafgeibig/knowledge-mcp`.
**GitHub:** `HKUDS/LightRAG`
**Install method:** Self-hosted Python setup. `knowledge-mcp` wraps it as MCP server but still requires local embedding model + setup.
**Cowork compatible:** ⚠️ PARTIAL — MCP wrapper exists but requires local infrastructure
**SIINDEX fit:** FUTURE — When SIINDEX documentation grows to 50+ files (whitepaper, legal docs, user research, session history), LightRAG would enable semantic cross-document search. Not needed now — markdown files are still navigable.
**Verdict:** ⏳ FUTURE — revisit when second-brain exceeds 50 documents or we need semantic search across the full SIINDEX knowledge base.

---

### 17. Stripe MCP
**What it is:** Official Stripe MCP server. 133 actions. Create customers, manage subscriptions, issue refunds, generate invoices, retrieve payment intents, look up decline codes — all from Claude. Available as official Claude plugin at `claude.com/plugins/stripe`. OAuth auth.
**Install method:** `claude.com/plugins/stripe` → connect with Stripe account OAuth.
**Cowork compatible:** ✅ YES — official Claude plugin
**SIINDEX fit:** HIGH — When SIINDEX launches premium subscription tier (Sovereign Pro), subscription management, payment monitoring, revenue reporting will all live in Stripe. Wire it now so it's ready. Also useful for: testing payment flows, setting up INDX top-up via card, monitoring transaction volume.
**Verdict:** ✅ CONNECTED — Session 58 (27 Jun 2026)
**Account:** `acct_1S9ldtCxINDKO284` — pre-revenue, ready for launch products.
**Status:** 0 customers, 0 products, 0 payment intents. Stripe is clean and staged for Grand Synchronicity.
**Next action:** Create products in Stripe when Sovereign Pro subscription tier is defined.

---

### 18. Tavily MCP
**What it is:** Official Tavily MCP server. 5 tools: `tavily_search` (web search), `tavily_extract` (URL content extraction), `tavily_crawl` (site crawl), `tavily_map` (site URL discovery), `tavily_research` (deep multi-step research). Replaces Firecrawl for SIINDEX research use cases.
**Install method:** Claude.ai connector (connected via Cowork session).
**Cowork compatible:** ✅ YES — live and active
**SIINDEX fit:** HIGH — Competitor intel (Uniswap, Binance, M-Pesa), market research, tokenomics analysis, regulatory news, Grand Synchronicity market timing.
**Verdict:** ✅ CONNECTED — Session 58 (27 Jun 2026)
**Note:** Supersedes Firecrawl for SIINDEX. Tavily is in the Cowork registry natively; Firecrawl is not.

---

## INSTALL ACTION LIST

### Completed:
- ✅ **Stripe MCP** — connected Session 58 (`acct_1S9ldtCxINDKO284`)
- ✅ **Tavily MCP** — connected Session 58 (replaces Firecrawl)
- ✅ **Supabase MCP** — connected Session 56

### Do Now (this session or next):
1. **GitHub MCP** — claude.com/plugins/github → SIINDEX repo
2. **Playwright MCP** — claude.com/plugins/playwright
3. **GitHub MCP** — claude.com/plugins/github → SIINDEX repo
4. **Playwright MCP** — claude.com/plugins/playwright
5. **Impeccable** — `npx impeccable install` in project root → `/impeccable init`
6. **awesomedesign.md** — Copy Revolut DESIGN.md from VoltAgent/awesome-design-md → `/ImageNation DEX/DESIGN.md`
7. **Taste Skill** — Download from nxpatterns/claude-taste-skill → add to SIINDEX skills
8. **Ponytail** — Download from DietrichGebert/ponytail → add to SIINDEX skills

### Do Soon (before launch):
9. **Last 30 Days** — mvanhorn/last30days-skill → SIINDEX skills
10. **NotebookLM MCP** — alfredang/notebooklm-mcp → add whitepaper as notebook source

### CLI Only (AJ to install from terminal):
11. **Codex Plugin** — `claude plugins install codex-plugin-cc` → use `/codex:adversarial-review` before every ship

### Already Available (use it):
12. **Skill Creator** — Already in skills marketplace → run A/B test on indx-god-mode skill

### Skip:
- **Auto Research (Karpathy)** — ML only, no SIINDEX use case
- **Obsidian MCP** — Redundant with our markdown second-brain
- **GWS CLI** — Low fit, revisit post-launch

### Future (not yet):
- **LightRAG** — Revisit when second-brain > 50 documents
- **GWS** — Revisit if Google Workspace becomes primary comms tool

---

## DESIGN.MD CANONICAL REFERENCE

Once awesomedesign.md is installed, the canonical DESIGN.md for SIINDEX screens pulls from **Revolut** as primary (dark fintech, gradient cards, precision) with **Stripe** influence (clean hierarchy, weight-300 elegance, purple system). Do NOT use generic SaaS design language.

---

*Last updated: 27 Jun 2026 — Session 56. Update this file when installs are confirmed.*
