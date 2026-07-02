# Experiment 04 — PQSI Threat Detection Thresholds
## STATUS: LOCKED — Do not modify. Human eyes only.

---

## Objective

Optimise the PQSI 2.0 threat detection threshold parameters in `asset.json` to maximise the F1 score against the synthetic transaction test suite in SCORING.py.

F1 score = the harmonic mean of Precision and Recall.
- **Precision:** Of transactions we flagged, how many were actually threats?
- **Recall:** Of actual threats, how many did we catch?

A perfect F1 = 1.0. We want > 0.90.

---

## What `asset.json` contains

The file defines numeric thresholds for each PQSI detection layer:

- **Velocity thresholds** — how much larger than the 30-day average triggers a T2 pause
- **Graph hop depth** — how many wallet graph hops before a "dirty" connection triggers a flag
- **Confidence minimums** — minimum confidence % before acting on a threat signal
- **Transaction size tiers** — dollar amounts that unlock each threat tier escalation
- **Behavioural deviation sensitivity** — how far from biometric baseline before a flag
- **First-time recipient threshold** — amount above which a first-time transfer triggers T1

---

## What you are allowed to change

- Any numeric value in `asset.json`
- You may adjust thresholds up or down
- You may fine-tune confidence levels
- You may adjust the velocity multiplier

## What you must NOT change

- The JSON keys or structure
- The tier names (T0–T4)
- Any threshold that would allow OFAC-sanctioned wallets to proceed (OFAC block is non-negotiable)
- The SIM swap detection (must always trigger T3 minimum)
- You may not set any threshold to 0 or to infinity (both are invalid)

---

## The tradeoff you are navigating

Too sensitive → false positives → legitimate users blocked → bad UX
Too permissive → missed threats → users get scammed → catastrophic

The scoring function rewards the F1 balance. Pure recall (catch everything) or pure precision (only flag certainties) both score lower than a balanced F1.

---

## Target

F1 > 0.90. Baseline is approximately 0.72 (too many false negatives — real threats slipping through on low-confidence signals).
