"""
SIINDEX Brain — Claude API integration with SIINDEX persona.
"""

import json
import os
import re
from pathlib import Path
from typing import Optional, Generator

import anthropic

from core.indx   import SIINDEX_SYSTEM_PROMPT, get_grand_synchronicity_countdown, get_indx_price
from core.memory import CitizenMemory

BASE_DIR     = Path(__file__).resolve().parent.parent
SETTINGS_FILE = BASE_DIR / "config" / "settings.json"


def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        with open(SETTINGS_FILE) as f:
            s = json.load(f)
    else:
        s = {}
    # .env / environment always takes precedence
    if os.getenv("ANTHROPIC_API_KEY"):
        s["anthropic_api_key"] = os.getenv("ANTHROPIC_API_KEY")
    if os.getenv("SIINDEX_MODEL"):
        s["model"] = os.getenv("SIINDEX_MODEL")
    return s


class SIINDEXBrain:
    def __init__(self, memory: CitizenMemory):
        self.settings = load_settings()
        self.memory   = memory
        self.client   = anthropic.Anthropic(
            api_key=self.settings["anthropic_api_key"]
        )
        self.model    = self.settings.get("model", "claude-haiku-4-5-20251001")

    def _build_system_prompt(self) -> str:
        memory_context = self.memory.format_context()
        countdown      = get_grand_synchronicity_countdown()
        price          = get_indx_price()

        live_context = (
            f"LIVE DATA:\n"
            f"- INDX price: ${price:.2f} USD\n"
            f"- Grand Synchronicity countdown: {countdown['phrase']}\n"
        )

        full_context = memory_context + "\n\n" + live_context
        return SIINDEX_SYSTEM_PROMPT.replace("{memory_context}", full_context)

    def think(self, user_input: str, stream: bool = False):
        """
        Send user input to Claude, return SIINDEX response.
        Returns full string if stream=False.
        Returns generator of text chunks if stream=True.
        """
        # Add user turn to history
        self.memory.add_turn("user", user_input)

        system = self._build_system_prompt()
        messages = self.memory.get_claude_messages()

        if stream:
            return self._stream_response(system, messages)
        else:
            return self._full_response(system, messages)

    def _full_response(self, system: str, messages: list) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            system=system,
            messages=messages,
        )
        text = response.content[0].text
        self.memory.add_turn("assistant", text)
        return text

    def _stream_response(self, system: str, messages: list) -> Generator:
        full_text = []
        with self.client.messages.stream(
            model=self.model,
            max_tokens=512,
            system=system,
            messages=messages,
        ) as stream:
            for chunk in stream.text_stream:
                full_text.append(chunk)
                yield chunk

        full_response = "".join(full_text)
        self.memory.add_turn("assistant", full_response)

    def morning_briefing(self) -> str:
        """Generate a personalised morning briefing."""
        c = self.memory.citizen
        name = c.get("name") or "Citizen"
        prompt = (
            f"Give me a morning briefing. Keep it under 4 sentences. "
            f"Include INDX price, my balance, Wisdom Score, and the Grand Synchronicity countdown. "
            f"Speak in your sovereign voice."
        )
        return self.think(prompt)

    def onboard_citizen(self) -> list:
        """Return questions to ask a new citizen on first run."""
        return [
            ("name",     "What's your first name?"),
            ("nation",   "Which nation or island are you from?"),
            ("role",     "Are you joining as a seller, buyer, creator, or business?"),
            ("domain",   "What would you like as your IN$DEX web3 domain? (e.g. yourname.indx)"),
        ]

    def interpret_command(self, text: str) -> Optional[str]:
        """
        Detect action keywords in text, return action name or None.
        Used to trigger special handlers beyond pure conversation.
        """
        t = text.lower()
        if any(w in t for w in ["morning briefing", "briefing", "good morning"]):
            return "morning_briefing"
        if any(w in t for w in ["my balance", "my wallet", "how much indx"]):
            return "show_balance"
        if any(w in t for w in ["wisdom score", "my score", "my rank"]):
            return "show_wisdom"
        if any(w in t for w in ["grand synchronicity", "countdown", "how long until"]):
            return "show_countdown"
        if any(w in t for w in ["search", "look up", "find out", "what is the latest"]):
            return "web_search"
        if any(w in t for w in ["open the app", "open indx", "launch", "go to"]):
            return "open_app"
        if any(w in t for w in ["remember", "note that", "save that"]):
            return "save_note"
        return None
