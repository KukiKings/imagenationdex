"""
Citizen Memory — persists citizen context and conversation history between sessions.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

BASE_DIR     = Path(__file__).resolve().parent.parent
MEMORY_DIR   = BASE_DIR / "memory"
CITIZEN_FILE = MEMORY_DIR / "citizen.json"
HISTORY_FILE = MEMORY_DIR / "history.json"

MEMORY_DIR.mkdir(exist_ok=True)

DEFAULT_CITIZEN = {
    "name":          "",
    "citizen_id":    "",
    "web3_domain":   "",
    "balance_indx":  0.0,
    "wisdom_score":  0,
    "rank":          None,
    "role":          "citizen",
    "nation":        "",
    "joined_date":   "",
    "last_seen":     "",
    "notes":         [],
    "preferences":   {
        "briefing_enabled": True,
        "briefing_time":    "07:00",
        "language":         "en"
    }
}


class CitizenMemory:
    def __init__(self, max_history: int = 30):
        self.max_history  = max_history
        self.citizen      = self._load_citizen()
        self.history      = self._load_history()

    # ── Citizen profile ──────────────────────────────────────────
    def _load_citizen(self) -> dict:
        if CITIZEN_FILE.exists():
            try:
                with open(CITIZEN_FILE) as f:
                    data = json.load(f)
                    # merge with defaults to handle new fields
                    return {**DEFAULT_CITIZEN, **data}
            except Exception:
                pass
        return dict(DEFAULT_CITIZEN)

    def save_citizen(self):
        self.citizen["last_seen"] = datetime.now().isoformat()
        with open(CITIZEN_FILE, "w") as f:
            json.dump(self.citizen, f, indent=2)

    def update_citizen(self, **kwargs):
        for k, v in kwargs.items():
            if k in self.citizen:
                self.citizen[k] = v
        self.save_citizen()

    def is_new_citizen(self) -> bool:
        return not self.citizen.get("name")

    # ── Conversation history ──────────────────────────────────────
    def _load_history(self) -> list:
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE) as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def save_history(self):
        with open(HISTORY_FILE, "w") as f:
            json.dump(self.history[-self.max_history:], f, indent=2)

    def add_turn(self, role: str, content: str):
        """role: 'user' or 'assistant'"""
        self.history.append({
            "role":      role,
            "content":   content,
            "timestamp": datetime.now().isoformat()
        })
        if len(self.history) > self.max_history * 2:
            self.history = self.history[-self.max_history:]
        self.save_history()

    def get_claude_messages(self) -> list:
        """Returns history in Claude API format (last N turns)."""
        return [
            {"role": m["role"], "content": m["content"]}
            for m in self.history[-self.max_history:]
        ]

    # ── Memory context string for system prompt ───────────────────
    def format_context(self) -> str:
        c = self.citizen
        lines = []
        if c.get("name"):
            lines.append(f"Citizen name: {c['name']}")
        if c.get("citizen_id"):
            lines.append(f"Citizen ID: {c['citizen_id']}")
        if c.get("web3_domain"):
            lines.append(f"Web3 domain: {c['web3_domain']}")
        if c.get("balance_indx") is not None:
            lines.append(f"INDX balance: {c['balance_indx']:.4f} INDX")
        if c.get("wisdom_score") is not None:
            lines.append(f"Wisdom Score: {c['wisdom_score']} WS")
        if c.get("rank"):
            lines.append(f"Leaderboard rank: #{c['rank']}")
        if c.get("nation"):
            lines.append(f"Nation: {c['nation']}")
        if c.get("role"):
            lines.append(f"Role: {c['role']}")
        if c.get("notes"):
            lines.append("Notes about this citizen:")
            for note in c["notes"][-5:]:
                lines.append(f"  - {note}")
        if not lines:
            lines = ["No citizen profile loaded yet — first-time setup in progress."]
        return "\n".join(lines)

    def add_note(self, note: str):
        """Save a notable fact about the citizen for future sessions."""
        ts = datetime.now().strftime("%Y-%m-%d")
        self.citizen["notes"].append(f"[{ts}] {note}")
        self.citizen["notes"] = self.citizen["notes"][-20:]  # keep last 20
        self.save_citizen()
