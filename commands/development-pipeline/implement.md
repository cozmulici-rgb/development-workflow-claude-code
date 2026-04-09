# Phase D — Implement

Executes the approved plan phase by phase.
For each phase: Coder writes code → automated gates run → 4 reviewers check in parallel
→ Tester verifies → fixes applied → commit. Repeat until all phases pass.

## Fill in your inputs

```
Plan directory:
> <e.g. docs/plan/my-feature/>

Design documents directory:
> <e.g. docs/design/my-feature/>

Research document path:
> <e.g. docs/research/my-feature.md>

Working directory (absolute path to repo root):
> <e.g. /Users/you/workspace/myproject>

Standards (linting command, test runner command, static analysis command):
> <e.g. "lint: vendor/bin/phpcs, tests: vendor/bin/phpunit, static: vendor/bin/phpstan">
```

## Config Resolution

Before spawning the agent, read `claude/agents/development-pipeline/teams.yaml`.
Resolve the implement team's lead skills (defaults: active-listener, mental-model +
team: zero-micromanagement, conversational-response). Set environment variables:
- `CLAUDE_AGENT_NAME=implement-lead`
- `CLAUDE_PIPELINE=development-pipeline`

When spawning sub-agents (coder, reviewers, tester), set their `CLAUDE_AGENT_NAME`
to their respective agent names from the config.

## Run

Invoke the `implement-lead` agent with the inputs above.

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
