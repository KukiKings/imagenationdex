"""
SIINDEX Action Handlers — special commands beyond pure conversation.
"""

import json
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional

from duckduckgo_search import DDGS

from core.indx   import (
    get_indx_price, get_grand_synchronicity_countdown,
    indx_to_usd, morning_briefing_text
)
from core.memory import CitizenMemory

BASE_DIR = Path(__file__).resolve().parent.parent
APP_URL  = "https://imagenationdex.com"


class CommandHandler:
    def __init__(self, memory: CitizenMemory):
        self.memory = memory

    def handle(self, action: str, context: str = "") -> str:
        """Dispatch action to the right handler. Returns response text."""
        handlers = {
            "morning_briefing": self.morning_briefing,
            "show_balance":     self.show_balance,
            "show_wisdom":      self.show_wisdom,
            "show_countdown":   self.show_countdown,
            "web_search":       lambda: self.web_search(context),
            "open_app":         lambda: self.open_app(context),
            "save_note":        lambda: self.save_note(context),
        }
        fn = handlers.get(action)
        if fn:
            return fn()
        return ""

    # ── Actions ──────────────────────────────────────────────────
    def morning_briefing(self) -> str:
        c     = self.memory.citizen
        name  = c.get("name") or "Citizen"
        bal   = c.get("balance_indx", 0.0)
        ws    = c.get("wisdom_score",  0)
        return morning_briefing_text(name, bal, ws)

    def show_balance(self) -> str:
        c     = self.memory.citizen
        bal   = c.get("balance_indx", 0.0)
        price = get_indx_price()
        usd   = indx_to_usd(bal)
        return (
            f"Your wallet holds {bal:.4f} INDX, "
            f"worth ${usd:.2f} USD at the current genesis price of ${price:.2f}."
        )

    def show_wisdom(self) -> str:
        c    = self.memory.citizen
        ws   = c.get("wisdom_score", 0)
        rank = c.get("rank")
        rank_str = f" You're ranked #{rank} on the Sovereign leaderboard." if rank else ""
        milestones = {50: "Governance unlock", 100: "Sovereign status", 200: "Elder Council"}
        next_ms = next(
            ((threshold, label) for threshold, label in milestones.items() if ws < threshold),
            None
        )
        ms_str = f" Next milestone: {next_ms[0]} WS for {next_ms[1]}." if next_ms else " You've reached Elder level."
        return f"Your Wisdom Score is {ws} WS.{rank_str}{ms_str}"

    def show_countdown(self) -> str:
        cd = get_grand_synchronicity_countdown()
        if cd["passed"]:
            return "Grand Synchronicity has arrived. The Sovereign Economy is live."
        return (
            f"Grand Synchronicity is {cd['days']} days, {cd['hours']} hours away. "
            f"Target: $2.50 INDX. Genesis price: $0.24. "
            f"The clock is running."
        )

    def web_search(self, query: str) -> str:
        """Search the web with DuckDuckGo and return a brief summary."""
        # Extract the actual search term from the query
        clean_query = query.lower()
        for prefix in ["search for", "search", "look up", "find out about", "what is"]:
            clean_query = clean_query.replace(prefix, "").strip()
        if not clean_query:
            return "What would you like me to search for?"
        try:
            results = []
            with DDGS() as ddgs:
                for r in ddgs.text(clean_query, max_results=3):
                    results.append(r.get("body", ""))
            if results:
                combined = " ".join(results[:2])[:400]
                return f"Here's what I found: {combined}"
            return f"I searched for '{clean_query}' but didn't find clear results. Try being more specific."
        except Exception as e:
            return f"Search encountered an issue. Try again in a moment."

    def open_app(self, context: str) -> str:
        """Open the IN$DEX app in the browser."""
        # Detect which screen to open
        screen_map = {
            "wallet":    "citizen-dashboard.html",
            "dashboard": "citizen-dashboard.html",
            "swap":      "dex-swap.html",
            "trade":     "dex-swap.html",
            "leaderboard": "leaderboard.html",
            "rankings":  "leaderboard.html",
            "feed":      "feed.html",
            "social":    "feed.html",
            "send":      "send.html",
            "sovtoken":  "sovtokens.html",
            "chat":      "siindex-chat.html",
            "lend":      "lending-dashboard.html",
            "borrow":    "lending-dashboard.html",
            "savings":   "savings-goals.html",
            "join":      "join.html",
            "onboard":   "join.html",
        }
        ctx = context.lower()
        for keyword, screen in screen_map.items():
            if keyword in ctx:
                webbrowser.open(f"{APP_URL}/{screen}")
                return f"Opening {screen.replace('.html', '').replace('-', ' ')} for you."
        webbrowser.open(APP_URL)
        return "Opening the IN$DEX app for you."

    def save_note(self, context: str) -> str:
        """Save a note to citizen memory."""
        # Strip common preamble
        note = context
        for prefix in ["remember that", "remember", "note that", "save that", "note"]:
            if note.lower().startswith(prefix):
                note = note[len(prefix):].strip()
                break
        if note:
            self.memory.add_note(note)
            return f"Noted. I'll remember that."
        return "What would you like me to remember?"
