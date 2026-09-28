#!/usr/bin/env python3
"""Code node: turn a plan directory into a phase dependency graph (JSON on stdout).

Usage: plan_graph.py <plan-dir>
Reads the README.md phase table (Phase | File | Objective | Dependencies | Lane) and each
phase file's `Lane:` line. Exit 1 on unknown dependencies or cycles.
"""
import json
import os
import re
import sys

LANES = ["contained", "wide", "irreversible"]
plan_dir = sys.argv[1].rstrip("/")
readme = open(os.path.join(plan_dir, "README.md")).read()


def fail(msg):
    print(json.dumps({"error": msg}))
    sys.exit(1)


phases = []
for row in readme.splitlines():
    cells = [c.strip() for c in row.strip().strip("|").split("|")]
    if len(cells) < 4 or not re.fullmatch(r"\d+", cells[0]):
        continue
    pid = f"{int(cells[0]):02d}"
    file = os.path.join(plan_dir, cells[1].strip("`"))
    deps = [f"{int(n):02d}" for n in re.findall(r"\d+", cells[3])] if "none" not in cells[3].lower() else []
    lanes = [cells[4].lower()] if len(cells) > 4 and cells[4].lower() in LANES else []
    if os.path.exists(file):
        m = re.search(r"^Lane:\s*(\w+)", open(file).read(), re.M)
        if m and m.group(1).lower() in LANES:
            lanes.append(m.group(1).lower())
    # missing lane = irreversible; README and phase file disagree = the stricter one
    lane = max(lanes, key=LANES.index) if lanes else "irreversible"
    phases.append({"id": pid, "file": file, "deps": deps, "lane": lane})

if not phases:
    fail("no phase rows found in README.md table")
ids = {p["id"] for p in phases}
for p in phases:
    unknown = set(p["deps"]) - ids
    if unknown or p["id"] in p["deps"]:
        fail(f"phase {p['id']} has invalid dependencies: {sorted(unknown) or p['id']}")

layers, placed = [], set()
while len(placed) < len(phases):
    layer = sorted(p["id"] for p in phases if p["id"] not in placed and set(p["deps"]) <= placed)
    if not layer:
        fail(f"dependency cycle among phases {sorted(ids - placed)}")
    layers.append(layer)
    placed |= set(layer)

print(json.dumps({"phases": phases, "layers": layers, "parallel": any(len(l) > 1 for l in layers)}, indent=2))
