"""
SIINDEX Agent Setup
Run this once before main.py to verify the environment.
"""

import subprocess
import sys
import json
import os
from pathlib import Path

BASE_DIR      = Path(__file__).resolve().parent
SETTINGS_FILE = BASE_DIR / "config" / "settings.json"
MEMORY_DIR    = BASE_DIR / "memory"

def check(label, ok):
    symbol = "✓" if ok else "✗"
    status = "OK" if ok else "MISSING"
    print(f"  {symbol}  {label:<30} {status}")
    return ok

def main():
    print("\n  SIINDEX Agent — Setup Check\n  " + "─" * 40)

    all_ok = True

    # Python version
    v = sys.version_info
    ok = v.major == 3 and v.minor >= 11
    all_ok &= check(f"Python {v.major}.{v.minor}", ok)
    if not ok:
        print("     ↳ Python 3.11+ required. https://python.org")

    # Dependencies
    packages = {
        "anthropic":         "anthropic",
        "speech_recognition":"SpeechRecognition",
        "edge_tts":          "edge-tts",
        "rich":              "rich",
        "requests":          "requests",
        "duckduckgo_search": "duckduckgo-search",
        "bs4":               "beautifulsoup4",
        "psutil":            "psutil",
    }
    for mod, pkg in packages.items():
        try:
            __import__(mod)
            ok = True
        except ImportError:
            ok = False
        all_ok &= check(pkg, ok)
        if not ok:
            print(f"     ↳ pip install {pkg}")

    # Microphone
    try:
        import speech_recognition as sr
        mics = sr.Microphone.list_microphone_names()
        ok = len(mics) > 0
        all_ok &= check("Microphone detected", ok)
        if not ok:
            print("     ↳ Connect a microphone or run with --text flag")
    except Exception:
        all_ok &= check("Microphone check", False)

    # API key
    try:
        with open(SETTINGS_FILE) as f:
            s = json.load(f)
        key = s.get("anthropic_api_key", "")
        ok = bool(key) and key != "YOUR_ANTHROPIC_API_KEY_HERE"
        all_ok &= check("Anthropic API key", ok)
        if not ok:
            print("     ↳ Edit config/settings.json → anthropic_api_key")
            print("     ↳ Get key: https://console.anthropic.com")
    except Exception:
        all_ok &= check("config/settings.json", False)

    # Memory dir
    MEMORY_DIR.mkdir(exist_ok=True)
    check("Memory directory", True)

    # TTS voice test
    try:
        import asyncio, edge_tts
        async def _test():
            voices = await edge_tts.list_voices()
            return any(v["ShortName"] == "en-AU-NatashaNeural" for v in voices)
        ok = asyncio.run(_test())
        all_ok &= check("TTS voice (NatashaNeural)", ok)
    except Exception:
        all_ok &= check("TTS voice check", False)
        print("     ↳ pip install edge-tts")

    print("\n  " + "─" * 40)
    if all_ok:
        print("  ✓  All checks passed. Run: python main.py\n")
    else:
        print("  ✗  Fix issues above, then run: python main.py\n")
        print("  Quick install: pip install -r requirements.txt\n")

if __name__ == "__main__":
    main()
