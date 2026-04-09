---
agent: research-lead
pipeline: development-pipeline
last_updated: 2026-04-02
session_count: 1
---

## Observations

- This repo is a Claude Code plugin (`claude/.claude-plugin/plugin.json`). All agent definitions are markdown files with YAML frontmatter under `claude/agents/<pipeline>/`. Slash commands are markdown files under `claude/commands/<pipeline>/`.
- The `teams.yaml` files are the single source of truth for agent models, skills, and write domains. Three pipelines each have their own: `development-pipeline`, `fintech-designer`, `orchestrator`.
- Skills (`claude/skills/shared/*.md`) are composable prompt fragments. As of this session, there is no observed automated injection mechanism — agents self-read their expertise files via a "Boot Sequence" section and skills appear to be referenced by convention, not by automated prepending.
- The `config: teams.yaml` and `expertise:` frontmatter fields in agent files may be Claude Code-native fields (purpose at runtime not confirmed from files alone).
- The `color:` frontmatter field appears in all agents but its runtime purpose was not documented in any examined file.
- Domain locking is fully implemented via `claude/hooks/domain-lock.sh` (shell + inline Python) registered in `.claude/settings.json`. It reads `CLAUDE_AGENT_NAME` + `CLAUDE_PIPELINE` env vars and blocks writes outside allowed globs.
- The only existing Python CLI in the repo is `prompt-bench` (`claude/benchmarks/`), built with Click + Rich + pyyaml. It is a reference pattern for CLI tooling.
- The `claude/minibeads/` directory is a separate Python package used only by the orchestrator pipeline, not by the development-pipeline agents.

## Patterns Noticed

- All pipelines share the same `teams.yaml` schema (version 1): `pipeline`, `defaults`, `teams` with leads and optional `members`.
- Agent frontmatter is consistent: `name`, `description`, `tools`, `model`, `color`, `config`, `expertise`.
- Human gate pattern: each slash command file ends with a "After this phase" section explaining the gate before the next command.
- Artifact path convention: `docs/research/<feature>.md`, `docs/design/<feature>/`, `docs/plan/<feature>/`.
- Sub-agent dispatch: leads use the Claude Code `Task` tool to invoke sub-agents in parallel.

## Risks & Pitfalls

- Skills injection mechanism is unclear — if a runner needs to inject skills into agent prompts, the mechanism must be designed.
- The `CLAUDE_AGENT_NAME` env var must be set before agent spawn for domain locking to function. If a runner spawns agents without setting this, domain locking silently allows all writes (fail-open behavior at line 16 of `domain-lock.sh`).
- teams.yaml is parsed line-by-line in `domain-lock.sh` (no pyyaml). The parse logic has known limitations with complex YAML structures.

## Key Decisions Made

- Fintech sub-agent was not dispatched (ticket is not fintech-related).
- Research was conducted directly (no Task sub-agents) because this is a self-research session on the pipeline repo itself.

## Architecture Notes

- The development-pipeline has 4 phases: Research (A), Design (B), Plan (C), Implement (D). Each is a distinct Claude Code agent with defined inputs, outputs, and domain boundaries.
- Phase D (implement-lead) uses the TodoWrite tool for phase tracking — this is the only agent with explicit state tracking tooling.
- No existing automated pipeline runner exists. The 4 phases are currently invoked manually via slash commands.
