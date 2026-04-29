# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

`sdd-covenant` is the source for the **covenant** Claude Code plugin — a Spec-Driven Development pipeline that takes a feature from PRD to specification, implementation plan, and delivery with rigorous quality gates and language-aware rules.

There is no build step — all plugin content is Markdown and JSON. The only exception is `hooks/detect.js`, a Node.js script for language detection.

```
.claude-plugin/
  plugin.json          # Manifest (name: covenant, version: 1.0.0)
  marketplace.json     # Registry for /plugin marketplace add cartografos/covenant
commands/
  prd.md               # /covenant:prd      — interactive PRD generator
  spec.md              # /covenant:spec     — rigorous specification (RFC 2119, 4 phases + gates)
  plan.md              # /covenant:plan     — implementation plan with codebase analysis
  implement.md         # /covenant:implement — step-by-step executor
  explore.md           # /covenant:explore  — free-form code exploration
  design.md            # /covenant:design   — architecture design (pre-spec)
  security.md          # /covenant:security — security audit
  hunt.md              # /covenant:hunt     — silent failure hunter
  fix.md               # /covenant:fix      — build error fixer
  tour.md              # /covenant:tour     — CodeTour file generator
agents/
  sentinel.md          # Testing — creates and runs tests per step (Haiku)
  arbiter.md           # Review — 6-pass correctness review (Sonnet)
  librarian.md         # Docs — updates documentation after implementation (Sonnet)
  monitor.md           # Exploration — finds where things live and how they connect (Haiku)
  warden.md            # Security — 6-scan OWASP audit (Sonnet)
  architect.md         # Design — 2-3 approaches with tradeoffs and blueprint (Sonnet)
  oracle.md            # Silent failures — swallowed errors, dangerous fallbacks (Sonnet)
  engineer.md          # Build fixes — minimal surgical changes to make build pass (Sonnet)
hooks/
  hooks.json           # SessionStart hook wiring
  detect.js            # Language + framework detection (Node.js, ~130 lines)
rules/
  common/              # Language-agnostic: coding-style, testing, security
  golang/              # Go: coding-style, patterns, testing, security
  typescript/          # TypeScript/Node.js: coding-style, patterns, testing, security
  python/              # Python: coding-style, patterns, testing, security
  kotlin/              # Kotlin/Spring Boot: coding-style, patterns, testing, security
  java/                # Java/Spring Boot: coding-style, patterns, testing, security
  php/                 # PHP/Laravel: coding-style, patterns, testing, security
  ruby/                # Ruby/Rails: coding-style, patterns, testing, security
  rust/                # Rust/Axum/Actix: coding-style, patterns, testing, security
  clojure/             # Clojure/Compojure: coding-style, patterns, testing, security
  cobol/               # COBOL: coding-style, patterns, testing, security
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
| `hooks/hooks.json` | Hook event wiring (SessionStart) |
| `hooks/detect.js` | Node.js language + framework detection |
| `rules/{lang}/*.md` | Language-specific rules loaded on-demand by commands |

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
- `/covenant:design` — pre-spec architecture design (architect agent)
- `/covenant:tour` — generates CodeTour `.tour` files

**Quality:**
- `/covenant:security` — 6-scan security audit (warden agent)
- `/covenant:hunt` — silent failure detection (oracle agent)
- `/covenant:fix` — build error resolution (engineer agent)

### Agents (Halo universe names)

| Agent | Model | Role | Invoked by |
|---|---|---|---|
| sentinel | Haiku | Creates and runs tests per step | implement (per step) |
| arbiter | Sonnet | 6-pass correctness review | implement (post-steps, parallel with oracle) |
| librarian | Sonnet | Updates all documentation | implement (post-review) |
| monitor | Haiku | Code exploration | explore |
| warden | Sonnet | Security audit (6 scans) | security |
| architect | Sonnet | Architecture design with tradeoffs | design |
| oracle | Sonnet | Silent failure hunter (6 categories) | implement (post-steps, parallel with arbiter), hunt |
| engineer | Sonnet | Build error fixer | fix |

### Language Detection (hooks/detect.js)

Runs at SessionStart. Detects language from marker files and framework from dependency files. Outputs one line: `[Covenant] golang/gin`. Rules load on-demand when a command is invoked — not at session start.

Supported: Go (gin/echo/fiber), Rust (axum/actix), Python (fastapi/django/flask), TypeScript (nextjs/nestjs/react/vue/angular/svelte/remix/astro/nuxt/electron), JavaScript (express), Kotlin, Java, PHP (laravel/symfony), Ruby (rails/sinatra), Clojure (compojure/pedestal/luminus), COBOL.

### implement Flow

```
Per step:
  implement step → sentinel (tests) → next step

Post-steps (parallel):
  arbiter (6-pass review) + oracle (silent failures)

Post-review:
  librarian (documentation)

Final:
  delivery checklist
```

None of the agents create git commits — the user commits manually.

## Supported Tech Stacks

Go, TypeScript/Node.js, Python, Kotlin/Java (Spring Boot), PHP (Laravel/Symfony), Ruby (Rails), Rust (Axum/Actix), Clojure, COBOL.

## Artifacts Location

All generated artifacts live under `.covenant/` in the project being worked on:

```
.covenant/
  prds/     ← PRD files (.prd.md)
  specs/    ← Spec files (.spec.md)
  plans/    ← Plan folders (00-overview.md + numbered phase files)
```
