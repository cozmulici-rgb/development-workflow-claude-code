---
name: implement
description: Executes the approved plan phase by phase. For each phase: Coder writes code → automated gates run → 4 reviewers check in parallel → Tester verifies → fixes applied → commit. Repeat until all phases pass.
argument-hint: "<plan-dir> [design-dir] [research-doc] [workdir] [standards]"
disable-model-invocation: true
---

# Phase D — Implement

Executes the approved plan phase by phase.
For each phase: Coder writes code → automated gates run → 4 reviewers check in parallel
→ Tester verifies → fixes applied → commit. Repeat until all phases pass.

## Inputs

- Plan directory
- Design documents directory
- Research document path
- Working directory (absolute path to repo root)
- Standards (linting command, test runner command, static analysis command)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Build the graph

Run the plan graph code node:

```bash
python3 "${CLAUDE_SKILL_DIR}/../pipeline-gates/plan_graph.py" <plan-dir>
```

If it exits 1, show the error to the user and stop: the plan needs fixing (unknown dependency or cycle).

## Run

**Graph mode — the graph output has `"parallel": true`.** Call the Workflow tool with `{scriptPath: "${CLAUDE_SKILL_DIR}/../../workflows/implement-graph.js"}` and args:

```json
{ "graph": <plan_graph.py output>, "pluginRoot": "${CLAUDE_SKILL_DIR}/../..",
  "workdir": "<absolute repo root>", "designDir": "...", "researchDoc": "...",
  "standards": "...", "fintech": <true if fintech scope>, "done": [], "approved": [] }
```

Before the first run, show the user the layers and which phases are `irreversible`. Those phases do not run until the user approves them by id.

The workflow runs every ready phase at once, each in its own git worktree. Per phase it calls the agents directly: `implement-coder` → gate runner (build, tests, lint, scope gate) → reviewers and `tester` in parallel with structured verdicts → fixes for red units only. Then it merges the green branches and re-runs the tests for each layer. It returns `completed`, `failed`, `heldForApproval`, `blocked`, `constraints`.

After it returns:
1. Append every `constraints` entry to `docs/constraints.md` as an `ACCEPTED / DERIVED / EVIDENCE` block (learning edge).
2. Show `failed` with reasons. A failed phase blocks everything that depends on it.
3. For `heldForApproval`, show each phase's objective and why it is irreversible, and ask the user to approve by id. Then run the workflow again with `done` = all completed ids and `approved` = the approved ids.
4. Remove merged phase worktrees and branches (`git worktree list`, `git branch`) once they are merged.

**Sequential mode — `"parallel": false`.** No two phases can run together, so worktrees add nothing. Invoke the `development-workflow:implement-lead` agent via the Agent tool with the inputs above.

Pass it:
- The plan directory (it will read all phase files)
- The design documents directory (for reviewer context)
- The research document path (for pattern reference)
- The working directory
- The standards commands

In both modes each phase runs the same loop:
  1. Coder implements the phase
  2. Deterministic gates: build + tests + lint + scope gate
  3. Parallel reviews: quality · architecture · security · plan-compliance (+ fintech reviewers)
  4. Tester runs full suite
  5. `merge_verdicts.py` builds the fix list; fix loop for red units only (max 2 rounds before human escalation)
  6. Commit on phase pass (`irreversible` lane only after human approval)

## After this phase

✅ **All phases committed.** Review the git log for phase commits.
Consider running `/finish-branch` or opening a PR for final review.
