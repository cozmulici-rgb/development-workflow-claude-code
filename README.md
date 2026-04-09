<div align="center">

# development-workflow

**Structured, multi-agent development pipelines for Claude Code**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/cozmulici-rgb/development-workflow-claude-code/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://claude.ai/code)
[![Pipelines](https://img.shields.io/badge/pipelines-2-purple.svg)](#whats-inside)

</div>

---

> **Pipeline beats prompts.**
> "Be careful and don't make mistakes" is not an engineering process.
> This plugin gives Claude Code a real one.

`development-workflow` is a Claude Code plugin that brings two production-ready agentic pipelines to your workflow. Each pipeline enforces strict phase gates — AI only writes code after research, architecture, and planning have been approved by a human. Every agent has a single, bounded responsibility. Nothing is improvised.

Install once. Run structured development on any feature, in any codebase.

---

## What's Inside

| Pipeline | Purpose | Phases |
|---|---|---|
| [**development-pipeline**](#development-pipeline) | General-purpose feature development | Research → Design → Plan → Implement |
| [**fintech-designer**](#fintech-designer) | FinTech system architecture & design | Requirements → Design → Plan → Implement |

Both pipelines share the same [shared skill library](#shared-skills) and [domain locking](#domain-locking) infrastructure.

---

## Install

```bash
claude plugin install https://github.com/cozmulici-rgb/development-workflow-claude-code.git
```

That's it. All slash commands become available immediately in your Claude Code session.

---

## Development Pipeline

A 4-phase agentic pipeline for implementing any feature. Research and design happen before a single line of code is written. Human review gates separate every phase.

### How It Works

```
/development-pipeline/research
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  A: RESEARCH                                                     │
│  research-lead                                                   │
│  ├── research-subagent-architecture   (layers, boundaries)       │
│  ├── research-subagent-patterns       (repos, services, models)  │
│  ├── research-subagent-integrations   (storage, auth, queues)    │
│  ├── research-subagent-domain         (entities, migrations)     │
│  ├── research-subagent-api            (routes, DTOs, handlers)   │
│  └── research-subagent-tests          (coverage, fixtures)       │
│  All sub-agents run in parallel. Write domain: none (read-only)  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │  ✋ Human gate — approve Research Document
                       │
                       ▼
/development-pipeline/design
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  B: DESIGN                                                       │
│  design (opus)                                                   │
│  ├── [Step 1] discussion.md — alignment doc    ✋ human gate      │
│  ├── [Step 2] architecture.md  (C4 diagrams)                     │
│  │            dataflow.md      (DFD + error paths)               │
│  │            sequence.md      (sequence diagrams)               │
│  │            contracts.md     (API + internal interfaces)       │
│  │            testing.md       (Given/When/Then test cases)      │
│  │            adr.md           (architecture decisions)          │
│  └── [Step 3] structure-outline.md — phase map  ✋ human gate    │
│  Write domain: docs/design/**                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │  ✋ Human gate — approve all design artifacts
                       │
                       ▼
/development-pipeline/plan
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  C: PLAN                                                         │
│  plan                                                            │
│  ├── reads structure-outline.md as authoritative phase list      │
│  └── vertical slices only — each phase testable end-to-end       │
│  Write domain: docs/plan/**                                      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │  ✋ Human gate — approve implementation plan
                       │
                       ▼
/development-pipeline/implement
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  D: IMPLEMENT                                                    │
│  implement-lead                                                  │
│  ├── implement-coder          (writes code + tests per phase)    │
│  ├── reviewer-quality         (readability, naming, complexity)  │
│  ├── reviewer-architecture    (layer boundaries, ADR compliance) │
│  ├── reviewer-security        (OWASP Top 10, auth, secrets)      │
│  ├── reviewer-plan-compliance (nothing missing, nothing extra)   │
│  └── tester                   (runs suite, reports failures)     │
│  Reviewers run in parallel per phase. Write domain: src/**, tests/**
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
                    ✅ All phases committed
```

### Commands

| Command | What It Does |
|---|---|
| `/development-pipeline/research` | Phase A — parallel codebase scan, produces Research Document |
| `/development-pipeline/design` | Phase B — full design artifact suite (C4, DFD, sequence, contracts, ADR) |
| `/development-pipeline/plan` | Phase C — vertical-slice implementation plan |
| `/development-pipeline/implement` | Phase D — code + parallel review loop + tester, phase by phase |

### Quick Start

**Phase A — Research**
```
/development-pipeline/research

Ticket / feature description:
> Add email notification when a payment fails

Repo path (absolute):
> /Users/you/workspace/myproject

Output path for Research Document:
> docs/research/payment-failure-notification.md

Constraints (optional):
> PHP 8.4, Clean Architecture, standards in CLAUDE.md
```

**Phase B — Design**
```
/development-pipeline/design

Research Document path:
> docs/research/payment-failure-notification.md

Output directory for design artifacts:
> docs/design/payment-failure-notification/

Architecture standards (optional):
> No framework imports in domain layer, ADR required for any new pattern
```

**Phase C — Plan**
```
/development-pipeline/plan

Design documents directory:
> docs/design/payment-failure-notification/

Output directory for plan:
> docs/plan/payment-failure-notification/

Stack context:
> PHP 8.4, Symfony 7, PHPUnit 11
```

**Phase D — Implement**
```
/development-pipeline/implement

Plan directory:
> docs/plan/payment-failure-notification/

Design documents directory:
> docs/design/payment-failure-notification/

Research document path:
> docs/research/payment-failure-notification.md

Working directory (absolute path to repo root):
> /Users/you/workspace/myproject

Standards:
> lint: vendor/bin/phpcs, tests: vendor/bin/phpunit, static: vendor/bin/phpstan
```

### Agent Reference

| Phase | Agent | Model | Role |
|---|---|---|---|
| A | `research-lead` | Sonnet | Orchestrator — generates research questions, launches sub-agents, composes Research Document |
| A | `research-subagent-architecture` | Haiku | Scans layers, module boundaries, service structure |
| A | `research-subagent-patterns` | Haiku | Scans repositories, services, domain models, controllers |
| A | `research-subagent-integrations` | Haiku | Scans storage, auth, queues, external APIs |
| A | `research-subagent-domain` | Haiku | Scans entities, value objects, persistence models, migrations |
| A | `research-subagent-api` | Haiku | Scans routes, handlers, DTOs, request validation |
| A | `research-subagent-tests` | Haiku | Scans test structure, coverage, fixtures, runner commands |
| B | `design` | Opus | Produces full design artifact suite — C4, DFD, sequence, contracts, ADR |
| C | `plan` | Sonnet | Converts approved design into vertical-slice phases |
| D | `implement-lead` | Sonnet | Orchestrates per-phase loop: code → gates → parallel reviews → fix → commit |
| D | `implement-coder` | Sonnet | Writes production code and tests strictly per phase plan |
| D | `reviewer-quality` | Sonnet | Readability, naming, complexity, dead code, error handling |
| D | `reviewer-architecture` | Sonnet | Layer boundaries, dependency direction, ADR compliance |
| D | `reviewer-security` | Sonnet | OWASP Top 10, injection, auth/authz, secrets — criticals block the phase |
| D | `reviewer-plan-compliance` | Sonnet | Did we build exactly what the plan said? Catches missing work and scope creep |
| D | `tester` | Sonnet | Runs test suite, reports failures with minimal reproductions |

---

## FinTech Designer

A specialized pipeline for designing fintech systems from scratch — payment processors, ledgers, banking infrastructure. Five domain-expert sub-agents run in parallel during the design phase, covering compliance, failure modes, and monetary arithmetic before any code is written.

### How It Works

```
/fintech/design
         │
         ▼
┌─────────────────────────────────────────────┐
│  A: REQUIREMENTS                            │
│  requirements-gatherer (interactive)        │
│  Covers: scale, consistency, compliance,    │
│  geography, team context, build-vs-buy      │
│  Write domain: docs/requirements/**         │
└──────────────────┬──────────────────────────┘
                   │
                   │  ✋ Human gate — approve Requirements Document
                   │
                   ▼
/fintech/design (continued)
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  B: DESIGN                                  │
│  design-lead orchestrates 5 sub-agents      │
│  in parallel:                               │
│  ├── domain-modeler       bounded contexts, │
│  │                        entities, write   │
│  │                        path, state       │
│  │                        machines          │
│  ├── read-path-designer   query patterns,   │
│  │                        CQRS evaluation   │
│  ├── tech-selector        storage, app,     │
│  │                        infra, messaging, │
│  │                        BCMath/DECIMAL    │
│  ├── compliance-architect KYC/AML, PCI-DSS, │
│  │                        audit trail,      │
│  │                        sanctions, GDPR   │
│  └── failure-analyst      circuit breakers, │
│                           saga failures,    │
│                           reconciliation,   │
│                           on-call runbooks  │
│  Write domain: docs/design/**               │
└──────────────────┬──────────────────────────┘
                   │
                   │  ✋ Human gate — approve Design Document
                   │
                   ▼
Plan + Implement phases reuse development-pipeline agents,
with optional fintech specialist reviewers activated.
```

### Commands

| Command | What It Does |
|---|---|
| `/fintech/design` | Full pipeline: requirements → 5-parallel-agent design → handoff to plan |
| `/fintech/requirements` | Requirements gathering session only |
| `/fintech/review-compliance` | Run fintech compliance reviewer on existing code (PCI, AML/KYC, GDPR) |
| `/fintech/review-patterns` | Run fintech patterns reviewer (double-entry, idempotency, monetary arithmetic) |

### FinTech Specialist Reviewers

Three specialist agents extend the development-pipeline's Phase D review when working on fintech features:

| Agent | Checks |
|---|---|
| `reviewer-fintech-compliance` | PCI-DSS scope, AML/KYC flows, audit trail completeness, sanctions screening, GDPR retention |
| `reviewer-fintech-patterns` | Double-entry bookkeeping, immutable ledger, idempotency keys, outbox pattern, BCMath/DECIMAL(18,4) |
| `research-subagent-fintech-domain` | Financial entities, ledger structures, payment state machines, currency handling |

---

## Shared Skills

Both pipelines compose agent behavior from a shared skill library. Skills are injected per agent via `teams.yaml` — no agent is monolithic.

| Skill | Applies To | Purpose |
|---|---|---|
| `zero-micromanagement` | Lead/orchestrator agents | Delegate — never execute file changes directly |
| `active-listener` | All agents | Read context and expertise files before acting |
| `mental-model` | All agents | Update expertise file after each session — compounds over time |
| `conversational-response` | Lead/orchestrator agents | Concise, synthesized responses — no raw dumps |
| `verbose-worker` | Worker and sub-agents | Detailed output with file paths and line numbers |
| `factual-reporter` | Research sub-agents | Facts only — no opinions, no recommendations |
| `actionable-reviewer` | All reviewers | File + line + problem + required change — no vague feedback |
| `vertical-slice-enforcer` | Plan agent | End-to-end phases only — no horizontal layer-by-layer planning |
| `scope-guardian` | Coder agent | Implement the plan exactly — no "while I'm here" changes |

---

## Domain Locking

Write boundaries are enforced two ways, so no agent can touch files outside its designated domain:

1. **Prompt-level** — each agent's boot preamble declares its allowed read/write paths
2. **Hook-level** — `claude/hooks/domain-lock.sh` blocks `Write` and `Edit` tool calls that fall outside declared globs

This means the coder cannot touch design docs. Reviewers cannot patch code. Research agents cannot write anything. The pipeline stays honest even when the model wants to "help."

---

## Agent Expertise

Each agent has a persistent `.md` expertise file under `claude/expertise/`. Agents read their file at boot and update it after each session — accumulating patterns, gotchas, and project-specific decisions over time. The longer you run the pipeline on a codebase, the sharper the agents get.

---

## Requirements

- [Claude Code](https://claude.ai/code) with plugin support
- Git repository (agents operate within your existing repo)
- No additional dependencies — the plugin is pure prompt infrastructure

---

<div align="center">

Built for developers who believe AI coding needs process, not just instructions.

**[View on GitHub](https://github.com/cozmulici-rgb/development-workflow-claude-code)** · **[Report an Issue](https://github.com/cozmulici-rgb/development-workflow-claude-code/issues)**

</div>
