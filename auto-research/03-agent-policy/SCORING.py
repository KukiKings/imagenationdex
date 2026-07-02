#!/usr/bin/env python3
"""
SCORING.py — Experiment 03: Agent Policy
STATUS: LOCKED — Do not modify. This file is the objective measuring stick.

Scores a SIINDEX Agent Wallet SKILL.md by checking policy coverage
against 20 canonical transaction scenarios. Uses static analysis —
no API calls needed. Checks for presence and quality of policy language.

Usage: python SCORING.py asset.md
Returns: float score (higher = better, max 100)
"""

import sys
import re
import json
from pathlib import Path


# ── The 20 test scenarios and what policy language must cover them ────────────
SCENARIOS = [
    # (scenario_id, description, required_keywords, expected_tier, points)
    {
        "id": "S01",
        "desc": "Benign small swap (<$50)",
        "required": ["t0", "proceed", "pass"],
        "tier": "T0",
        "points": 5,
    },
    {
        "id": "S02",
        "desc": "Known scam wallet in counterparty",
        "required": ["scam", "t3", "halt"],
        "tier": "T3",
        "points": 6,
    },
    {
        "id": "S03",
        "desc": "Velocity breach — 3x 30-day average in 1 hour",
        "required": ["velocity", "t2", "pause"],
        "tier": "T2",
        "points": 5,
    },
    {
        "id": "S04",
        "desc": "First-time recipient, large transfer",
        "required": ["first-time", "t1", "note"],
        "tier": "T1",
        "points": 5,
    },
    {
        "id": "S05",
        "desc": "Cross-chain bridge call requiring 2FA",
        "required": ["bridge", "2fa", "step-up"],
        "tier": "T2",
        "points": 5,
    },
    {
        "id": "S06",
        "desc": "OFAC-sanctioned counterparty wallet",
        "required": ["ofac", "t4", "block"],
        "tier": "T4",
        "points": 7,
    },
    {
        "id": "S07",
        "desc": "Unverified smart contract interaction",
        "required": ["unverified", "contract", "warn"],
        "tier": "T1",
        "points": 5,
    },
    {
        "id": "S08",
        "desc": "SIM swap detected mid-session",
        "required": ["sim", "swap", "freeze"],
        "tier": "T3",
        "points": 7,
    },
    {
        "id": "S09",
        "desc": "Gas griefing / sandwich attack pattern",
        "required": ["slippage", "simulation", "mev"],
        "tier": "T2",
        "points": 5,
    },
    {
        "id": "S10",
        "desc": "Legitimate high-value with full biometric auth",
        "required": ["biometric", "approve", "t0"],
        "tier": "T0",
        "points": 5,
    },
    {
        "id": "S11",
        "desc": "Mixer/tumbler address detected",
        "required": ["mixer", "t3"],
        "tier": "T3",
        "points": 6,
    },
    {
        "id": "S12",
        "desc": "Transaction exceeds daily cap",
        "required": ["daily", "cap", "t2"],
        "tier": "T2",
        "points": 5,
    },
    {
        "id": "S13",
        "desc": "Clipboard hijack — pasted address differs from copied",
        "required": ["clipboard", "warn"],
        "tier": "T1",
        "points": 5,
    },
    {
        "id": "S14",
        "desc": "Jailbroken device attempting transaction",
        "required": ["jailbreak", "root", "t2"],
        "tier": "T2",
        "points": 5,
    },
    {
        "id": "S15",
        "desc": "Transaction simulation shows negative expected output",
        "required": ["simulation", "expected output", "halt"],
        "tier": "T3",
        "points": 6,
    },
    {
        "id": "S16",
        "desc": "3-hop wallet graph links to known darknet",
        "required": ["graph", "hop", "t3"],
        "tier": "T3",
        "points": 6,
    },
    {
        "id": "S17",
        "desc": "Screen recording overlay active during transaction",
        "required": ["overlay", "screen", "warn"],
        "tier": "T1",
        "points": 4,
    },
    {
        "id": "S18",
        "desc": "Monthly cap breach",
        "required": ["monthly", "cap"],
        "tier": "T2",
        "points": 4,
    },
    {
        "id": "S19",
        "desc": "Token approval beyond reasonable limit",
        "required": ["approval", "unlimited"],
        "tier": "T1",
        "points": 4,
    },
    {
        "id": "S20",
        "desc": "Agent acting outside user-defined protocol allowlist",
        "required": ["allowlist", "protocol", "fail"],
        "tier": "T2",
        "points": 5,
    },
]


def score(md_path: str) -> dict:
    content = Path(md_path).read_text(encoding="utf-8").lower()
    results = {"scenarios": [], "passed": 0, "total_scenarios": len(SCENARIOS)}

    total_points = sum(s["points"] for s in SCENARIOS)
    earned_points = 0

    for scenario in SCENARIOS:
        # Check if all required keywords appear somewhere in the policy
        keyword_hits = [kw for kw in scenario["required"] if kw in content]
        passed = len(keyword_hits) == len(scenario["required"])

        partial = len(keyword_hits) / len(scenario["required"])
        points_earned = scenario["points"] if passed else round(scenario["points"] * partial * 0.5, 1)

        earned_points += points_earned
        if passed:
            results["passed"] += 1

        results["scenarios"].append({
            "id": scenario["id"],
            "desc": scenario["desc"],
            "expected_tier": scenario["tier"],
            "keywords_required": scenario["required"],
            "keywords_found": keyword_hits,
            "passed": passed,
            "points_earned": points_earned,
            "points_available": scenario["points"],
        })

    # Normalise to 100
    raw_score = (earned_points / total_points) * 100

    # ── Bonus: structural quality checks ──────────────────────────────────────
    structural_bonus = 0

    # 7-step pre-flight checklist present
    checklist_steps = len(re.findall(r"\[\d\]", content))
    if checklist_steps >= 7:
        structural_bonus += 5

    # Output format template present
    if "pre-flight:" in content and "━" in content:
        structural_bonus += 3

    # Threat tier table or clear definition
    if all(f"t{i}" in content for i in range(5)):
        structural_bonus += 2

    final_score = min(100, raw_score + structural_bonus)

    results["raw_score"] = round(raw_score, 2)
    results["structural_bonus"] = structural_bonus
    results["total_score"] = round(final_score, 2)
    results["checklist_steps_found"] = checklist_steps

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python SCORING.py <asset.md>")
        sys.exit(1)

    path = sys.argv[1]
    results = score(path)

    # Summary table
    print(f"\nScenario Results ({results['passed']}/{results['total_scenarios']} passed):")
    print(f"{'ID':<6} {'Pass':<6} {'Pts':<8} Description")
    print("-" * 60)
    for s in results["scenarios"]:
        icon = "✓" if s["passed"] else "✗"
        print(f"{s['id']:<6} {icon:<6} {s['points_earned']:.1f}/{s['points_available']:<4} {s['desc']}")

    print(f"\nStructural bonus: +{results['structural_bonus']}")
    print(f"\n{'='*40}")
    print(f"  SCORE: {results['total_score']} / 100")
    print(f"{'='*40}")
