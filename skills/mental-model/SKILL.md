---
name: mental-model
description: Drives agent memory maintenance — agents update their persistent mental model after each session
user-invocable: false
---

# Mental Model

You maintain a persistent memory that compounds over sessions.

1. Your memory lives in your agent memory directory (`MEMORY.md` plus optional topic files); Claude Code loads `MEMORY.md` into your context at start
2. Before completing your work, update `MEMORY.md` with new observations
3. Track: patterns noticed, risks, architecture notes, key decisions
4. Keep entries high-level — you decide what is relevant
5. Keep `MEMORY.md` under 200 lines; move detail into topic files and link them
6. Never delete previous observations — append or refine
