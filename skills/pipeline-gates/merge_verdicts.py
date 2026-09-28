#!/usr/bin/env python3
"""Code node: merge VERDICT blocks from reviewer/tester reports into one fix checklist.

Reads all reports on stdin. Exit 0 = every unit green, 1 = at least one red.
"""
import re
import sys

ORDER = {"critical": 0, "must-fix": 1, "should-fix": 2, "suggestion": 3, "none": 4}
blocks = []
for chunk in re.split(r"(?m)^(?=UNIT\s)", sys.stdin.read()):
    if not chunk.startswith("UNIT"):
        continue
    b = {}
    for line in chunk.splitlines():
        m = re.match(r"^(UNIT|VERDICT|SEVERITY|REASON|EVIDENCE|SCOPE)\s+(.*)$", line)
        if m:
            b[m.group(1)] = (b.get(m.group(1), "") + "; " + m.group(2)).lstrip("; ")
    if "VERDICT" in b:
        blocks.append(b)

seen, red = set(), []
for b in blocks:
    key = (b.get("EVIDENCE", "").lower(), b.get("REASON", "").lower())
    if b["VERDICT"].strip().lower() == "red" and key not in seen:
        seen.add(key)
        red.append(b)
red.sort(key=lambda b: ORDER.get(b.get("SEVERITY", "must-fix").strip().lower(), 1))

units = sorted({b.get("UNIT", "?").split(":")[0] for b in blocks})
print(f"UNITS     {len(units)} ({', '.join(units)})")
print(f"VERDICT   {'red' if red or not blocks else 'green'}")
for i, b in enumerate(red, 1):
    print(f"{i}. [{b.get('SEVERITY', 'must-fix')}] {b.get('UNIT', '?')}: {b.get('REASON', '')}")
    print(f"   evidence: {b.get('EVIDENCE', '-')} | scope: {b.get('SCOPE', '-')}")
if not blocks:
    print("REASON    no VERDICT blocks found — treat as red, re-request structured verdicts")
sys.exit(1 if red or not blocks else 0)
