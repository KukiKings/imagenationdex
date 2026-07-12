#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  audit.sh — IN$DEX Automated Screen Audit Pipeline
#  Version: 1.0.0 | Built: 2026-07-04 | SIINDEX CSIO
#
#  Runs all canonical violation checks on every .html screen.
#  Exit 0 = all clean. Exit 1 = violations found.
#
#  Usage:
#    bash audit.sh                  # audit all .html files
#    bash audit.sh send.html        # audit a single file
#    bash audit.sh --changed        # audit only git-changed files
#    bash audit.sh --pre-commit     # run as git pre-commit hook
#
#  Install as pre-commit hook:
#    ln -sf ../../audit.sh .git/hooks/pre-commit
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

TOTAL_FILES=0
TOTAL_VIOLATIONS=0
FAILED_FILES=()

# ── Helpers ─────────────────────────────────────────────────────
print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}══ IN\$DEX Audit Pipeline ══${RESET}"
  echo -e "${DIM}$(date '+%Y-%m-%d %H:%M:%S') | SIINDEX CSIO${RESET}"
  echo ""
}

print_rule() {
  echo -e "${DIM}────────────────────────────────────────${RESET}"
}

# Audit a single file. Returns number of violations found.
audit_file() {
  local file="$1"
  local basename
  basename="$(basename "$file")"
  local violations=0
  local messages=()

  # ── Check 1: Price violation ($0.35 — genesis price is $0.24) ──
  local price_hits
  price_hits=$(grep -n -E "0\.35\b" "$file" \
    | grep -v "cubic-bezier\|opacity\|animation\|ease\|transition\|rgba\|0\.35s\|0\.350\|[0-9]0\.35\|0\.35em\|0\.35rem" \
    || true)
  if [[ -n "$price_hits" ]]; then
    messages+=("${RED}  ✗ PRICE VIOLATION (0.35): Genesis price is 0.24 USD${RESET}")
    while IFS= read -r line; do
      messages+=("${RED}    Line: ${line}${RESET}")
    done <<< "$price_hits"
    ((violations++)) || true
  fi

  # ── Check 2: AUD / A$ currency (must be USD only) ──────────────
  local aud_hits
  aud_hits=$(grep -nF 'A$' "$file" \
    | grep -v "cubic-bezier\|opacity\|animation\|IN\$DEX\|IN\$\|URL\|href\|src\|url\|cdn\|github\|imagenation\|AUDIT-EXEMPT" \
    || true)
  if [[ -n "$aud_hits" ]]; then
    messages+=("${RED}  ✗ CURRENCY VIOLATION (A\$): All prices must be in USD${RESET}")
    while IFS= read -r line; do
      messages+=("${RED}    Line: ${line}${RESET}")
    done <<< "$aud_hits"
    ((violations++)) || true
  fi

  # ── Check 3: Forbidden recovery word terms ─────────────────────
  local seed_hits
  seed_hits=$(grep -ni "seed phrase\|seed words\|12.word\|24.word\|mnemonic" "$file" || true)
  if [[ -n "$seed_hits" ]]; then
    messages+=("${RED}  ✗ FORBIDDEN TERM: Use 'recovery words' not seed phrase / mnemonic${RESET}")
    while IFS= read -r line; do
      messages+=("${RED}    Line: ${line}${RESET}")
    done <<< "$seed_hits"
    ((violations++)) || true
  fi

  # ── Check 4: Hardcoded hex colours (must use CSS variables) ────
  local hex_hits
  hex_hits=$(grep -n -E "(background|color|border|fill|stroke)\s*:\s*#[0-9a-fA-F]{3,6}\b" "$file" \
    | grep -v "var(\|rgba(\|linear-gradient\|radial-gradient\|conic-gradient\|GOD MODE\|Cybertron\|canvas\|ctx\." \
    | grep -v "090A10\|00D4FF\|8B3FE8\|2B35D8\|00E5A0\|FFB800\|FF4D6D\|12141F\|1A1D2E\|22263A\|EAEAEA\|6B7080" \
    || true)
  if [[ -n "$hex_hits" ]]; then
    # Warn only — not a hard fail
    messages+=("${YELLOW}  ⚠ HEX COLOUR: Consider using brand CSS variables${RESET}")
  fi

  # ── Check 5: SIINDEX AI / Sovereign Intelligence violation ─────
  local ai_hits
  ai_hits=$(grep -n "SIINDEX AI\|Sovereign Intelligence\|Synthetic Intelligence AI" "$file" || true)
  if [[ -n "$ai_hits" ]]; then
    messages+=("${RED}  ✗ BRAND VIOLATION: Use 'SI' or 'SIINDEX' — never 'SIINDEX AI' or 'Sovereign Intelligence'${RESET}")
    while IFS= read -r line; do
      messages+=("${RED}    Line: ${line}${RESET}")
    done <<< "$ai_hits"
    ((violations++)) || true
  fi

  # ── Check 6: Old anon key (expired) ────────────────────────────
  local old_key_hits
  old_key_hits=$(grep -n "MN3iqtmL5H68_SIyR-UeMixCPkZJO9aMuiuCJjE3OGs" "$file" || true)
  if [[ -n "$old_key_hits" ]]; then
    messages+=("${YELLOW}  ⚠ OLD ANON KEY: Replace with canonical key ending ...vVA${RESET}")
  fi

  # ── Output ──────────────────────────────────────────────────────
  if [[ ${#messages[@]} -eq 0 ]]; then
    echo -e "  ${GREEN}✓ CLEAN${RESET}  ${basename}"
  else
    echo -e "  ${RED}✗ FAIL${RESET}   ${BOLD}${basename}${RESET}"
    for msg in "${messages[@]}"; do
      echo -e "$msg"
    done
  fi

  return $violations
}

# ── Main ─────────────────────────────────────────────────────────
print_header

# Determine file list
MODE="all"
FILES=()

for arg in "$@"; do
  case "$arg" in
    --changed)
      MODE="changed"
      ;;
    --pre-commit)
      MODE="staged"
      ;;
    *.html)
      FILES+=("$SCRIPT_DIR/$arg")
      MODE="specific"
      ;;
  esac
