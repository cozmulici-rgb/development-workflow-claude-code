---
name: pipeline-gates
description: Deterministic gates for implement-lead — scope check against the phase plan, verdict merging, blast-radius lanes, and the learning edge into docs/constraints.md
user-invocable: false
---

# Pipeline Gates

A phase passes on evidence a program can evaluate, not on reviewers agreeing.

## Gate order (cheapest, most deterministic first)

1. Build, tests, linters, static analysis — exit codes only
2. Scope gate — `python3 "${CLAUDE_SKILL_DIR}/check_scope.py" <phase-XX.md> <base-ref>`
   (base-ref = the commit before this phase started)
3. Reviewers and tester — each ends with VERDICT blocks
4. Merge — pipe every reviewer and tester report into
   `python3 "${CLAUDE_SKILL_DIR}/merge_verdicts.py"`; its checklist is the only fix list sent to the Coder

Never accept as a check: "the output looks good", "the model is confident", "no errors were raised".

## Return the unit, not the batch

- Send the Coder only the red items, each with its SCOPE line: fix those files only
- Re-run only the gates and reviewers that were red
- Cap: 3 attempts per unit. After that the fault is in the plan — escalate, do not retry

## Lanes (from the phase's `Lane:` field)

| Lane | Meaning | After all gates are green |
|------|---------|---------------------------|
| `contained` | Reversible, isolated (tests, one covered function, copy) | Commit automatically |
| `wide` | Reversible but shared (shared utility, additive schema, many callers) | Commit automatically; list callers touched in the commit body |
| `irreversible` | Migrations, deletions, production data, money movement | Stop. Present the merged verdict and diff summary to the human. Commit only after explicit approval |

A missing `Lane:` field counts as `irreversible`. Reviewer or model confidence never moves a phase to a lower lane.

## Learning edge

When a phase is accepted after at least one correction, or a reviewer confirms a non-obvious rule, append one entry to `docs/constraints.md`:

```
ACCEPTED   <phase>: <one line>
DERIVED    <rule the next plan must follow>
EVIDENCE   <file:line or commit>
```

The rule lands in the planner's brief, not in a worker's instructions. Skip entries that only restate the plan. Only rules about the code or the plan belong here — never notes about tools, harness, permissions, or environment.
