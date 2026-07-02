"""
SIINDEX Vision — Screen Awareness
===================================
Takes a screenshot of the user's screen and sends it to Claude Vision.
SIINDEX can then describe what the citizen is looking at and advise.

Trigger phrases:
  "what am I looking at"
  "what's on my screen"
  "help me with this"
  "what do you see"
"""

import base64
import io
import os
from pathlib import Path
from typing import Optional

import anthropic

# Optional — mss is fastest for cross-platform screenshots
try:
    import mss
    import mss.tools
    MSS_AVAILABLE = True
except ImportError:
    MSS_AVAILABLE = False

try:
    from PIL import Image, ImageGrab
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


VISION_SYSTEM_PROMPT = """You are SIINDEX, the Sovereign Intelligence of IN$DEX.
You are looking at a screenshot of the citizen's screen.
Describe what you see, focusing on any IN$DEX app screens if visible.
Give specific, actionable advice relevant to what's displayed.
Keep your response under 4 sentences — you will be speaking this aloud.
Refer to the citizen in second person. Be their sovereign advisor."""


class VisionEngine:
    def __init__(self, api_key: str, model: str = "claude-opus-4-8"):
        # Vision requires a capable model — use Sonnet or Opus
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model  = model if "haiku" not in model else "claude-sonnet-4-6"

    def capture_screen(self) -> Optional[bytes]:
        """
        Capture the primary screen. Returns JPEG bytes or None.
        Tries mss first (fastest), falls back to PIL ImageGrab.
        """
        # Method 1: mss
        if MSS_AVAILABLE:
            try:
                with mss.mss() as sct:
                    monitor = sct.monitors[1]  # primary screen
                    sct_img = sct.grab(monitor)
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                    buf = io.BytesIO()
                    # Resize to max 1280px wide to keep token count manageable
                    img.thumbnail((1280, 800), Image.LANCZOS)
                    img.save(buf, format="JPEG", quality=75)
                    return buf.getvalue()
            except Exception as e:
                print(f"[Vision] mss error: {e}")

        # Method 2: PIL ImageGrab (macOS/Windows)
        if PIL_AVAILABLE:
            try:
                img = ImageGrab.grab()
                buf = io.BytesIO()
                img.thumbnail((1280, 800), Image.LANCZOS)
                img.save(buf, format="JPEG", quality=75)
                return buf.getvalue()
            except Exception as e:
                print(f"[Vision] PIL error: {e}")

        return None

    def describe_screen(self, context: str = "") -> str:
        """
        Capture screen and ask Claude to describe it.
        context: optional extra info from citizen's request.
        """
        img_bytes = self.capture_screen()
        if not img_bytes:
            return (
                "I can't access your screen right now. "
                "Make sure screen capture permissions are granted in System Settings."
            )

        img_b64 = base64.standard_b64encode(img_bytes).decode("utf-8")

        user_text = context or "What am I looking at? Give me your sovereign read on this screen."

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=300,
                system=VISION_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type":       "base64",
                                "media_type": "image/jpeg",
                                "data":       img_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": user_text,
                        },
                    ],
                }],
            )
            return response.content[0].text

        except anthropic.BadRequestError:
            return "I couldn't process that screen capture. Try again in a moment."
        except Exception as e:
            return f"Vision check failed: {str(e)[:80]}"

    def is_indx_app_visible(self) -> bool:
        """Quick check if the IN$DEX web app is likely on screen."""
        # Check window titles (platform-specific)
        try:
            import subprocess, sys
            if sys.platform == "darwin":
                result = subprocess.run(
                    ["osascript", "-e",
                     'tell app "System Events" to get name of every window of every process'],
                    capture_output=True, text=True, timeout=3
                )
                return "imagenationdex" in result.stdout.lower() or "IN$DEX" in result.stdout
        except Exception:
            pass
        return False

    @staticmethod
    def vision_trigger_phrases() -> list[str]:
        return [
            "what am i looking at",
            "what's on my screen",
            "what do you see",
            "help me with this",
            "read my screen",
            "what is this",
            "explain this screen",
            "look at my screen",
        ]

    @staticmethod
    def available() -> bool:
        return MSS_AVAILABLE or PIL_AVAILABLE
