#!/usr/bin/env python3
"""
SCORING.py — Experiment 04: PQSI Threat Detection Thresholds
STATUS: LOCKED — Do not modify. This file is the objective measuring stick.

Scores PQSI threshold parameters against a synthetic transaction test suite.
Computes Precision, Recall, and F1 score.

Usage: python SCORING.py asset.json
Returns: float score (0–100, where 100 = perfect F1)
"""

import sys
import json
from pathlib import Path


# ── Synthetic Transaction Test Suite ─────────────────────────────────────────
# Each transaction has properties and a ground-truth label.
# label: "safe" = should proceed (T0/T1 max), "threat" = should be caught (T2+)
# tier_label: the correct minimum tier that should be assigned

TEST_TRANSACTIONS = [
    # ── Safe transactions (should NOT trigger T2+) ──────────────────────────
    {
        "id": "TX001", "label": "safe", "correct_tier_min": None,
        "properties": {
            "amount_usd": 25, "velocity_ratio": 0.5, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.99, "unlimited_approval": False
        }
    },
    {
        "id": "TX002", "label": "safe", "correct_tier_min": None,
        "properties": {
            "amount_usd": 150, "velocity_ratio": 1.2, "first_time_recipient": True,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.8, "overlay_detected": False,
            "confidence": 0.90, "unlimited_approval": False
        }
    },
    {
        "id": "TX003", "label": "safe", "correct_tier_min": None,
        "properties": {
            "amount_usd": 50, "velocity_ratio": 0.8, "first_time_recipient": False,
            "wallet_graph_hops": 1, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 1.0, "overlay_detected": False,
            "confidence": 0.95, "unlimited_approval": False
        }
    },
    {
        "id": "TX004", "label": "safe", "correct_tier_min": None,
        "properties": {
            "amount_usd": 800, "velocity_ratio": 1.8, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 1.5, "overlay_detected": False,
            "confidence": 0.88, "unlimited_approval": False
        }
    },
    {
        "id": "TX005", "label": "safe", "correct_tier_min": None,
        "properties": {
            "amount_usd": 10, "velocity_ratio": 0.2, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.3, "overlay_detected": False,
            "confidence": 0.99, "unlimited_approval": False
        }
    },
    # ── Threat transactions (should trigger T2+) ────────────────────────────
    {
        "id": "TX006", "label": "threat", "correct_tier_min": "T4",
        "properties": {
            "amount_usd": 500, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": True, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.97, "unlimited_approval": False
        }
    },
    {
        "id": "TX007", "label": "threat", "correct_tier_min": "T3",
        "properties": {
            "amount_usd": 200, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": True, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.92, "unlimited_approval": False
        }
    },
    {
        "id": "TX008", "label": "threat", "correct_tier_min": "T3",
        "properties": {
            "amount_usd": 1000, "velocity_ratio": 4.5, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 5.5, "overlay_detected": False,
            "confidence": 0.82, "unlimited_approval": False
        }
    },
    {
        "id": "TX009", "label": "threat", "correct_tier_min": "T3",
        "properties": {
            "amount_usd": 300, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": True,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.99, "unlimited_approval": False
        }
    },
    {
        "id": "TX010", "label": "threat", "correct_tier_min": "T2",
        "properties": {
            "amount_usd": 150, "velocity_ratio": 3.5, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.80, "unlimited_approval": False
        }
    },
    {
        "id": "TX011", "label": "threat", "correct_tier_min": "T2",
        "properties": {
            "amount_usd": 3000, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": True,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.88, "unlimited_approval": False
        }
    },
    {
        "id": "TX012", "label": "threat", "correct_tier_min": "T3",
        "properties": {
            "amount_usd": 400, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 4, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.88, "unlimited_approval": False
        }
    },
    {
        "id": "TX013", "label": "threat", "correct_tier_min": "T2",
        "properties": {
            "amount_usd": 5000, "velocity_ratio": 2.5, "first_time_recipient": True,
            "wallet_graph_hops": 0, "contract_verified": False, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 3.0, "overlay_detected": False,
            "confidence": 0.76, "unlimited_approval": False
        }
    },
    {
        "id": "TX014", "label": "threat", "correct_tier_min": "T4",
        "properties": {
            "amount_usd": 100, "velocity_ratio": 0.5, "first_time_recipient": False,
            "wallet_graph_hops": 2, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": True, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": False,
            "confidence": 0.96, "unlimited_approval": False
        }
    },
    {
        "id": "TX015", "label": "threat", "correct_tier_min": "T2",
        "properties": {
            "amount_usd": 250, "velocity_ratio": 1.0, "first_time_recipient": False,
            "wallet_graph_hops": 0, "contract_verified": True, "device_jailbreak": False,
            "ofac_match": False, "mixer_match": False, "sim_swap_detected": False,
            "behavioural_deviation_std": 0.5, "overlay_detected": True,
            "confidence": 0.85, "unlimited_approval": True
        }
    },
]


