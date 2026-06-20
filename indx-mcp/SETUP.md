# IN$DEX MCP — Setup (5 minutes)

## Step 1 — Install dependencies
Open Terminal, paste this:
```bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/indx-mcp" && npm install
```

## Step 2 — Copy env file
```bash
cp .env.example .env
```
The anon key is already filled in. No changes needed unless you want write access (award_wisdom) — in which case add your Supabase service role key.

## Step 3 — Add to Claude settings
Open Claude → Settings → Developer → Edit Config, and add this block inside `"mcpServers"`:

```json
"indx-mcp": {
  "command": "node",
  "args": ["/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX/indx-mcp/index.js"],
  "env": {
    "SUPABASE_URL": "https://zljgthfzbalsunuoohcd.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjM3MjUsImV4cCI6MjA1ODYzOTcyNX0.SRSVRhNYKBRuFqMBpBaFyshFAVafxqBiPGj6N2ZwYGo"
  }
}
```

## Step 4 — Restart Claude
Quit and reopen Claude. The MCP will appear as "indx-mcp" in your connectors.

## What you can now ask Claude (or any AI):
- "Get platform stats for IN$DEX"
- "Look up citizen mamaNoe.index"
- "How many days until L99 launch?"
- "Award 10 wisdom points to citizen [id] for completing their first stake"
- "Show me all active marketplace listings"
- "What are the active MemeDAO governance proposals?"

## Tools available
| Tool | What it does |
|---|---|
| get_platform_stats | Citizens, Wisdom tiers, listings, referrals, days to L99 |
| get_citizen | Lookup by id, domain, or email |
| get_citizens | List with filters (wisdom range, genesis only) |
| get_wisdom_score | Score + tier + points to next milestone |
| award_wisdom | Add wisdom points with reason logged |
| get_listings | Marketplace listings with filters |
| get_referral_stats | Referral count, completed, INDX earned |
| get_governance | Active MemeDAO proposals |
| get_days_to_launch | Days to 24 September 2026 |
