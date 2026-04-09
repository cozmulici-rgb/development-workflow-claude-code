# FinTech Design — Full Pipeline

Runs the complete fintech design pipeline:
Phase A (requirements gathering) → Phase B (5 parallel design sub-agents) → handoff to Plan.

Produces an 8-section fintech design document covering architecture, domain model,
write path, data model, technology stack, compliance, failure modes, and MVP path.

## Fill in your inputs

```
Feature description (what fintech system to design):
> <e.g. "Design a multi-currency payment processing platform for European merchants">

Repo path (optional — for existing codebase context):
> <e.g. /Users/you/workspace/myproject — or leave blank for greenfield>

Output directory:
> <e.g. docs/design/fintech/payment-platform/ — default: docs/design/fintech/<feature>/>

Constraints (optional — regulations, geography, team size):
> <e.g. "PCI-DSS, PSD2, GDPR, EU-only, team of 8, PHP Laravel stack" — or leave blank>
```

## Config Resolution

Before spawning the agent, read `claude/agents/fintech-designer/teams.yaml`.
Resolve the design team's lead skills (defaults: active-listener, mental-model +
team: zero-micromanagement, conversational-response). Set environment variables:
- `CLAUDE_AGENT_NAME=design-lead`
- `CLAUDE_PIPELINE=fintech-designer`

When spawning sub-agents (domain-modeler, read-path-designer, tech-selector,
compliance-architect, failure-analyst), set their `CLAUDE_AGENT_NAME` to their
respective agent names from the config.

## Run

Invoke the `design-lead` agent with the inputs above.

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
When satisfied, run `/development-pipeline/plan` with:
- Design documents directory = your output directory
- The fintech design doc as the primary design input