TIER_ORDER = {"T0": 0, "T1": 1, "T2": 2, "T3": 3, "T4": 4}


def classify_transaction(tx: dict, thresholds: dict) -> str:
    """Apply thresholds to a transaction and return the assigned tier."""
    p = tx["properties"]
    t = thresholds
    tier = "T0"

    def escalate(new_tier: str):
        nonlocal tier
        if TIER_ORDER.get(new_tier, 0) > TIER_ORDER.get(tier, 0):
            tier = new_tier

    # OFAC / darknet (always T4)
    if p["ofac_match"] and p["confidence"] >= t["sanctions"]["ofac_confidence_threshold"]:
        escalate("T4")

    # Mixer (T3)
    if p["mixer_match"]:
        escalate(t["sanctions"]["mixer_match_tier"])

    # SIM swap (T3)
    if p["sim_swap_detected"]:
        escalate(t["device_health"]["sim_swap_tier"])

    # Velocity breach (T2)
    if p["velocity_ratio"] >= t["velocity"]["multiplier_for_t2_pause"]:
        if p["confidence"] >= t["confidence_minimums"]["act_on_t2_at"]:
            escalate("T2")

    # Transaction size tiers
    amount = p["amount_usd"]
    if amount >= t["transaction_size"]["t3_halt_usd"]:
        escalate("T3")
    elif amount >= t["transaction_size"]["t2_pause_usd"]:
        escalate("T2")
    elif amount >= t["transaction_size"]["t1_flag_usd"]:
        escalate("T1")

    # First-time recipient above threshold
    if p["first_time_recipient"] and amount >= t["transaction_size"]["first_time_recipient_t1_usd"]:
        escalate("T1")

    # Wallet graph hops
    if p["wallet_graph_hops"] >= t["wallet_graph"]["max_hops_before_flag"]:
        if p["confidence"] >= t["wallet_graph"]["min_confidence_to_act"]:
            escalate("T3")

    # Behavioural deviation
    dev = p["behavioural_deviation_std"]
    if dev >= t["behavioural_biometrics"]["deviation_std_for_t2"]:
        escalate("T2")
    elif dev >= t["behavioural_biometrics"]["deviation_std_for_t1"]:
        escalate("T1")

    # Jailbreak
    if p["device_jailbreak"]:
        escalate(t["device_health"]["jailbreak_tier"])

    # Overlay
    if p["overlay_detected"]:
        escalate(t["device_health"]["overlay_detection_tier"])

    # Unlimited token approval
    if p["unlimited_approval"]:
        escalate(t["approval_limits"]["unlimited_approval_tier"])

    # Unverified contract
    if not p["contract_verified"]:
        escalate(t["contract_risk"]["unverified_contract_tier"])

    return tier


def score(json_path: str) -> dict:
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    thresholds = data["thresholds"]

    tp = fp = tn = fn = 0
    tx_results = []

    for tx in TEST_TRANSACTIONS:
        assigned_tier = classify_transaction(tx, thresholds)
        assigned_order = TIER_ORDER.get(assigned_tier, 0)

        is_flagged = assigned_order >= 2  # T2+ = flagged as threat
        is_actual_threat = tx["label"] == "threat"

        if is_flagged and is_actual_threat:
            tp += 1
            outcome = "TP"
        elif is_flagged and not is_actual_threat:
            fp += 1
            outcome = "FP"
        elif not is_flagged and not is_actual_threat:
            tn += 1
            outcome = "TN"
        else:
            fn += 1
            outcome = "FN"

        tx_results.append({
            "id": tx["id"],
            "label": tx["label"],
            "assigned_tier": assigned_tier,
            "outcome": outcome,
        })

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    # Normalise F1 to 0–100 scale
    total_score = round(f1 * 100, 2)

    return {
        "transactions": tx_results,
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "total_score": total_score,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python SCORING.py <asset.json>")
        sys.exit(1)

    path = sys.argv[1]
    results = score(path)

    print(f"\nTransaction Results:")
    print(f"{'ID':<8} {'Label':<10} {'Tier':<6} {'Outcome'}")
    print("-" * 40)
    for tx in results["transactions"]:
        print(f"{tx['id']:<8} {tx['label']:<10} {tx['assigned_tier']:<6} {tx['outcome']}")

    print(f"\nTP:{results['tp']}  FP:{results['fp']}  TN:{results['tn']}  FN:{results['fn']}")
    print(f"Precision: {results['precision']}  Recall: {results['recall']}  F1: {results['f1']}")
    print(f"\n{'='*40}")
    print(f"  SCORE: {results['total_score']} / 100  (F1 × 100)")
    print(f"{'='*40}")
