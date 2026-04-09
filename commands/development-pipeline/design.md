# Phase B — Design

Converts the Research Document into a complete architecture design:
C4 diagrams, data flow, sequence diagrams, API contracts, testing strategy, and ADRs.
No code is written in this phase — design only.

## Fill in your inputs

```
Research Document path:
> <e.g. docs/research/my-feature.md>

Output directory for design artifacts:
> <e.g. docs/design/my-feature/>

Architecture standards (optional — layering rules, naming conventions, boundary rules):
> <e.g. "Clean Architecture, no framework imports in domain layer" — or leave blank>
```

## Config Resolution

Before spawning the agent, read `claude/agents/development-pipeline/teams.yaml`.
Resolve the design team's lead skills (defaults: active-listener, mental-model +
team: conversational-response). Set environment variables:
- `CLAUDE_AGENT_NAME=design`
- `CLAUDE_PIPELINE=development-pipeline`

## Run

Invoke the `design` agent with the inputs above.

Pass it:
- The Research Document path (read it first)
- The output directory
- Any architecture standards provided

The agent will produce these artifacts in the output directory:
- `architecture.md` — C4 diagrams (Context, Container, Component)
- `dataflow.md` — Data flow including error paths
- `sequence.md` — Sequence diagrams for all key scenarios
- `contracts.md` — API and internal interface contracts
- `testing.md` — Test strategy and explicit test cases (Given/When/Then)
- `adr.md` — Architecture Decision Records

## After this phase

✋ **Human review gate.** Read all design artifacts before proceeding.
Verify: all scenarios covered, security considered, test cases explicit, ADRs documented.
When satisfied, run `/development-pipeline/plan`.
