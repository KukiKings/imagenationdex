"""
SIINDEX Voice Engine — Speech-to-Text + Text-to-Speech.

STT: Google Speech Recognition (free, requires internet)
TTS: Microsoft Edge TTS via edge-tts (free, high quality, Pacific voice)
"""

import asyncio
import io
import os
import queue
import tempfile
import threading
from pathlib import Path
from typing import Optional

import speech_recognition as sr

try:
    import edge_tts
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

try:
    import sounddevice as sd
    import numpy as np
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False

# Default TTS voice — Australian English (warm, Pacific-appropriate)
DEFAULT_VOICE  = "en-AU-NatashaNeural"
DEFAULT_RATE   = "+5%"
DEFAULT_VOLUME = "+0%"


class VoiceEngine:
    def __init__(self, voice: str = DEFAULT_VOICE, rate: str = DEFAULT_RATE):
        self.voice     = voice
        self.rate      = rate
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold        = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold         = 0.8
        self._speaking = False

    # ── TTS ──────────────────────────────────────────────────────
    def speak(self, text: str) -> None:
        """Speak text aloud. Blocks until done."""
        if not text or not text.strip():
            return
        self._speaking = True
        try:
            asyncio.run(self._async_speak(text))
        except Exception as e:
            # Fallback: just print if TTS fails
            print(f"[SIINDEX] {text}")
        finally:
            self._speaking = False

    async def _async_speak(self, text: str) -> None:
        if not TTS_AVAILABLE:
            print(f"[SIINDEX] {text}")
            return

        # Write to temp file and play
        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        tmp.close()
        try:
            communicate = edge_tts.Communicate(text, self.voice, rate=self.rate)
            await communicate.save(tmp.name)
            await self._play_audio_file(tmp.name)
        finally:
            try:
                os.unlink(tmp.name)
            except Exception:
                pass

    async def _play_audio_file(self, path: str) -> None:
        """Cross-platform audio playback."""
        import subprocess
        import sys
        if sys.platform == "darwin":
            subprocess.run(["afplay", path], check=True, capture_output=True)
        elif sys.platform == "win32":
            from playsound import playsound
            playsound(path)
        else:
            # Linux
            for player in ["mpg123", "mpg321", "ffplay", "aplay"]:
                try:
                    subprocess.run([player, path], check=True, capture_output=True)
                    return
                except (subprocess.CalledProcessError, FileNotFoundError):
                    continue
            print(f"[SIINDEX] {open(path).read() if path.endswith('.txt') else '(audio)'}")

    def speak_async(self, text: str) -> threading.Thread:
        """Speak in background thread. Returns thread."""
        t = threading.Thread(target=self.speak, args=(text,), daemon=True)
        t.start()
        return t

    # ── STT ──────────────────────────────────────────────────────
    def listen(self, timeout: int = 8, phrase_limit: int = 20) -> Optional[str]:
        """
        Listen for speech and return transcribed text.
        Returns None if nothing heard or recognition failed.
        """
        with sr.Microphone() as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=0.3)
            try:
                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_limit
                )
            except sr.WaitTimeoutError:
                return None

        try:
            text = self.recognizer.recognize_google(audio, language="en-US")
            return text.strip()
        except sr.UnknownValueError:
            return None
        except sr.RequestError as e:
            print(f"[Voice] STT service error: {e}")
            return None

    def listen_with_indicator(self, print_fn=None) -> Optional[str]:
        """Listen with a visual indicator printed to console."""
        if print_fn:
            print_fn("🎤  Listening…")
        result = self.listen()
        return result

    # ── Microphone check ─────────────────────────────────────────
    @staticmethod
    def microphone_available() -> bool:
        try:
            mics = sr.Microphone.list_microphone_names()
            return len(mics) > 0
        except Exception:
            return False

    @staticmethod
    def list_voices_hint() -> str:
        return (
            "Recommended voices:\n"
            "  en-AU-NatashaNeural  (Australian English, female — default)\n"
            "  en-AU-WilliamNeural  (Australian English, male)\n"
            "  en-NZ-MollyNeural    (New Zealand English, female)\n"
            "  en-US-AriaNeural     (US English, female)\n"
            "Run: edge-tts --list-voices | grep en-"
        )
