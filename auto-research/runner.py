#!/usr/bin/env python3
"""
IN$DEX Auto Research Runner
Inspired by Andrej Karpathy's auto-research system.

Overnight loop: read asset → generate variation via Claude → score → keep if better → log → repeat.

Usage:
  python runner.py                         # All experiments, run forever
  python runner.py --experiment 01-screen-load
  python runner.py --loops 10              # Stop after N loops
  python runner.py --dry-run               # Score only, no changes
  python runner.py --report               # Print summary of experiments.json
"""

import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
EXPERIMENTS_LOG = BASE_DIR / "experiments.json"
REPORT_FILE = BASE_DIR / "report.md"

EXPERIMENTS = [
    "01-screen-load",
    "02-onboarding-copy",
    "03-agent-policy",
    "04-pqsi-thresholds",
]

SLEEP_BETWEEN_LOOPS_SECONDS = 300   # 5 minutes between loops (like Karpathy)
SLEEP_BETWEEN_EXPERIMENTS_SECONDS = 10

MODEL = "claude-opus-4-8"


# ── Logging ───────────────────────────────────────────────────────────────────

def load_log() -> list:
    if EXPERIMENTS_LOG.exists():
        return json.loads(EXPERIMENTS_LOG.read_text())
    return []


def save_log(log: list):
    EXPERIMENTS_LOG.write_text(json.dumps(log, indent=2))


def log_entry(experiment: str, loop: int, current_score: float, new_score: float,
              result: str, change_summary: str = ""):
    log = load_log()
    log.append({
        "timestamp": datetime.now().isoformat(),
        "experiment": experiment,
        "loop": loop,
        "score_before": round(current_score, 2),
        "score_after": round(new_score, 2),
        "delta": round(new_score - current_score, 2),
        "result": result,
        "change_summary": change_summary,
    })
    save_log(log)


# ── Scoring ───────────────────────────────────────────────────────────────────

