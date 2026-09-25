---
name: fintech-requirements
description: Runs just the requirements gathering phase for a fintech system. Use when you want to capture requirements before committing to a full design.
argument-hint: "<feature> [output-path] [constraints]"
disable-model-invocation: true
---

# FinTech Requirements — Standalone

Runs just the requirements gathering phase for a fintech system.
Use when you want to capture requirements before committing to a full design.

## Inputs

- Feature description (what fintech system to design)
- Output path
- Constraints (optional — any known regulations, geography, team size)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:requirements-gatherer` agent via the Agent tool with the inputs above.

Pass it:
- The feature description
- The output path
- Any constraints provided

The agent will ask you questions one at a time covering:
1. **Scale** — TPS, users, retention, growth
2. **Consistency** — strong vs eventual, latency tolerance
3. **Compliance** — PCI-DSS, PSD2, AML/KYC, GDPR, SOC2
4. **Geography** — markets, currencies, data residency
5. **Team** — stack, size, maturity, deployment model
6. **Build vs Integrate** — core vs commodity components

## Output

A structured requirements document at the output path with these sections:

1. **Scale Requirements** — peak TPS, average TPS, users/accounts, retention, growth trajectory
2. **Consistency Requirements** — strong vs eventual per operation, max latency
3. **Compliance Scope** — regulations list with notes, certification needs
4. **Geography** — markets, currencies, data residency
5. **Team Context** — stack, team size, maturity, deployment model
6. **Idempotency & Monetary Precision** — retry safety, decimal precision, rounding, FX
7. **Build vs Integrate Decisions** — per-component decision table with rationale
8. **Open Questions** — anything unresolved needing clarification

## Error Handling

- **Skipped questions:** If you skip a question, the agent will mark that category N/A with your reason. All 7 categories must be addressed or explicitly skipped.
- **Vague answers:** The agent will push back on vague answers ("some", "a few", "probably") and ask for concrete numbers.
- **Contradictory constraints:** If answers contradict (e.g., "zero latency" + "eventual consistency OK"), the agent will flag and ask for resolution.

## After this phase

✋ **Review the requirements document.**
When satisfied, run `/development-workflow:fintech-design` to proceed with the full design pipeline,
or use the requirements as input for your own design process.