done

if [[ "$MODE" == "all" ]]; then
  while IFS= read -r f; do
    FILES+=("$f")
  done < <(find "$SCRIPT_DIR" -maxdepth 1 -name "*.html" | sort)
elif [[ "$MODE" == "changed" ]]; then
  while IFS= read -r f; do
    [[ "$f" == *.html ]] && FILES+=("$SCRIPT_DIR/$f")
  done < <(git -C "$SCRIPT_DIR" diff --name-only HEAD 2>/dev/null || true)
elif [[ "$MODE" == "staged" ]]; then
  while IFS= read -r f; do
    [[ "$f" == *.html ]] && FILES+=("$SCRIPT_DIR/$f")
  done < <(git -C "$SCRIPT_DIR" diff --cached --name-only 2>/dev/null || true)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo -e "${YELLOW}No HTML files to audit.${RESET}"
  exit 0
fi

echo -e "${BOLD}Auditing ${#FILES[@]} file(s)...${RESET}"
echo ""

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo -e "${YELLOW}  ⚠ Not found: $(basename "$file")${RESET}"
    continue
  fi
  ((TOTAL_FILES++)) || true
  file_violations=0
  audit_file "$file" || file_violations=$?
  if [[ $file_violations -gt 0 ]]; then
    ((TOTAL_VIOLATIONS += file_violations)) || true
    FAILED_FILES+=("$(basename "$file")")
  fi
done

# ── Summary ──────────────────────────────────────────────────────
echo ""
print_rule
echo ""

if [[ $TOTAL_VIOLATIONS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}ALL CLEAN${RESET} — ${TOTAL_FILES} file(s) passed all checks."
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}VIOLATIONS FOUND${RESET} — ${TOTAL_VIOLATIONS} violation(s) in ${#FAILED_FILES[@]} file(s):"
  for f in "${FAILED_FILES[@]}"; do
    echo -e "  ${RED}• ${f}${RESET}"
  done
  echo ""
  echo -e "${DIM}Fix all violations before git push.${RESET}"
  echo ""
  exit 1
fi
