# FinTech Designer Pipeline

A standalone fintech application design pipeline: Requirements → Design → Plan → Implement.

The Design phase runs 5 specialized sub-agents in parallel covering domain modeling,
read/write paths, technology selection, compliance, and failure analysis.

Phases C (Plan) and D (Implement) reuse the existing development-pipeline agents,
with optional fintech specialist reviewers.

---

## Overview

**Core principle:** Design fintech systems with the depth of a Lead Engineer who has
operated payment processing, ledger systems, and banking infrastructure in production.

Each phase produces artifacts reviewed by a human before the next gate opens.

**Infrastructure:**
- Team structure, models, and domain boundaries defined in `teams.yaml`
- Composable skills injected per agent from `claude/skills/shared/`
- Persistent mental models stored in `claude/expertise/fintech-designer/`
- Write boundaries enforced at prompt level and by `claude/hooks/domain-lock.sh`

---

## Pipeline Flow

```
  /fintech/design
           │
           ▼
  ┌─────────────────────┐
  │   A: REQUIREMENTS   │  requirements-gatherer (interactive)
  │                     │  Scale, consistency, compliance, geography, team, build-vs-buy
  └──────────┬──────────┘
             │
             │  ✋ Human review gate — approve requirements document
             │
             ▼
  ┌─────────────────────┐
  │   B: DESIGN         │  design-lead orchestrates 5 sub-agents in parallel:
  │                     │  ├── domain-modeler        (bounded contexts, write path)
  │                     │  ├── read-path-designer    (queries, CQRS)
  │                     │  ├── tech-selector         (storage, app, infra)
  │                     │  ├── compliance-architect  (KYC/AML/PCI/audit)
  │                     │  └── failure-analyst       (failure modes, runbooks)
  └──────────┬──────────┘
             │
             │  ✋ Human review gate — approve design document
             │
             ▼
  ┌─────────────────────┐
  │   C: PLAN           │  Reuse development-pipeline plan agent
  └──────────┬──────────┘
             │
             │  ✋ Human review gate — approve plan
             │
             ▼
  ┌─────────────────────┐
  │   D: IMPLEMENT      │  Reuse development-pipeline implement-lead
  │                     │  + fintech specialist reviewers
  └─────────────────────┘
```

---

## Agent Map

```
Phase A — Requirements
──────────────────────
  requirements-gatherer (interactive, solo) [skills: conversational-response]
  Write domain: docs/requirements/**

Phase B — Design
────────────────
  design-lead (orchestrator) [skills: zero-micromanagement, conversational-response]
    ├── domain-modeler         bounded contexts, entities, write path, state machines
    ├── read-path-designer     query patterns, CQRS evaluation
    ├── tech-selector          storage, app layer, infra, messaging, arithmetic
    ├── compliance-architect   KYC/AML, PCI-DSS, audit trail, sanctions, GDPR
    └── failure-analyst        failure modes, circuit breakers, reconciliation, runbooks
    Sub-agents: [skills: verbose-worker, factual-reporter], write domain: docs/design/**

Phase C — Plan  (reuses development-pipeline:plan)
Phase D — Implement  (reuses development-pipeline:implement-lead)
```

---

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/fintech/design` | Full pipeline: requirements → design (5 parallel sub-agents) → handoff to plan |
| `/fintech/requirements` | Requirements gathering only |
| `/fintech/review-compliance` | Run fintech compliance reviewer on existing code |
| `/fintech/review-patterns` | Run fintech patterns reviewer on existing code |

---

## Development-Pipeline Integration

Three specialist agents extend the existing development-pipeline:

| Agent | Phase | Purpose |
|-------|-------|---------|
| `reviewer-fintech-compliance` | D (review) | PCI, AML/KYC, audit trail, sanctions, GDPR checks |
| `reviewer-fintech-patterns` | D (review) | Double-entry, immutable ledger, idempotency, monetary arithmetic |
| `research-subagent-fintech-domain` | A (research) | Financial entities, ledgers, payment state machines, currency handling |

These agents are defined in `claude/agents/development-pipeline/` and listed in the development-pipeline `teams.yaml`. They are activated when running the development pipeline on fintech features.

---

## Infrastructure

### teams.yaml

Defines team configuration for this pipeline — model overrides, skills, and domain boundaries per agent. All agents inherit `defaults` (sonnet + `active-listener` + `mental-model`) unless overridden.

### Shared Skills (`claude/skills/shared/`)

Key skills used by this pipeline:

| Skill | Used By |
|-------|---------|
| `zero-micromanagement` | `design-lead` |
| `conversational-response` | `design-lead`, `requirements-gatherer` |
| `verbose-worker` | All design sub-agents |
| `factual-reporter` | All design sub-agents |
| `active-listener` | All agents (default) |
| `mental-model` | All agents (default) |

### Agent Expertise (`claude/expertise/fintech-designer/`)

One `.md` file per agent. Read at boot, updated after each session. Accumulates domain knowledge, regulatory patterns, and project-specific decisions over time.

### Domain Locking

Write boundaries enforced two ways:
1. **Prompt-level** — boot preamble states allowed read/write paths
2. **Hook-level** — `claude/hooks/domain-lock.sh` blocks Write/Edit tool calls outside allowed globs
