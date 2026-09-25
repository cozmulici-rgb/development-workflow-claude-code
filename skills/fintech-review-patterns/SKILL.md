---
name: fintech-review-patterns
description: Runs the fintech patterns reviewer on existing code. Validates double-entry bookkeeping, immutable ledger, idempotency keys, outbox pattern, monetary arithmetic (BCMath, DECIMAL), and state machine integrity.
argument-hint: "<path-or-diff-range> [focus]"
disable-model-invocation: true
---

# FinTech Patterns Review

Runs the fintech patterns reviewer on existing code.
Validates double-entry bookkeeping, immutable ledger, idempotency keys,
outbox pattern, monetary arithmetic (BCMath, DECIMAL), and state machine integrity.

## Inputs

- Path to review (file, directory, or git diff range)
- Focus areas (optional — defaults to all)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:reviewer-fintech-patterns` agent via the Agent tool with the inputs above.

Pass it:
- The path or diff range to review
- The focus areas (or "all" if blank)
- If a directory: the agent will scan all PHP files recursively
- If a git diff: the agent will focus on changed files only

## Error Handling

- **No PHP files found:** If the path contains no PHP files, the agent reports "Nothing to review — no PHP files found at the given path" and exits cleanly.
- **Invalid path:** If the path does not exist, the agent reports the error and exits.
- **Empty git diff:** If the diff range produces no changes, the agent reports "No changes to review" and exits.

## Scope

This review targets **PHP code** following fintech conventions (BCMath/DECIMAL(18,4), Laravel patterns). Non-PHP files are skipped. The monetary arithmetic checks (BCMath, float detection) are PHP-specific — for other languages, the double-entry, immutable ledger, and idempotency checks still apply.

## Output

A patterns review report with:
- Summary of findings by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Actionable findings: file, line, pattern violated, risk, required fix
- Pattern compliance matrix (per-pattern status)
- Verdict: PASS, PASS WITH WARNINGS, or FAIL with blocking issues listed

## After review

- **FAIL:** Fix all CRITICAL issues (float arithmetic, mutable ledger, missing idempotency) before merging. Re-run the review after fixes.
- **PASS WITH WARNINGS:** HIGH/MEDIUM issues should be addressed before PR merge.
- **PASS:** No action needed — patterns correctly implemented.