def run_scoring(exp_dir: Path, asset_path: Path) -> float:
    scoring_script = exp_dir / "SCORING.py"
    result = subprocess.run(
        [sys.executable, str(scoring_script), str(asset_path)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  ⚠ Scoring error: {result.stderr[:200]}")
        return 0.0

    # Extract the last numeric score from stdout
    lines = result.stdout.strip().split("\n")
    for line in reversed(lines):
        if "SCORE:" in line:
            try:
                score_str = line.split("SCORE:")[1].split("/")[0].strip()
                return float(score_str)
            except (IndexError, ValueError):
                pass
    return 0.0


# ── Variation generation ──────────────────────────────────────────────────────

def generate_variation(client, exp_name: str,
                       instructions: str, current_asset: str, asset_ext: str,
                       current_score: float, loop: int) -> str:
    """Ask Claude to produce ONE improved variation of the asset."""

    file_type_hint = {
        ".html": "HTML file",
        ".json": "JSON file",
        ".md": "Markdown file",
    }.get(asset_ext, "text file")

    system_prompt = f"""You are an Auto Research optimisation agent for IN$DEX.

You are given:
1. INSTRUCTIONS — what to improve and the rules (locked, do not change rules)
2. The current ASSET — the {file_type_hint} you must optimise
3. The current score — {current_score:.1f}/100 after {loop} previous iterations

Your job: produce ONE improved version of the asset.

Rules:
- Output ONLY the complete improved asset. No explanation, no preamble, no markdown fences.
- Make one focused, high-confidence change per iteration. Don't try to fix everything at once.
- Never break functionality. If unsure, make a conservative change.
- The output must be valid {file_type_hint.split()[0].upper()} (parseable, no syntax errors).
- Do not add comments explaining what you changed — the diff will show it.
- For JSON files: output only valid JSON starting with {{
- For HTML files: output the complete HTML starting with <!DOCTYPE html>
- For Markdown files: output the complete markdown starting with the YAML frontmatter ---

INSTRUCTIONS:
{instructions}
"""

    user_message = f"""Current score: {current_score:.1f}/100 (loop {loop})

Current asset:
{current_asset}

Generate an improved version now."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    variation = message.content[0].text.strip()

    # Strip any accidental markdown fences
    if variation.startswith("```"):
        lines = variation.split("\n")
        variation = "\n".join(lines[1:])
        if variation.endswith("```"):
            variation = variation[:-3].strip()

    return variation


# ── Experiment runner ─────────────────────────────────────────────────────────

def run_experiment(client, exp_name: str, loop: int,
                   dry_run: bool = False) -> dict:
    exp_dir = BASE_DIR / exp_name
    if not exp_dir.exists():
        return {"error": f"Experiment directory not found: {exp_dir}"}

    # Find asset file
    asset_files = [f for f in exp_dir.iterdir()
                   if f.stem.startswith("asset") and not f.stem.endswith("original") and not f.stem.endswith("temp")]
    if not asset_files:
        return {"error": f"No asset file found in {exp_dir}"}
    asset_file = asset_files[0]

    # Backup original on first loop
    original_backup = exp_dir / f"asset.original{asset_file.suffix}"
    if not original_backup.exists():
        shutil.copy2(asset_file, original_backup)
        print(f"  📦 Original backed up → {original_backup.name}")

    # Read instructions
    instructions_file = exp_dir / "INSTRUCTIONS.md"
    instructions = instructions_file.read_text(encoding="utf-8")

    # Score current asset
    current_score = run_scoring(exp_dir, asset_file)
    print(f"  📊 Current score: {current_score:.1f}/100")

    if dry_run:
        return {
            "experiment": exp_name,
            "loop": loop,
            "current_score": current_score,
            "result": "DRY_RUN",
        }

    # Generate variation
    print(f"  🤖 Generating variation via Claude ({MODEL})...")
    current_asset = asset_file.read_text(encoding="utf-8")

    try:
        variation = generate_variation(
            client, exp_name, instructions, current_asset,
            asset_file.suffix, current_score, loop
        )
    except Exception as e:
        print(f"  ❌ Claude API error: {e}")
        return {"experiment": exp_name, "loop": loop, "error": str(e)}

    # Write variation to temp file
    temp_file = exp_dir / f"asset_temp{asset_file.suffix}"
    temp_file.write_text(variation, encoding="utf-8")

    # Score variation
    new_score = run_scoring(exp_dir, temp_file)
    print(f"  📊 Variation score: {new_score:.1f}/100 (delta: {new_score - current_score:+.1f})")

    # Keep or revert
    if new_score > current_score:
        asset_file.write_text(variation, encoding="utf-8")
        result = "IMPROVED"
        icon = "✅"
    else:
        result = "REVERTED"
        icon = "↩️"

    # Cleanup
    temp_file.unlink(missing_ok=True)

    # Brief summary of what changed (first 120 chars of diff)
    change_summary = ""
    if result == "IMPROVED":
        orig_lines = set(current_asset.split("\n"))
        new_lines = set(variation.split("\n"))
        added = [l for l in new_lines - orig_lines if l.strip()][:3]
        change_summary = " | ".join(l.strip()[:60] for l in added)

    print(f"  {icon} {result}  →  best score now {max(current_score, new_score):.1f}/100")

    log_entry(exp_name, loop, current_score, new_score, result, change_summary)

    return {
        "experiment": exp_name,
        "loop": loop,
        "score_before": current_score,
        "score_after": new_score,
        "result": result,
    }


# ── Report generator ──────────────────────────────────────────────────────────

def generate_report():
    log = load_log()
    if not log:
        print("No experiments logged yet.")
        return

    lines = [
        "# IN$DEX Auto Research Report",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "---",
        "",
    ]

    for exp_name in EXPERIMENTS:
        exp_entries = [e for e in log if e.get("experiment") == exp_name]
        if not exp_entries:
            continue

        first = exp_entries[0]
        last = exp_entries[-1]
        improvements = [e for e in exp_entries if e.get("result") == "IMPROVED"]
        total_loops = len(exp_entries)

        best_score = max(e.get("score_after", 0) for e in exp_entries)
        baseline = first.get("score_before", 0)
        total_gain = best_score - baseline

        lines += [
            f"## {exp_name}",
            f"- **Baseline score:** {baseline:.1f}",
            f"- **Best score:** {best_score:.1f}",
            f"- **Total gain:** +{total_gain:.1f} points",
            f"- **Loops run:** {total_loops}",
            f"- **Successful improvements:** {len(improvements)}/{total_loops}",
            "",
            "| Loop | Before | After | Result |",
            "|---|---|---|---|",
        ]
        for e in exp_entries[-10:]:  # Last 10
            lines.append(
                f"| {e.get('loop','-')} | {e.get('score_before',0):.1f} | "
                f"{e.get('score_after',0):.1f} | {e.get('result','-')} |"
            )
        lines += ["", "---", ""]

    report = "\n".join(lines)
    REPORT_FILE.write_text(report, encoding="utf-8")
    print(f"\n📄 Report saved to {REPORT_FILE}")
    print(report[:500])


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="IN$DEX Auto Research Runner")
    parser.add_argument("--experiment", type=str, help="Run single experiment only")
    parser.add_argument("--loops", type=int, default=0, help="Stop after N loops (0 = forever)")
    parser.add_argument("--dry-run", action="store_true", help="Score only, no changes")
    parser.add_argument("--report", action="store_true", help="Print summary report")
    parser.add_argument("--sleep", type=int, default=SLEEP_BETWEEN_LOOPS_SECONDS,
                        help="Seconds between loops (default 300)")
    args = parser.parse_args()

    if args.report:
        generate_report()
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run and not args.report:
        print("❌ ANTHROPIC_API_KEY not set. Export it first:")
        print("   export ANTHROPIC_API_KEY=your_key_here")
        sys.exit(1)

    client = None
    if api_key:
        try:
            import anthropic as _anthropic
            client = _anthropic.Anthropic(api_key=api_key)
        except ImportError:
            print("❌ anthropic package not installed. Run:")
            print("   pip install anthropic --break-system-packages")
            sys.exit(1)

    experiments = [args.experiment] if args.experiment else EXPERIMENTS
    # Validate
    for exp in experiments:
        if not (BASE_DIR / exp).exists():
            print(f"❌ Experiment not found: {exp}")
            print(f"   Available: {EXPERIMENTS}")
            sys.exit(1)

    mode = "DRY RUN" if args.dry_run else "LIVE"
    loop_info = f"{args.loops} loops" if args.loops else "indefinitely"
    print(f"\n{'='*55}")
    print(f"  IN$DEX Auto Research Engine — {mode}")
    print(f"  Running: {', '.join(experiments)}")
    print(f"  Mode: {loop_info}  |  Sleep: {args.sleep}s between loops")
    print(f"  Model: {MODEL}")
    print(f"{'='*55}\n")

    loop = 1
    start_time = datetime.now()

    try:
        while True:
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ── Loop {loop} ─────────────────────")

            for exp_name in experiments:
                print(f"\n  🔬 Experiment: {exp_name}")
                run_experiment(client, exp_name, loop, dry_run=args.dry_run)
                if len(experiments) > 1:
                    time.sleep(SLEEP_BETWEEN_EXPERIMENTS_SECONDS)

            if args.loops and loop >= args.loops:
                print(f"\n✅ Reached {args.loops} loops. Stopping.")
                break

            elapsed = (datetime.now() - start_time).seconds // 60
            print(f"\n  ⏳ Sleeping {args.sleep}s before next loop... ({elapsed}m elapsed total)")
            time.sleep(args.sleep)
            loop += 1

    except KeyboardInterrupt:
        print("\n\n⏹ Stopped by user.")

    # Generate final report
    generate_report()


if __name__ == "__main__":
    main()
