# Development Pipeline

A 4-phase agentic development pipeline: Research → Design → Plan → Implement.
AI writes code only in the Implement phase. Every other phase is context
preparation, design, and planning — reviewed by a human before the next gate opens.

---

## Overview

**Core principle:** Pipeline beats prompts. "No mistakes" instructions don't fix
a missing engineering process.

Each phase produces artifacts that become the *only allowed input* to the next phase.
Role separation is strict: the agent that writes code does not review; reviewers
don't patch code; testers don't design.

**Key CRISPY principles applied:**
- Research questions are generated separately — sub-agents investigate facts, not what to build
- Design produces a short alignment doc before any detailed artifacts
- Plans enforce vertical slices — each phase is testable end-to-end, not layer-by-layer

**Infrastructure:**
- Team structure, models, and domain boundaries defined in `teams.yaml`
- Composable skills injected per agent from `claude/skills/shared/`
- Persistent mental models stored in `claude/expertise/development-pipeline/`
- Write boundaries enforced at prompt level and by `claude/hooks/domain-lock.sh`

---

## Pipeline Flow

```
  /development-pipeline/research
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   A: RESEARCH                                                    │
  │   research-lead                                                  │
  │   ├── research-subagent-architecture                             │
  │   ├── research-subagent-patterns                                 │
  │   ├── research-subagent-integrations   Step 1: Generate questions│
  │   ├── research-subagent-domain         Step 2: Sub-agents get    │
  │   ├── research-subagent-api                    questions (not    │
  │   ├── research-subagent-tests                  the ticket)       │
  │   └── research-subagent-fintech-domain (fintech only)            │
  └────────────────────────┬─────────────────────────────────────────┘
                           │
                           │  ✋ Human review gate — approve Research Document
                           │
                           ▼
  /development-pipeline/design
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   B: DESIGN                                                      │
  │   design                                                         │
  │   ├── [Step 1] discussion.md (~200 lines)                        │
  │   │            ✋ Human gate — approve before proceeding          │
  │   ├── [Step 2] architecture.md  (C4 diagrams)                    │
  │   │            dataflow.md      (DFD + error paths)              │
  │   │            sequence.md      (sequence diagrams)              │
  │   │            contracts.md     (API + internal interfaces)      │
  │   │            testing.md       (test cases Given/When/Then)     │
  │   │            adr.md           (architecture decisions)         │
  │   └── [Step 3] structure-outline.md (~2 pages, phase map)        │
  └────────────────────────┬─────────────────────────────────────────┘
                           │
                           │  ✋ Human review gate — approve all design artifacts
                           │
                           ▼
  /development-pipeline/plan
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   C: PLAN                                                        │
  │   plan                                                           │
  │   ├── reads structure-outline.md as authoritative phase list     │
  │   └── vertical slices only — each phase testable end-to-end      │
  └────────────────────────┬─────────────────────────────────────────┘
                           │
                           │  ✋ Human review gate — approve implementation plan
                           │
                           ▼
  /development-pipeline/implement
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   D: IMPLEMENT                                                   │
  │   implement-lead                                                 │
  │   ├── implement-coder              (writes code + tests)         │
  │   ├── reviewer-quality             (per phase, parallel)         │
  │   ├── reviewer-architecture        (per phase, parallel)         │
  │   ├── reviewer-security            (per phase, parallel)         │
  │   ├── reviewer-plan-compliance     (per phase, parallel)         │
  │   └── tester                       (runs suite after each phase) │
  └────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
                        ✅ Done — all phases committed
```

---

## Agent Map

