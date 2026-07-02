#!/usr/bin/env python3
"""
SCORING.py — Experiment 01: Screen Load Speed
STATUS: LOCKED — Do not modify. This file is the objective measuring stick.

Scores an HTML file on composite load performance.
Usage: python SCORING.py asset.html
Returns: float score (higher = better, max ~100)
"""

import sys
import re
import json
from pathlib import Path


def score(html_path: str) -> dict:
    content = Path(html_path).read_text(encoding="utf-8")
    results = {}

    # ── 1. File size (max 35 pts) ─────────────────────────────────────────────
    size_bytes = len(content.encode("utf-8"))
    size_kb = size_bytes / 1024
    # 48 KB baseline = 0 pts. Every KB under 48 = +1 pt. Every KB over = -0.5 pt.
    BASELINE_KB = 48.0
    size_score = max(0, min(35, 35 + (BASELINE_KB - size_kb)))
    results["file_size_kb"] = round(size_kb, 1)
    results["size_score"] = round(size_score, 1)

    # ── 2. Blocking scripts (max 20 pts) ──────────────────────────────────────
    # Count <script> tags that are NOT deferred/async/type=module
    all_scripts = re.findall(r"<script[^>]*>", content, re.IGNORECASE)
    blocking = [s for s in all_scripts if not re.search(r"defer|async|type=['\"]module", s, re.IGNORECASE)]
    blocking_count = len(blocking)
    blocking_score = max(0, 20 - blocking_count * 4)
    results["blocking_scripts"] = blocking_count
    results["blocking_score"] = round(blocking_score, 1)

    # ── 3. CSS efficiency (max 20 pts) ────────────────────────────────────────
    # Extract inline CSS (between <style> tags)
    css_blocks = re.findall(r"<style[^>]*>(.*?)</style>", content, re.DOTALL | re.IGNORECASE)
    css_text = "\n".join(css_blocks)
    css_bytes = len(css_text.encode("utf-8"))
    css_kb = css_bytes / 1024

    # Count duplicate property:value patterns (sign of unoptimised CSS)
    declarations = re.findall(r"[\w-]+\s*:\s*[^;}{]+;", css_text)
    declaration_count = len(declarations)
    unique_declarations = len(set(d.strip().lower() for d in declarations))
    duplicate_ratio = 1 - (unique_declarations / max(declaration_count, 1))

    css_score = max(0, 20 - (css_kb * 0.5) - (duplicate_ratio * 15))
    results["css_kb"] = round(css_kb, 1)
    results["css_duplicate_ratio"] = round(duplicate_ratio, 3)
    results["css_score"] = round(css_score, 1)

    # ── 4. Lazy loading images (max 10 pts) ───────────────────────────────────
    img_tags = re.findall(r"<img[^>]*>", content, re.IGNORECASE)
    lazy_imgs = [t for t in img_tags if "loading" in t.lower()]
    if img_tags:
        lazy_ratio = len(lazy_imgs) / len(img_tags)
    else:
        lazy_ratio = 1.0
    lazy_score = round(lazy_ratio * 10, 1)
    results["img_count"] = len(img_tags)
    results["lazy_imgs"] = len(lazy_imgs)
    results["lazy_score"] = lazy_score

    # ── 5. HTML cleanliness (max 15 pts) ──────────────────────────────────────
    # Penalise deeply nested empty divs (layout bloat)
    empty_divs = len(re.findall(r"<div[^>]*>\s*</div>", content))
    # Penalise inline style attributes (should be in stylesheet)
    inline_styles = len(re.findall(r'\bstyle\s*=\s*["\']', content, re.IGNORECASE))
    html_score = max(0, 15 - empty_divs * 2 - inline_styles * 0.5)
    results["empty_divs"] = empty_divs
    results["inline_style_attrs"] = inline_styles
    results["html_score"] = round(html_score, 1)

    # ── Total ─────────────────────────────────────────────────────────────────
    total = size_score + blocking_score + css_score + lazy_score + html_score
    results["total_score"] = round(total, 2)

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python SCORING.py <asset.html>")
        sys.exit(1)

    path = sys.argv[1]
    results = score(path)

    print(json.dumps(results, indent=2))
    print(f"\n{'='*40}")
    print(f"  SCORE: {results['total_score']} / 100")
    print(f"{'='*40}")
