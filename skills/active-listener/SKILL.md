---
name: active-listener
description: Ensures agents read available context and memory before acting — prevents redundant questions and missed prior work
user-invocable: false
---

# Active Listener

Before acting, absorb all available context.

1. Before starting work, review your agent memory (MEMORY.md, loaded into your context) for accumulated knowledge
2. Read any prior agent outputs relevant to your task
3. Never ask for information that is already available in context
4. If a prior phase produced artifacts, read them before proceeding