```
Phase A — Research
──────────────────
  research-lead (orchestrator) [skills: zero-micromanagement, conversational-response]
    ├── [Step 1] generates research questions from ticket
    ├── [Step 2] launches sub-agents with questions (not the ticket)
    ├── research-subagent-architecture   layers, boundaries, modules     [haiku]
    ├── research-subagent-patterns       repositories, services, models  [haiku]
    ├── research-subagent-integrations   storage, auth, queues, APIs     [haiku]
    ├── research-subagent-domain         entities, value objects, migrations [haiku]
    ├── research-subagent-api            routes, handlers, DTOs          [haiku]
    └── research-subagent-tests          test structure, coverage, fixtures [haiku]
    Sub-agents: write domain = none (read-only)

Phase B — Design
────────────────
  design (solo, opus) [skills: conversational-response]
    ├── [Step 1] discussion.md  ← human gate before proceeding
    ├── [Step 2] architecture.md, dataflow.md, sequence.md,
    │                contracts.md, testing.md, adr.md
    └── [Step 3] structure-outline.md  ← phase map for plan agent
    Write domain: docs/design/**

Phase C — Plan
──────────────
  plan (solo) [skills: vertical-slice-enforcer, conversational-response]
    ├── reads structure-outline.md as authoritative phase list
    ├── enforces vertical slices (no horizontal layer-by-layer phases)
    └── produces: README.md + phase-01.md ... phase-NN.md
    Write domain: docs/plan/**

Phase D — Implement
───────────────────
  implement-lead (orchestrator) [skills: zero-micromanagement, conversational-response]
    ├── implement-coder              writes code + tests per phase
    │                               [skills: scope-guardian, verbose-worker]
    │                               Write domain: src/**, tests/**, config/**
    ├── [parallel per phase]
    │   ├── reviewer-quality         readability, naming, complexity
    │   ├── reviewer-architecture    layer boundaries, ADR compliance
    │   ├── reviewer-security        OWASP Top 10, auth, secrets
    │   └── reviewer-plan-compliance nothing missing, nothing extra
    │   Reviewers: [skills: actionable-reviewer], write domain = none
    │
    └── tester                       runs suite, reports failures
                                     [skills: verbose-worker], write domain = none
```

---

## Infrastructure

### teams.yaml

Defines the full team configuration per pipeline. Each agent entry specifies model override, skills list, and domain boundaries (read/write globs). Agents inherit `defaults` (model + skills) unless overridden.

```yaml
pipeline: development-pipeline
defaults:
  model: sonnet
  skills: [active-listener, mental-model]
teams:
  research:
    lead: research-lead
    skills: [zero-micromanagement, conversational-response]
    domain:
      read: ["**/*"]
      write: ["docs/research/**"]
    members:
      - name: research-subagent-architecture
        model: haiku
        skills: [factual-reporter, verbose-worker]
        domain: { read: ["**/*"], write: [] }
      # ... etc
```

### Shared Skills (`claude/skills/shared/`)

Composable prompt fragments injected into agent definitions via `teams.yaml`:

| Skill | Applies To | Purpose |
|-------|-----------|---------|
| `zero-micromanagement` | Leads, orchestrators | Delegate, never execute file changes |
| `active-listener` | All agents | Read context and expertise before acting |
| `mental-model` | All agents | Update expertise file after each session |
| `conversational-response` | Leads, orchestrators | Concise synthesized responses |
| `verbose-worker` | Workers, sub-agents | Detailed output with file paths and line numbers |
| `factual-reporter` | Research sub-agents | Facts only, no opinions or recommendations |
| `actionable-reviewer` | All reviewers | file + line + problem + required change |
| `vertical-slice-enforcer` | Plan agent | End-to-end phases, not horizontal layers |
| `scope-guardian` | Coder | No scope creep — implement plan exactly |

### Agent Expertise (`claude/expertise/development-pipeline/`)

One `.md` file per agent. Agents read their expertise file at boot and update it after each session. Compounds over time as accumulated patterns, gotchas, and decisions.

### Domain Locking

Write boundaries enforced two ways:
1. **Prompt-level** — boot preamble states allowed read/write paths
2. **Hook-level** — `claude/hooks/domain-lock.sh` blocks Write/Edit tool calls outside allowed globs

---

## Phase Reference

| Phase | Command | Lead Agent | Key Sub-Agents | Inputs | Outputs | Human Gate |
|-------|---------|-----------|----------------|--------|---------|------------|
| A: Research | `/development-pipeline/research` | `research-lead` | 6 sub-agents (parallel) | ticket, repo path | `docs/research/<feature>.md` | ✋ Approve research doc |
| B: Design | `/development-pipeline/design` | `design` | — | research doc | `discussion.md` → 6 artifacts + `structure-outline.md` | ✋ Approve discussion, then approve artifacts |
| C: Plan | `/development-pipeline/plan` | `plan` | — | design dir (incl. structure-outline) | `docs/plan/<feature>/` (N vertical-slice phases) | ✋ Approve plan |
| D: Implement | `/development-pipeline/implement` | `implement-lead` | coder + 4 reviewers + tester | plan + design + research | committed code | ✅ Review git log / open PR |

