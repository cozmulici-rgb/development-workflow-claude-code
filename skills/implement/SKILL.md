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

## Run

Invoke the `development-workflow:implement-lead` agent via the Agent tool with the inputs above.

Pass it:
- The plan directory (it will read all phase files)
- The design documents directory (for reviewer context)
- The research document path (for pattern reference)
- The working directory
- The standards commands

The agent will execute each phase in the plan using this loop:
  1. Coder implements the phase
  2. Automated gates: build + tests + lint
  3. Parallel reviews: quality · architecture · security · plan-compliance
  4. Tester runs full suite
  5. Fix loop for any failures (max 2 rounds before human escalation)
  6. Commit on phase pass

## After this phase

✅ **All phases committed.** Review the git log for phase commits.
Consider running `/finish-branch` or opening a PR for final review.
