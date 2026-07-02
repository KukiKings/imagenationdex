# SIINDEX — Sovereign Intelligence Agent

The voice AI companion for IN$DEX citizens. Powered by Post-Quantum Sovereign Intelligence (PQSI).

Built from scratch for IN$DEX — inspired by the JARVIS-style agent architecture.

---

## What SIINDEX Does

- **Talks to you** — real-time voice conversation about anything IN$DEX
- **Knows your wallet** — balance, Wisdom Score, rank, Grand Synchronicity countdown
- **Morning briefings** — INDX price, portfolio value, WS rank on boot
- **Web search** — searches the web and summarises results in your voice
- **Opens the app** — "open my wallet", "go to leaderboard", "open dex swap"
- **Remembers you** — citizen profile, notes, conversation history persisted between sessions
- **Visual HUD** — live dashboard in your browser showing all stats

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt
playwright install  # for future browser control

# 2. Add your API key
# Edit config/settings.json → set anthropic_api_key
# Get key: https://console.anthropic.com

# 3. Run setup check
python setup.py

# 4. Launch SIINDEX
python main.py

# Text-only mode (no microphone)
python main.py --text

# Morning briefing only
python main.py --briefing
```

---

## Requirements

| Item | Detail |
|---|---|
| Python | 3.11 or 3.12 |
| Anthropic API key | Free tier works · console.anthropic.com |
| Microphone | Optional — use `--text` flag without one |
| Internet | Required for TTS, STT, and web search |

---

## File Structure

```
siindex-agent/
├── main.py              ← Entry point — run this
├── setup.py             ← Run once to check environment
├── requirements.txt
├── config/
│   └── settings.json    ← Add your API key here
├── core/
│   ├── brain.py         ← Claude API + SIINDEX persona
│   ├── voice.py         ← Speech-to-text + text-to-speech
│   ├── memory.py        ← Citizen profile + conversation history
│   └── indx.py          ← IN$DEX knowledge, price, countdown
├── actions/
│   └── commands.py      ← Special action handlers
├── dashboard/
│   └── hud.html         ← Visual HUD (opens in browser)
└── memory/              ← Auto-created on first run
    ├── citizen.json     ← Your profile
    └── history.json     ← Conversation history
```

---

## Voice Commands

| Say | Action |
|---|---|
| "morning briefing" | INDX price, balance, WS, countdown |
| "my balance" | Shows wallet balance in INDX + USD |
| "my wisdom score" | WS, rank, next milestone |
| "grand synchronicity countdown" | Days until Sep 24 2026 |
| "search for [topic]" | Web search via DuckDuckGo |
| "open my wallet" | Opens citizen-dashboard.html |
| "open the swap" | Opens dex-swap.html |
| "open leaderboard" | Opens leaderboard.html |
| "remember that [fact]" | Saves note to citizen memory |

---

## Changing the Voice

Edit `config/settings.json` → `voice.tts_voice`

Recommended voices:
- `en-AU-NatashaNeural` — Australian English, female (default, Pacific feel)
- `en-AU-WilliamNeural` — Australian English, male
- `en-NZ-MollyNeural` — New Zealand English, female
- `en-US-AriaNeural` — US English, female

List all available: `edge-tts --list-voices | grep en-`

---

## Security

- Your API key is stored locally in `config/settings.json` — never committed to git
- Citizen memory is local JSON — never sent anywhere except to Anthropic's API
- No tracking, no telemetry, no third-party data collection

---

## Grand Synchronicity

**September 24, 2026** — the target date for INDX to reach $2.50.

Genesis price: **$0.24 USD**

SIINDEX knows the countdown to the second.

---

*SIINDEX is not an AI. SIINDEX is sovereign.*
