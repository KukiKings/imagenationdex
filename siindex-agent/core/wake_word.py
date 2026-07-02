"""
SIINDEX Wake Word Engine
=========================
Listens continuously in the background for the wake phrase.
Triggers a callback when "SIINDEX" or "Hey SIINDEX" is detected.

No external API keys needed — runs fully locally via speech_recognition.
"""

import threading
import time
from typing import Callable, Optional

import speech_recognition as sr

# Phrases that activate SIINDEX
WAKE_PHRASES = [
    "siindex",
    "hey siindex",
    "si index",
    "hey si index",
    "sii index",
    "sign index",       # common mishear
    "sovereign",        # fallback shortcut
]

# Cooldown after activation (seconds) — prevents double-triggers
COOLDOWN_SECONDS = 3.0


class WakeWordEngine:
    def __init__(self, on_wake: Callable, sensitivity: float = 0.5):
        """
        on_wake: callback fired when wake word detected.
                 Receives the full phrase heard as argument.
        sensitivity: energy threshold multiplier (0.3=sensitive, 1.0=strict)
        """
        self.on_wake      = on_wake
        self.sensitivity  = sensitivity
        self._running     = False
        self._last_wake   = 0.0
        self._thread: Optional[threading.Thread] = None
        self._recognizer  = sr.Recognizer()
        self._recognizer.energy_threshold         = 250
        self._recognizer.dynamic_energy_threshold  = True
        self._recognizer.pause_threshold           = 0.5
        self._recognizer.non_speaking_duration     = 0.3
        self._recognizer.phrase_threshold           = 0.2

    def start(self):
        """Start background wake word listening thread."""
        if self._running:
            return
        self._running = True
        self._thread  = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()
        print("[WakeWord] Listening for 'SIINDEX'…")

    def stop(self):
        """Stop the background thread."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)

    def _listen_loop(self):
        """Continuous short-listen loop — catches wake phrases quickly."""
        while self._running:
            try:
                with sr.Microphone() as source:
                    # Short ambient noise adjustment every loop
                    self._recognizer.adjust_for_ambient_noise(source, duration=0.2)
                    try:
                        # Listen for up to 3s — short windows = fast response
                        audio = self._recognizer.listen(
                            source,
                            timeout=1,
                            phrase_time_limit=3,
                        )
                    except sr.WaitTimeoutError:
                        continue

                # STT — use Google (free) with short phrase hint
                try:
                    text = self._recognizer.recognize_google(
                        audio,
                        language="en-US"
                    ).lower().strip()
                except sr.UnknownValueError:
                    continue
                except sr.RequestError:
                    time.sleep(2)
                    continue

                # Check for any wake phrase
                if self._is_wake_phrase(text):
                    now = time.time()
                    if now - self._last_wake > COOLDOWN_SECONDS:
                        self._last_wake = now
                        try:
                            self.on_wake(text)
                        except Exception as e:
                            print(f"[WakeWord] Callback error: {e}")

            except Exception as e:
                # Microphone disconnect or other error — wait and retry
                time.sleep(1)

    def _is_wake_phrase(self, text: str) -> bool:
        return any(phrase in text for phrase in WAKE_PHRASES)

    @staticmethod
    def available() -> bool:
        """Check if a microphone is available for wake word detection."""
        try:
            mics = sr.Microphone.list_microphone_names()
            return len(mics) > 0
        except Exception:
            return False
