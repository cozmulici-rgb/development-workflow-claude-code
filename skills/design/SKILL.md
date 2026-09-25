---
name: design
description: Converts the Research Document into a complete architecture design: C4 diagrams, data flow, sequence diagrams, API contracts, testing strategy, and ADRs. No code is written in this phase — design only.
argument-hint: "<research-doc> [output-dir] [standards]"
disable-model-invocation: true
---

# Phase B — Design

Converts the Research Document into a complete architecture design:
C4 diagrams, data flow, sequence diagrams, API contracts, testing strategy, and ADRs.
No code is written in this phase — design only.

## Inputs

- Research Document path
- Output directory for design artifacts
- Architecture standards (optional — layering rules, naming conventions, boundary rules)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:design` agent via the Agent tool with the inputs above.

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
When satisfied, run `/development-workflow:plan`.
