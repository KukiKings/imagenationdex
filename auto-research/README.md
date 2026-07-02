# IN$DEX Auto Research System
> Karpathy's Auto Research — applied to IN$DEX. Four experiments running overnight, self-improving while you sleep.

---

## How it works

Three files per experiment:

| File | Who controls it | Purpose |
|---|---|---|
| `INSTRUCTIONS.md` | **Human only (locked)** | What to improve and the rules |
| `asset.*` | **AI iterates on this** | The thing being optimised |
| `SCORING.py` | **Human only (locked)** | The objective scoring function |

The runner reads INSTRUCTIONS, generates a variation of the asset via Claude API, scores both old and new, keeps the better one, logs everything, and loops. You wake up to a report.

---

## The four experiments

| # | Experiment | Asset | Score metric |
|---|---|---|---|
| 01 | Screen load speed | `dex-swap.html` | Composite load score (file size + blocking resources) |
| 02 | Onboarding copy | `asset.json` | Readability + trust signals + brevity |
| 03 | Agent policy | `asset.md` (SKILL.md) | Policy coverage checklist score |
| 04 | PQSI thresholds | `asset.json` | F1 score against synthetic threat test suite |

---

## Setup

```bash
cd auto-research
pip install anthropic textstat --break-system-packages
export ANTHROPIC_API_KEY=your_key_here
```

## Run

```bash
# Run all experiments indefinitely (overnight mode)
python runner.py

# Run a single experiment
python runner.py --experiment 01-screen-load

# Run N loops then stop
python runner.py --loops 10

# Dry run (score current assets, no changes)
python runner.py --dry-run
```

## Output

- `experiments.json` — full log of every experiment run
- `report.md` — human-readable summary generated at end of session

---

## Rules

1. **Never edit INSTRUCTIONS.md or SCORING.py.** These are locked. Editing them breaks the integrity of the experiment.
2. **The asset files are the only thing Auto Research touches.** All other project files are untouched.
3. **A backup of the original asset is saved as `asset.original.*`** before the first run. You can always revert.
4. **Scores only go up.** If a variation scores lower than the current best, it's discarded.

---

*Built for IN$DEX by SIINDEX Auto Research Engine — inspired by Andrej Karpathy's auto-research repo (85k+ GitHub stars)*
