---
name: fintech-review-compliance
description: Runs the fintech compliance reviewer on existing code. Checks for PCI-DSS violations, AML/KYC flow issues, audit trail gaps, sanctions screening placement, and GDPR retention problems.
argument-hint: "<path-or-diff-range> [scope]"
disable-model-invocation: true
---

# FinTech Compliance Review

Runs the fintech compliance reviewer on existing code.
Checks for PCI-DSS violations, AML/KYC flow issues, audit trail gaps,
sanctions screening placement, and GDPR retention problems.

## Inputs

- Path to review (file, directory, or git diff range)
- Compliance scope (optional — defaults to all)

Provided: $ARGUMENTS

Extract these inputs from what was provided. Ask the user only for required inputs that are missing; leave optional ones blank.

## Run

Invoke the `development-workflow:reviewer-fintech-compliance` agent via the Agent tool with the inputs above.

Pass it:
- The path or diff range to review
- The compliance scope (or "all" if blank)
- If a directory: the agent will scan all PHP files recursively
- If a git diff: the agent will focus on changed files only

## Error Handling

- **No PHP files found:** If the path contains no PHP files, the agent reports "Nothing to review — no PHP files found at the given path" and exits cleanly.
- **Invalid path:** If the path does not exist, the agent reports the error and exits.
- **Empty git diff:** If the diff range produces no changes, the agent reports "No changes to review" and exits.

## Scope

This review targets **PHP code** following fintech conventions. Non-PHP files are skipped. If your codebase uses a different language, the BCMath and PHP-specific checks will not apply — use `/development-workflow:fintech-review-compliance` for regulatory checks only.

## Output

A compliance review report with:
- Summary of findings by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Actionable findings: file, line, violation, regulatory risk, required fix
- Verdict: PASS, PASS WITH WARNINGS, or FAIL with blocking issues listed

## After review

- **FAIL:** Fix all CRITICAL issues before merging. Re-run the review after fixes.
- **PASS WITH WARNINGS:** HIGH/MEDIUM issues should be fixed before PR merge, but do not block the pipeline.
- **PASS:** No action needed — proceed with confidence.
