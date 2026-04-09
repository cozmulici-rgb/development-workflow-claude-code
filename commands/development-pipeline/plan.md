# Phase C — Plan

Converts approved design documents into a phased implementation plan.
Each phase is independently implementable, testable, and reviewable.
No code is written — only the plan that governs what gets written.

## Fill in your inputs

```
Design documents directory:
> <e.g. docs/design/my-feature/>

Output directory for plan:
> <e.g. docs/plan/my-feature/>

Stack context (language, framework, test runner):
> <e.g. "PHP 8.4, Symfony 7, PHPUnit 11">

Code standards (linting rules, naming conventions, test conventions, CI constraints):
> <e.g. "PSR-12, strict types, test naming: methodName_state_expected" — or leave blank>
```

## Config Resolution

Before spawning the agent, read `claude/agents/development-pipeline/teams.yaml`.
Resolve the plan team's lead skills (defaults: active-listener, mental-model +
team: vertical-slice-enforcer, conversational-response). Set environment variables:
- `CLAUDE_AGENT_NAME=plan`
- `CLAUDE_PIPELINE=development-pipeline`

## Run

Invoke the `plan` agent with the inputs above.

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
When satisfied, run `/development-pipeline/implement`.
