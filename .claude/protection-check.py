#!/usr/bin/env python3
"""
IN$DEX Pre-Tool-Use Protection Hook
Runs before any Write or Edit tool call in Claude Code.
Blocks modifications to protected files without AJ sign-off.

Exit 0 = allow · Exit 2 = block (Claude shows the message)
"""
import sys, json, os

PROTECTED = [
    "security-canon.md",
    "god-mode-canon-v12.md",
    ".claude/settings.json",
    ".claude/protection-check.py",
]

# CLAUDE.md is in CoWork root, not DEX project — protect by path substring
PROTECTED_SUBSTRINGS = [
    "CLAUDE.md",
]

def main():
    try:
        data = json.load(sys.stdin)
        tool_input = data.get("tool_input", {})
        file_path = tool_input.get("file_path", "") or tool_input.get("path", "")
        basename = os.path.basename(file_path)
        
        # Check exact protected files
        if basename in PROTECTED:
            print(f"BLOCKED: {basename} is a protected IN$DEX file.")
            print("This file requires explicit AJ sign-off before modification.")
            print("State the change you intend to make and wait for AJ to confirm.")
            sys.exit(2)
        
        # Check protected substrings (e.g. CLAUDE.md anywhere in path)
        for substr in PROTECTED_SUBSTRINGS:
            if substr in file_path:
                print(f"BLOCKED: CLAUDE.md is protected — changes require AJ approval (Three-Bucket Rule: Ask First).")
                sys.exit(2)
                
        sys.exit(0)
    except Exception:
        # On any error, allow the action (fail open, don't block work)
        sys.exit(0)

if __name__ == "__main__":
    main()
