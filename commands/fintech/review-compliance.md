# FinTech Compliance Review

Runs the fintech compliance reviewer on existing code.
Checks for PCI-DSS violations, AML/KYC flow issues, audit trail gaps,
sanctions screening placement, and GDPR retention problems.

## Fill in your inputs

```
Path to review (file, directory, or git diff range):
> <e.g. src/Services/PaymentService.php, src/Services/, or "git diff origin/main">

Compliance scope (optional — defaults to all):
> <e.g. "PCI-DSS, audit trail" — or leave blank for all checks>
```

## Config Resolution

Before spawning the agent, read `claude/agents/development-pipeline/teams.yaml`.
Resolve the reviewer-fintech-compliance agent's skills (defaults: active-listener,
mental-model + member: actionable-reviewer). Set environment variables:
- `CLAUDE_AGENT_NAME=reviewer-fintech-compliance`
- `CLAUDE_PIPELINE=development-pipeline`

## Run

Invoke the `reviewer-fintech-compliance` agent with the inputs above.

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

This review targets **PHP code** following fintech conventions. Non-PHP files are skipped. If your codebase uses a different language, the BCMath and PHP-specific checks will not apply — use `/fintech/review-compliance` for regulatory checks only.

## Output

A compliance review report with:
- Summary of findings by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Actionable findings: file, line, violation, regulatory risk, required fix
- Verdict: PASS, PASS WITH WARNINGS, or FAIL with blocking issues listed

## After review

- **FAIL:** Fix all CRITICAL issues before merging. Re-run the review after fixes.
- **PASS WITH WARNINGS:** HIGH/MEDIUM issues should be fixed before PR merge, but do not block the pipeline.
- **PASS:** No action needed — proceed with confidence.
