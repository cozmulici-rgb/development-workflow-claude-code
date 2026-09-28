#!/usr/bin/env python3
"""Deterministic scope gate: does the working tree diff match the phase plan's file list?

Usage: check_scope.py <phase-XX.md> [base-ref]   (base-ref defaults to HEAD)
Exit 0 = green, 1 = red.
"""
import re
import subprocess
import sys

phase, base = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "HEAD")
text = open(phase).read()


def section(title):
    m = re.search(rf"^## {title}.*?(?=^## |\Z)", text, re.M | re.S)
    return m.group(0) if m else ""


def paths(block):
    # backticked tokens in table rows that look like file paths
    rows = [l for l in block.splitlines() if l.startswith("|")]
    return {p for r in rows for p in re.findall(r"`([^`\s]+\.[A-Za-z0-9]+)`", r)}


planned = paths(section("Exact File Changes")) | paths(section("Tests to Add"))
deleted = paths(section("Exact File Changes").split("### Files to Delete")[-1]) if "### Files to Delete" in text else set()


def git(*args):
    return set(filter(None, subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout.splitlines()))


import os
plan_dir = os.path.relpath(os.path.dirname(os.path.abspath(phase))) + "/"
changed = {
    f for f in git("diff", "--name-only", base) | git("ls-files", "--others", "--exclude-standard")
    if not f.startswith((plan_dir, ".claude/")) and f != "docs/constraints.md"  # pipeline artifacts, worktrees, agent memory
}
outside = sorted(changed - planned)
untouched = sorted(planned - changed - deleted)

red = bool(outside or untouched)
print(f"UNIT      scope-gate: {phase}")
print(f"VERDICT   {'red' if red else 'green'}")
print(f"SEVERITY  {'must-fix' if red else 'none'}")
if outside:
    print(f"REASON    files changed outside the phase plan: {', '.join(outside)}")
if untouched:
    print(f"REASON    planned files not changed: {', '.join(untouched)}")
if not red:
    print(f"REASON    diff matches plan ({len(changed)} files)")
print(f"EVIDENCE  git diff --name-only {base} + untracked files vs {phase}")
print("SCOPE     " + (", ".join(outside + untouched) or "none"))
sys.exit(1 if red else 0)
