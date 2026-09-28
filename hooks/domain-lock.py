#!/usr/bin/env python3
"""Block plugin agents from writing outside their write domain (hooks/write-domains.json)."""
import json
import os
import re
import sys
from fnmatch import fnmatch

# ponytail: user-chosen output paths outside these globs get blocked; widen write-domains.json if needed
PREFIX = "development-workflow:"

event = json.load(sys.stdin)
agent = event.get("agent_type") or ""
if not agent.startswith(PREFIX):
    sys.exit(0)  # main session or another plugin's agent
name = agent[len(PREFIX):]

with open(os.path.join(os.path.dirname(__file__), "write-domains.json")) as f:
    domains = json.load(f)
if name not in domains:
    sys.exit(0)

tool_input = event.get("tool_input", {})
path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
cwd = event.get("cwd") or os.getcwd()
rel = os.path.relpath(os.path.abspath(os.path.join(cwd, path)), cwd)
# Writes into an isolated agent worktree are judged relative to that worktree's root
m = re.match(r"^\.claude/worktrees/[^/]+/(.+)$", rel)
if m:
    rel = m.group(1)

allowed = domains[name] + [
    f".claude/agent-memory/development-workflow-{name}/**",  # memory: project dir (":" becomes "-")
]
if not rel.startswith("..") and any(fnmatch(rel, g) for g in allowed):
    sys.exit(0)

print(f"{name} may only write to: {', '.join(domains[name]) or 'nothing (read-only agent)'}. "
      f"Blocked: {rel}. Report the needed change to your lead instead.", file=sys.stderr)
sys.exit(2)
