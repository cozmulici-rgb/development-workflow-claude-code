---
name: plan
description: Converts approved design documents into a phased implementation plan. Each phase is independently implementable, testable, and reviewable. No code is written — only the plan that governs what gets written.
argument-hint: "<design-dir> [output-dir] [stack] [standards]"
disable-model-invocation: true
---

# Phase C — Plan

Converts approved design documents into a phased implementation plan.
Each phase is independently implementable, testable, and reviewable.
No code is written — only the plan that governs what gets written.

## Inputs

- Design documents directory
- Output directory for plan
- Stack context (language, framework, test runner)
- Code standards (linting rules, naming conventions, test conventions, CI constraints)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:plan` agent via the Agent tool with the inputs above.

Pass it:
- The design documents directory (it will read all files within)
- The output directory
- The stack context
- Any code standards provided

The agent will produce:
- `README.md` — plan overview with phase list and dependencies
- `phase-01.md` through `phase-NN.md` — one file per implementation phase,
  each with exact files to create/modify, tests to write, and acceptance criteria

## After this phase

✋ **Human review gate.** Read the full plan before proceeding.
Verify: phases are sized correctly, acceptance criteria are verifiable, no invented scope.
When satisfied, run `/development-workflow:implement`.