---

## Design Artifacts Reference

| Artifact | Phase | Purpose | ~Size |
|----------|-------|---------|-------|
| `docs/research/<feature>.md` | A | Factual codebase map | varies |
| `docs/design/<feature>/discussion.md` | B (early gate) | Alignment doc: current state, desired end state, patterns, open questions | ~200 lines |
| `docs/design/<feature>/architecture.md` | B | C4 diagrams | varies |
| `docs/design/<feature>/dataflow.md` | B | Data flow including error paths | varies |
| `docs/design/<feature>/sequence.md` | B | Sequence diagrams for all key scenarios | varies |
| `docs/design/<feature>/contracts.md` | B | API endpoints + internal interfaces | varies |
| `docs/design/<feature>/testing.md` | B | Test cases (Given/When/Then) | varies |
| `docs/design/<feature>/adr.md` | B | Architecture decisions | varies |
| `docs/design/<feature>/structure-outline.md` | B (late gate) | Phase map: order, key types, test checkpoints | ~2 pages |
| `docs/plan/<feature>/README.md` | C | Plan overview + phase table | varies |
| `docs/plan/<feature>/phase-NN.md` | C | Exact files, tests, acceptance criteria per phase | varies |

---

## Quick Start

### Phase A — Research

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

### Phase B — Design

```
/development-pipeline/design

Research Document path:
> docs/research/payment-failure-notification.md

Output directory for design artifacts:
> docs/design/payment-failure-notification/

Architecture standards (optional):
> No framework imports in domain layer, ADR required for any new pattern
```

### Phase C — Plan

```
/development-pipeline/plan

Design documents directory:
> docs/design/payment-failure-notification/

Output directory for plan:
> docs/plan/payment-failure-notification/

Stack context:
> PHP 8.4, Symfony 7, PHPUnit 11

Code standards:
> PSR-12, strict types, test naming: methodName_state_expected
```

### Phase D — Implement

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

---

## Agent Index

### Phase A — Research (7 agents)

| Agent | Model | Description |
|-------|-------|-------------|
| `research-lead` | sonnet | Orchestrator — generates research questions from ticket, then launches sub-agents with questions (ticket hidden), composes Research Document |
| `research-subagent-architecture` | haiku | Scans architectural layers, module boundaries, service structure |
| `research-subagent-patterns` | haiku | Scans repositories, services, domain models, controllers, data mapping |
| `research-subagent-integrations` | haiku | Scans storage, auth, queues, external HTTP APIs, environment config |
| `research-subagent-domain` | haiku | Scans entities, value objects, persistence models, relationships, migrations |
| `research-subagent-api` | haiku | Scans routes, handlers, DTOs, request validation, response formats |
| `research-subagent-tests` | haiku | Scans test structure, existing coverage, fixtures, test runner commands |

### Phase B — Design (1 agent)

| Agent | Model | Description |
|-------|-------|-------------|
| `design` | opus | Design Lead — produces `discussion.md` (alignment gate), then full C4/DFD/sequence/contracts/testing/ADR artifacts, then `structure-outline.md` (phase map for planner) |

### Phase C — Plan (1 agent)

| Agent | Model | Description |
|-------|-------|-------------|
| `plan` | sonnet | Planner — converts approved design into vertical-slice phases using `structure-outline.md` as phase authority; each phase is independently testable end-to-end |

### Phase D — Implement (7 agents)

| Agent | Model | Description |
|-------|-------|-------------|
| `implement-lead` | sonnet | Orchestrator — runs the per-phase loop: coder → gates → parallel reviews → fix loop → commit |
| `implement-coder` | sonnet | Writes production code and tests strictly per phase plan |
| `reviewer-quality` | sonnet | Reviews readability, naming, complexity, dead code, error handling |
| `reviewer-architecture` | sonnet | Reviews layer boundaries, dependency direction, ADR compliance |
| `reviewer-security` | sonnet | Reviews OWASP Top 10, injection, auth/authz, secrets — criticals block the phase |
| `reviewer-plan-compliance` | sonnet | Reviews "did we build exactly what the plan said" — catches missing work and scope creep |
| `tester` | sonnet | Runs test suite, reports failures with minimal reproductions, checks regressions |
