# Phase A — Research

Builds a compressed, factual map of the codebase relevant to this feature.
Launches parallel sub-agents (architecture, patterns, integrations, domain, API, tests)
and composes a Research Document. No opinions — facts only.

## Fill in your inputs

```
Ticket / feature description:
> <describe what needs to be built or fixed>

Repo path (absolute):
> <e.g. /Users/you/workspace/myproject>

Output path for Research Document:
> <e.g. docs/research/my-feature.md>

Constraints (optional — stack, architecture rules, boundaries, standards location):
> <e.g. "PHP 8.4, Clean Architecture, standards in CLAUDE.md" — or leave blank>
```

## Config Resolution

Before spawning the agent, read `claude/agents/development-pipeline/teams.yaml`.
Resolve the research team's lead skills (defaults: active-listener, mental-model +
team: zero-micromanagement, conversational-response). Set environment variables:
- `CLAUDE_AGENT_NAME=research-lead`
- `CLAUDE_PIPELINE=development-pipeline`

When spawning research sub-agents, set their `CLAUDE_AGENT_NAME` to their respective
agent names from the config (e.g., `research-subagent-architecture`).

## Run

Invoke the `research-lead` agent with the inputs above.

Pass it:
- The ticket / feature description
- The repo path
- The output path
- Any constraints provided

The agent will decompose the task, launch sub-research agents in parallel, and write
the Research Document to the output path.

## After this phase

✋ **Human review gate.** Read the Research Document before proceeding.
Verify: all relevant files identified, boundaries listed, no opinions present.
When satisfied, run `/development-pipeline/design`.
