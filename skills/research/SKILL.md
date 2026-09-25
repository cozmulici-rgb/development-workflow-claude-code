---
name: research
description: Builds a compressed, factual map of the codebase relevant to this feature. Launches parallel sub-agents (architecture, patterns, integrations, domain, API, tests) and composes a Research Document. No opinions — facts only.
argument-hint: "<ticket> [repo-path] [output-path] [constraints]"
disable-model-invocation: true
---

# Phase A — Research

Builds a compressed, factual map of the codebase relevant to this feature.
Launches parallel sub-agents (architecture, patterns, integrations, domain, API, tests)
and composes a Research Document. No opinions — facts only.

## Inputs

- Ticket / feature description
- Repo path (absolute)
- Output path for Research Document
- Constraints (optional — stack, architecture rules, boundaries, standards location)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:research-lead` agent via the Agent tool with the inputs above.

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
When satisfied, run `/development-workflow:design`.
