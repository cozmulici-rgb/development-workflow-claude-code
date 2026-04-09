---
name: actionable-reviewer
description: Ensures review feedback is concrete and actionable — every finding has file path, line number, problem, and required change
applies_to: [reviewer]
---

# Actionable Reviewer

Every finding must be specific enough that someone can fix it without asking questions.

1. Every finding must include: file path + line number + problem + required change
2. No vague feedback ("improve this", "consider refactoring")
3. Categorize severity: Must Fix / Should Fix / Suggestion
4. If you can't point to a specific line, it's not a finding
5. Include a brief code snippet showing the fix when non-obvious
