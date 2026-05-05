# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

`sdd-covenant` is the source for the **covenant** Claude Code plugin — a Spec-Driven Development pipeline that takes a feature from PRD to specification, implementation plan, and delivery with rigorous quality gates.

There is no build step — all plugin content is Markdown and JSON.

```
.claude-plugin/
  plugin.json          # Manifest (name: covenant, version: 1.0.0)
  marketplace.json     # Registry for /plugin marketplace add cartografos/covenant
commands/
  prd.md               # /covenant:prd      — interactive PRD generator (5 phases)
  spec.md              # /covenant:spec     — RFC 2119 specification with Light/Standard paths
  plan.md              # /covenant:plan     — implementation plan with codebase analysis
  implement.md         # /covenant:implement — step-by-step executor
  explore.md           # /covenant:explore  — free-form code exploration
  research.md          # /covenant:research — deep code research (current code only, not git history)
  design.md            # /covenant:design   — architecture design (pre-spec)
  review.md            # /covenant:review   — PR comment reviewer
  security.md          # /covenant:security — security audit
  hunt.md              # /covenant:hunt     — silent failure hunter
  fix.md               # /covenant:fix      — build error fixer
  tour.md              # /covenant:tour     — CodeTour file generator
  codify.md            # /covenant:codify   — generates .covenant/style.md from real patterns in the code
agents/
  sentinel.md          # Testing — creates and runs tests per step (Sonnet)
  arbiter.md           # Review — functional correctness, runs only relevant passes (Sonnet)
  librarian.md         # Docs — updates only docs the change actually affects (Sonnet)
  monitor.md           # Exploration — finds where things live and how they connect (Sonnet)
  catalog.md           # Research — deep investigation of current code (Sonnet)
  warden.md            # Security — OWASP audit, runs only relevant scans (Sonnet)
  architect.md         # Design — 1-3 approaches with tradeoffs and blueprint (Sonnet)
  oracle.md            # Silent failures — swallowed errors, dangerous fallbacks (Sonnet)
  prophet.md           # Performance — runs only relevant scans (Sonnet)
  juridical.md         # Spec conformance — verifies every MUST/SHOULD against code (Sonnet)
  engineer.md          # Build fixes — minimal surgical changes to make build pass (Sonnet)
  didact.md            # Style codifier — surveys project and writes .covenant/style.md (Sonnet)
```

> `source/` is a reference directory (gitignored) used during initial design. It will be removed.

## Plugin Installation

```bash
# From marketplace (terminal, not IDE)
/plugin marketplace add cartografos/covenant
/plugin install covenant@cartografos

# Local checkout
claude --plugin-dir .
```

## Plugin File Format Conventions

| Path | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Manifest (name, version, description, commands) |
| `.claude-plugin/marketplace.json` | Marketplace registry entry |
| `agents/*.md` | Agent definitions — YAML frontmatter: `name`, `description`, `tools`, `model` |
| `commands/*.md` | Slash commands — require `description:` frontmatter |

## covenant Architecture

### Pipeline

```
/covenant:prd → /covenant:spec → /covenant:plan → /covenant:implement
```

Every piece of code originates in a specification. The pipeline is linear but each step can be invoked independently.

### Commands

**Core pipeline:**
- `/covenant:prd` → `.covenant/prds/{name}.prd.md` — problem-first PRD with hypothesis and phases
- `/covenant:spec` → `.covenant/specs/{name}.spec.md` — RFC 2119 spec with 4 mandatory phases and approval gates. Includes Attitude (senior peer, not yes-man), Research (autonomous web search), and Rules sections
- `/covenant:plan` → `.covenant/plans/{name}/` — `00-overview.md` + numbered phase files with exact types, signatures, and done-when criteria
- `/covenant:implement` → executes plan step-by-step with agents

**Investigation:**
- `/covenant:explore` — free-form code investigation (monitor agent)
- `/covenant:research` — deep code research with history, impact, and hypothesis testing (catalog agent)
- `/covenant:design` → `.covenant/designs/{name}.design.md` — pre-spec architecture design (architect agent)
- `/covenant:codify` → `.covenant/style.md` — surveys project and writes descriptive coding-style doc (didact agent)
- `/covenant:review` — PR comment reviewer with classification and action plan
- `/covenant:tour` — generates CodeTour `.tour` files

**Quality:**
- `/covenant:security` — security audit (warden agent)
- `/covenant:hunt` — silent failure detection (oracle agent)
- `/covenant:fix` — build error resolution (engineer agent)

### Agents

| Agent | Model | Role | Invoked by |
|---|---|---|---|
| sentinel | Sonnet | Creates and runs tests per step | implement (per step) |
| arbiter | Sonnet | Functional correctness review | implement (post-steps, parallel with oracle + prophet) |
| librarian | Sonnet | Updates only docs the change affects | implement (post-review) |
| monitor | Sonnet | Code exploration | explore |
| catalog | Sonnet | Deep research of the current code (no git history) | research, spec (pre-Phase 2), plan (Phase 2 + 3) |
| warden | Sonnet | Security audit | security |
| architect | Sonnet | Architecture design with tradeoffs | design |
| oracle | Sonnet | Silent failure hunter | implement (post-steps), hunt |
| prophet | Sonnet | Performance reviewer | implement (post-steps) |
| juridical | Sonnet | Spec conformance auditor | implement (post-review, before librarian) |
| engineer | Sonnet | Build error fixer | fix |
| didact | Sonnet | Surveys project and writes coding-style document | codify |

### Language Handling

There is no language detection or language-specific rules. Agents read the actual codebase and adapt to whatever language and patterns they find.

### implement Flow

```
Per step:
  implement step → sentinel (tests) → next step

Post-steps (parallel):
  arbiter (6-pass review) + oracle (silent failures) + prophet (performance)

Post-review:
  juridical (spec conformance)

Post-conformance:
  librarian (documentation)

Final:
  delivery checklist
```

None of the agents create git commits — the user commits manually.

## Supported Tech Stacks

Any. Agents read the actual codebase rather than language-specific templates.

## Artifacts Location

All generated artifacts live under `.covenant/` in the project being worked on:

```
.covenant/
  designs/  ← Design blueprints (.design.md)
  prds/     ← PRD files (.prd.md)
  specs/    ← Spec files (.spec.md)
  plans/    ← Plan folders (00-overview.md + numbered phase files)
  style.md  ← Project coding-style document (generated by /covenant:codify)
```
