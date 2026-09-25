---
name: fintech-design
description: Runs the complete fintech design pipeline: Phase A (requirements gathering) → Phase B (5 parallel design sub-agents) → handoff to Plan.
argument-hint: "<feature> [repo-path] [output-dir] [constraints]"
disable-model-invocation: true
---

# FinTech Design — Full Pipeline

Runs the complete fintech design pipeline:
Phase A (requirements gathering) → Phase B (5 parallel design sub-agents) → handoff to Plan.

Produces an 8-section fintech design document covering architecture, domain model,
write path, data model, technology stack, compliance, failure modes, and MVP path.

## Inputs

- Feature description (what fintech system to design)
- Repo path (optional — for existing codebase context)
- Output directory
- Constraints (optional — regulations, geography, team size)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:design-lead` agent via the Agent tool with the inputs above.

Pass it:
- The feature description
- The repo path (if provided)
- The output directory
- Any constraints provided

The agent will:
1. Run `requirements-gatherer` — interactive Q&A with you
2. ✋ Present requirements doc for your approval
3. Dispatch 5 sub-agents in parallel (domain-modeler, read-path-designer, tech-selector, compliance-architect, failure-analyst)
4. Compose the 8-section design document

## Output

Two files in the output directory:
- `requirements.md` — structured requirements from Phase A
- `design.md` — 8-section fintech design document from Phase B

## Error Handling

- **Sub-agent timeout/failure:** The design-lead will attempt to fill gaps from failed sub-agents. If a critical agent (compliance-architect, domain-modeler) fails, you will be warned and can choose to re-run or proceed with gaps marked.
- **Incomplete Q&A:** If requirements gathering produces vague or contradictory answers, the requirements-gatherer will challenge them. If unresolved, they appear in the "Open Questions" section — address before approving.
- **Invalid repo path:** If the provided repo path doesn't exist, agents skip codebase scanning and design for greenfield.

## After this phase

✋ **Human review gate.** Read the design document before proceeding.
Verify: all 8 sections complete, technology choices justified, compliance addressed, failure modes realistic.
When satisfied, run `/development-workflow:plan` with:
- Design documents directory = your output directory
- The fintech design doc as the primary design input
