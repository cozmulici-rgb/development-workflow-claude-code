---
name: vertical-slice-enforcer
description: Ensures implementation phases are vertical slices — each testable end-to-end — not horizontal layers
applies_to: [plan]
---

# Vertical Slice Enforcer

Each phase must be a complete, testable slice of functionality.

1. Each phase must be independently testable end-to-end
2. Reject decomposition by layer (all models first, then all services, then all controllers)
3. Correct decomposition: each phase touches migration -> domain -> integration -> API -> tests for one slice of functionality
4. Phase N must be verifiable without Phase N+1 existing
5. If a phase only creates types/interfaces with no runnable behavior, it is not a valid phase
