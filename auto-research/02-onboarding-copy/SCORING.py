#!/usr/bin/env python3
"""
SCORING.py — Experiment 02: Onboarding Copy
STATUS: LOCKED — Do not modify. This file is the objective measuring stick.

Scores onboarding copy JSON on readability, trust signals, and brevity.
Usage: python SCORING.py asset.json
Returns: float score (higher = better, max 100)

Install: pip install textstat --break-system-packages
"""

import sys
import json
import re
from pathlib import Path

try:
    import textstat
    TEXTSTAT_AVAILABLE = True
except ImportError:
    TEXTSTAT_AVAILABLE = False
    print("WARNING: textstat not installed. Run: pip install textstat --break-system-packages", file=sys.stderr)


# ── Trust signal keywords ─────────────────────────────────────────────────────
TRUST_SIGNALS = [
    "free", "instant", "safe", "secure", "no id", "no bank", "no forms",
    "forever", "yours", "60 seconds", "immediately", "instantly", "protect",
    "guaranteed", "no charge", "at no cost"
]

# ── Jargon words that should NOT appear ──────────────────────────────────────
JARGON_WORDS = [
    "blockchain", "non-custodial", "web3", "defi", "smart contract",
    "cryptographic", "decentralized", "protocol", "mpc", "biometric",
    "passkey", "sovereign", "solana", "ethereum"
]

# ── Max word counts per field type ───────────────────────────────────────────
IDEAL_MAX_WORDS = {
    "headline": 10,
    "subheading": 20,
    "cta_": 6,        # CTA buttons
    "trust_line": 12,
    "helper_text": 15,
    "error": 15,
    "loading": 5,
}


def extract_all_copy(data: dict) -> list[str]:
    """Recursively extract all string values from the 'copy' key."""
    strings = []
    def recurse(obj):
        if isinstance(obj, str):
            strings.append(obj)
        elif isinstance(obj, dict):
            for v in obj.values():
                recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)
    recurse(data.get("copy", data))
    return strings


def word_count(text: str) -> int:
    return len(text.split())


def score(json_path: str) -> dict:
    raw = json.loads(Path(json_path).read_text(encoding="utf-8"))
    all_copy = extract_all_copy(raw)
    full_text = " ".join(all_copy).lower()
    results = {}

    # ── 1. Readability (max 30 pts) ───────────────────────────────────────────
    if TEXTSTAT_AVAILABLE:
        flesch = textstat.flesch_reading_ease(full_text)
        # Flesch: 90-100 = very easy, 60-70 = standard. We target > 70.
        # Scale: 70+ = full 30pts, 0 = 0pts, can be negative (hard text)
        readability_score = max(0, min(30, (flesch / 100) * 30))
        results["flesch_reading_ease"] = round(flesch, 1)
    else:
        # Fallback: average word length proxy (shorter words = more readable)
        words = full_text.split()
        avg_word_len = sum(len(w) for w in words) / max(len(words), 1)
        readability_score = max(0, min(30, 30 - (avg_word_len - 4) * 5))
        results["avg_word_length"] = round(avg_word_len, 2)
    results["readability_score"] = round(readability_score, 1)

    # ── 2. Trust signal density (max 25 pts) ──────────────────────────────────
    found_signals = [sig for sig in TRUST_SIGNALS if sig in full_text]
    trust_count = len(found_signals)
    # 5+ signals = full score, 0 = 0
    trust_score = min(25, trust_count * 5)
    results["trust_signals_found"] = found_signals
    results["trust_signal_count"] = trust_count
    results["trust_score"] = trust_score

    # ── 3. No jargon (max 20 pts) ─────────────────────────────────────────────
    found_jargon = [j for j in JARGON_WORDS if j in full_text]
    jargon_score = max(0, 20 - len(found_jargon) * 5)
    results["jargon_found"] = found_jargon
    results["jargon_score"] = jargon_score

    # ── 4. Brevity (max 25 pts) ───────────────────────────────────────────────
    # Penalise any copy string that's longer than its ideal max
    copy_obj = raw.get("copy", {})
    brevity_deductions = 0

    def check_brevity(obj, key_hint=""):
        nonlocal brevity_deductions
        if isinstance(obj, str):
            wc = word_count(obj)
            # Find the max for this key type
            max_words = 25  # default
            for prefix, limit in IDEAL_MAX_WORDS.items():
                if key_hint.startswith(prefix):
                    max_words = limit
                    break
            if wc > max_words:
                brevity_deductions += (wc - max_words) * 0.5
        elif isinstance(obj, dict):
            for k, v in obj.items():
                check_brevity(v, k)
        elif isinstance(obj, list):
            for item in obj:
                check_brevity(item, key_hint)

    check_brevity(copy_obj)
    brevity_score = max(0, 25 - brevity_deductions)
    results["brevity_deductions"] = round(brevity_deductions, 1)
    results["brevity_score"] = round(brevity_score, 1)

    # ── Total ─────────────────────────────────────────────────────────────────
    total = readability_score + trust_score + jargon_score + brevity_score
    results["total_score"] = round(total, 2)

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python SCORING.py <asset.json>")
        sys.exit(1)

    path = sys.argv[1]
    results = score(path)

    print(json.dumps(results, indent=2))
    print(f"\n{'='*40}")
    print(f"  SCORE: {results['total_score']} / 100")
    print(f"{'='*40}")
