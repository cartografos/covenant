<p align="center">
  <img src="assets/logo-sendero.svg" alt="cartógrafos" width="640" />
</p>

# covenant

A Claude Code plugin for Spec-Driven Development — from product idea to working code through rigorous specification, structured planning, and automated quality gates.

```
/covenant:prd → /covenant:spec → /covenant:plan → /covenant:implement
```

---

## What It Does

covenant enforces a disciplined engineering workflow:

1. **PRD** — define the problem before the solution (problem-first, hypothesis-driven)
2. **Spec** — turn the PRD into a rigorous specification with RFC 2119 language, approval gates, and verifiable requirements
3. **Plan** — analyze the codebase and generate a step-by-step implementation plan with exact types, signatures, and done-when criteria
4. **Implement** — execute the plan with automated testing, correctness review, and documentation after every phase

All artifacts are saved under `.covenant/` in your project:

```
.covenant/
  designs/  ← architecture blueprints
  prds/     ← product requirements documents
  specs/    ← technical specifications
  plans/    ← implementation plans (numbered phase files)
```

---

## Installation

### Requirements

- [Claude Code](https://claude.ai/code) CLI installed

### Install

Run these two commands from your terminal (not the IDE):

```bash
/plugin marketplace add cartografos/covenant
/plugin install covenant@cartografos
```

Or point directly at a local checkout:

```bash
claude --plugin-dir /path/to/covenant
```

### Verify

Open a project and run:

```bash
/covenant:explore "how is this codebase organized?"
```

---

## Commands

### Core Pipeline

| Command | Description |
|---|---|
| `/covenant:prd` | Interactive PRD generator — starts with the problem, not the solution |
| `/covenant:spec` | Collaborative specification — 4 phases with mandatory approval gates |
| `/covenant:plan` | Implementation plan — deep codebase analysis, exact types and signatures |
| `/covenant:implement` | Execute the plan step by step with automated quality gates |

### Investigation

| Command | Description |
|---|---|
| `/covenant:explore` | Free-form code exploration — understand how something works |
| `/covenant:research` | Deep code research — traces history, validates assumptions, maps hidden dependencies |
| `/covenant:design` | Architecture design — 2-3 approaches with tradeoffs before committing to a spec |
| `/covenant:review` | PR comment reviewer — fetches, categorizes, and generates an action plan |
| `/covenant:tour` | Generate a guided code tour (CodeTour `.tour` file) |

### Quality

| Command | Description |
|---|---|
| `/covenant:security` | Security audit — OWASP, secrets, injection, dependency scan |
| `/covenant:hunt` | Hunt for silent failures — swallowed errors, dangerous fallbacks, unhandled async |
| `/covenant:fix` | Fix build and type errors with minimal surgical changes |

### Usage Examples

```bash
# Start a new feature from scratch
/covenant:prd

# Build a spec from a description
/covenant:spec "Add per-tenant rate limiting to the public API"

# Build a spec from an existing PRD
/covenant:spec .covenant/prds/rate-limiter.prd.md

# Generate implementation plan from spec
/covenant:plan .covenant/specs/rate-limiter.spec.md

# Execute the plan
/covenant:implement .covenant/plans/rate-limiter/

# Explore before speccing
/covenant:design "real-time notification system"
/covenant:explore "how does authentication work?"
/covenant:research "why does the payment module retry 3 times?"

# Review PR comments
/covenant:review 42

# Quality checks
/covenant:security
/covenant:hunt
```

---

## Agents

covenant uses specialized agents named after the Halo universe:

| Agent | Role | Model |
|---|---|---|
| **sentinel** | Creates and runs tests per implementation step | Sonnet |
| **arbiter** | 6-pass correctness review (consumer, symmetry, robustness, concurrency, wiring, security) | Sonnet |
| **oracle** | Hunts silent failures — swallowed errors, dangerous fallbacks, unhandled async | Sonnet |
| **prophet** | Performance reviewer — N+1 queries, O(n²) loops, blocking I/O, missing caching | Sonnet |
| **juridical** | Spec conformance auditor — verifies every requirement was implemented correctly | Sonnet |
| **librarian** | Updates documentation after implementation | Sonnet |
| **monitor** | Code exploration — finds where things live and how they connect | Sonnet |
| **catalog** | Deep code researcher — traces history, validates assumptions, maps hidden dependencies | Sonnet |
| **warden** | Security auditor — 6 scan categories, skeptical validation before reporting | Sonnet |
| **architect** | Proposes 2-3 architectural approaches with concrete tradeoffs and a blueprint | Sonnet |
| **engineer** | Fixes build/type errors with minimal changes — no refactoring, just green | Sonnet |

---

## Language Support

Any. covenant agents read the actual codebase and adapt to whatever language, framework, and patterns they find — there are no language-specific rule files or detection hooks.

---

## Workflow

### Full pipeline (new feature)

```
/covenant:prd
  └─ generates .covenant/prds/{name}.prd.md

/covenant:spec .covenant/prds/{name}.prd.md
  ├─ Phase 1: Problem Definition (assumptions, constraints, success criteria)
  ├─ Phase 2: Solution Exploration (design decisions, alternatives, tradeoffs)
  ├─ Phase 3: Specification (RFC 2119, verifiable requirements, API contracts)
  └─ generates .covenant/specs/{name}.spec.md

/covenant:plan .covenant/specs/{name}.spec.md
  ├─ Analyzes codebase (naming, error handling, test patterns, dependencies)
  └─ generates .covenant/plans/{name}/
       ├─ 00-overview.md   (conventions, execution order, delivery checklist)
       ├─ 01-{phase}.md    (steps with Goal, Files, Types/Signatures, Done-when)
       └─ 02-{phase}.md

/covenant:implement .covenant/plans/{name}/
  ├─ Per step: implement → sentinel (tests) → next step
  ├─ Post-steps: arbiter + oracle + prophet (parallel review)
  ├─ Post-review: juridical (spec conformance)
  └─ Post-conformance: librarian (documentation)
```

### Skip straight to spec

```bash
/covenant:spec "Add webhook signature verification to the payments service"
```

### Investigation only

```bash
/covenant:explore "what calls the payment processor?"
/covenant:research "how has the auth middleware evolved and what depends on it?"
/covenant:review 87
/covenant:tour onboarding
/covenant:design "caching strategy for the product catalog"
```

---

## Project Structure

```
.claude-plugin/
  plugin.json          ← manifest
agents/
  arbiter.md           ← correctness reviewer
  architect.md         ← architecture designer
  catalog.md           ← deep code researcher
  engineer.md          ← build error fixer
  juridical.md         ← spec conformance auditor
  librarian.md         ← documentation writer
  monitor.md           ← code explorer
  oracle.md            ← silent failure hunter
  prophet.md           ← performance reviewer
  sentinel.md          ← test writer
  warden.md            ← security auditor
commands/
  design.md            ← /covenant:design
  explore.md           ← /covenant:explore
  fix.md               ← /covenant:fix
  hunt.md              ← /covenant:hunt
  implement.md         ← /covenant:implement
  plan.md              ← /covenant:plan
  prd.md               ← /covenant:prd
  research.md          ← /covenant:research
  review.md            ← /covenant:review
  security.md          ← /covenant:security
  spec.md              ← /covenant:spec
  tour.md              ← /covenant:tour
```

---

## Contributing

Plugin content is Markdown and JSON — no build step required.

| Component | Format |
|---|---|
| Commands | Markdown with `description:` YAML frontmatter |
| Agents | Markdown with `name`, `description`, `tools`, `model` frontmatter |
