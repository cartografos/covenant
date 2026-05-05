---
description: "Generate a step-by-step implementation plan from a spec file, with deep codebase analysis and language-aware pattern extraction"
argument-hint: "<path/to/spec.md | feature description>"
---

# /covenant:plan — Implementation Plan

**Input**: $ARGUMENTS

Generate a detailed, self-contained implementation plan from a specification. Every pattern, convention, and gotcha captured once — so implementation needs zero additional searches.

**Golden Rule**: If you would need to search the codebase during implementation, capture that knowledge NOW in the plan.

---

## Phase 0 — DETECT: Understand Input

If `.covenant/style.md` exists in the project, read it before any planning. It captures the project's de-facto conventions (naming, file layout, error handling, testing, programming style) and should be cited in the plan's "Patterns to Mirror" section instead of inventing patterns from scratch. If it does not exist, proceed without it — `catalog` will still surface patterns during Phase 2.

**When the plan is a refactor** (the work intentionally changes one or more documented conventions), the plan must:
1. Identify which convention(s) from `.covenant/style.md` are being deliberately changed.
2. State the new convention and the rationale.
3. Flag this as an **Intentional Deviation** in the Patterns to Mirror section so the implementer does not reflexively mirror the old pattern.
4. Note that `/covenant:codify` should be re-run after the refactor lands so style.md reflects the new state.

If the plan is additive (new feature on top of existing patterns), simply mirror style.md as usual.



| Input Pattern | Action |
|---|---|
| Path ending in `.spec.md` | Read spec file, use as authoritative source |
| Path ending in `.prd.md` | Read PRD, find next pending phase, use its description |
| Path to any other `.md` | Read file for context, treat as informal requirements |
| Free-form text | Proceed directly to Phase 1 |
| Blank | Ask user what feature to plan |

### Detect project language

Use the language detected in the `[Covenant]` session context block. The rule files were already loaded during Startup — they inform naming conventions, patterns, and test structure throughout the plan.

---

## Phase 1 — PARSE: Feature Understanding

Extract and clarify requirements from the input.

### Identify the four Ws

- **What**: concrete deliverable — not "add feature" but "add `RateLimiter` type with `Allow(key string) bool` method"
- **Why**: user value this delivers
- **Who**: user or system that benefits
- **Where**: which packages, modules, or services are affected

### User Story

```
As a {type of user},
I want {capability},
So that {benefit}.
```

### Complexity Assessment

| Level | Indicators | Typical Scope |
|---|---|---|
| **Small** | Single file, isolated change, no new dependencies | 1–3 files, < 100 lines |
| **Medium** | Multiple files, follows existing patterns | 3–10 files, 100–500 lines |
| **Large** | Cross-cutting concerns, new patterns, external integrations | 10+ files, 500+ lines |
| **XL** | Architectural changes, new subsystems, migration required | 20+ files — consider splitting |

### Ambiguity Gate

If any of the following are unclear, **STOP and ask the user** before proceeding:
- The core deliverable is vague
- Success criteria are undefined
- There are multiple valid interpretations of the spec
- The technical approach has major unknowns

Do NOT guess. A plan built on assumptions fails during implementation.

---

## Phase 2 — EXPLORE: Deep Codebase Analysis

Launch the `catalog` agent to investigate the patterns and constraints relevant to this feature.

```
Subagent: catalog
Question: "How does this codebase implement features similar to {feature being planned}? Map the patterns, conventions, contracts, and dependencies the new code must respect."
Mode: full
Scope: {packages, modules, or directories relevant to the feature}
Goal: Surface the patterns the new feature must mirror — naming, error handling, test patterns, type organization, integration points. Investigate only the dimensions relevant to this feature; skip categories that don't apply. Every finding must have file:line references and real snippets.
```

After catalog completes, compile a single reference table the plan can cite from:

| Category | File:Lines | Pattern | Key Snippet |
|---|---|---|---|
| {whatever catalog found} | `{file:lines}` | {pattern} | `{snippet}` |

If catalog surfaces contradictions, hidden risks, or undocumented assumptions, carry them forward into Phase 4 (DESIGN) as constraints.

---

## Phase 3 — RESEARCH: Dependency Validation

If the feature involves external libraries, APIs, or unfamiliar technology, launch catalog again with a targeted scope:

```
Subagent: catalog
Question: "What does this codebase reveal about how {library/API/technology} is used, configured, and constrained?"
Mode: assumption
Scope: {specific dependency or external system}
Goal: Validate assumptions about external dependencies using codebase evidence only. Check lock files for pinned versions, read CHANGELOG and migration notes in the repo, examine existing usage patterns and configuration. Report findings with file:line references.
```

Format each finding as:
```
KEY_INSIGHT: {what you learned}
APPLIES_TO: {which part of the plan this affects}
GOTCHA: {warnings or version-specific issues found in local files}
SOURCE: {file:line reference}
```

If the feature uses only well-understood internal patterns, skip this phase and note: "No external research needed — feature uses established internal patterns."

> **Note**: Catalog performs codebase-only research. If the feature depends on external APIs, undocumented behavior, or known CVEs that cannot be verified from local files, flag these as assumptions in the plan. The user should validate them manually before implementation.

---

## Phase 4 — DESIGN: Approach & Scope

Define the implementation approach:

- **Approach**: High-level strategy (e.g., "Add new middleware following the existing chain pattern in `pkg/middleware/`")
- **Alternatives Considered**: What other approaches were evaluated and why they were rejected
- **Scope**: Concrete list of what WILL be built
- **NOT Building**: Explicit list of what is OUT OF SCOPE — prevents scope creep during implementation

---

## Phase 5 — GENERATE: Write Plan Files

### Complexity-based output

**Simple** (Small complexity): One file `00-plan.md` with all steps inline.

**Complex** (Medium / Large / XL):
```
.covenant/plans/{name}/
├── 00-overview.md     ← conventions, dependency graph, delivery checklist
├── 01-{phase}.md      ← first implementation phase
├── 02-{phase}.md      ← second implementation phase
└── ...
```

Create directory:
```bash
mkdir -p .covenant/plans/{name}
```

### `00-overview.md` template

```markdown
# Plan: {Feature Name}

## Summary
{2–3 sentence overview}

## User Story
As a {user}, I want {capability}, so that {benefit}.

## Metadata
| Field | Value |
|---|---|
| Complexity | Small / Medium / Large / XL |
| Source Spec | {path or "N/A"} |
| Language | {detected language} |
| Estimated Files | {count} |
| Total Steps | {count} |

---

## Phase Execution Order

| Phase File | Name | Depends On | Can Parallelize With |
|---|---|---|---|
| 01-{name}.md | {Phase name} | — | — |
| 02-{name}.md | {Phase name} | Phase 1 | — |
| 03-{name}.md | {Phase name} | Phase 2 | Phase 4 |
| 04-{name}.md | {Phase name} | Phase 2 | Phase 3 |

## Mandatory Reading

Files to read before implementing any step:

| File | Lines | Why |
|---|---|---|
| `{path}` | {lines} | {what pattern or contract this provides} |

Keep the list short — only files an implementer truly cannot proceed without.

## Patterns to Mirror

Code patterns discovered in this codebase. Follow these exactly **unless this plan declares an Intentional Deviation below**.

### NAMING_CONVENTION
// SOURCE: {file:lines}
{actual code snippet}

### ERROR_HANDLING
// SOURCE: {file:lines}
{actual code snippet}

### TEST_STRUCTURE
// SOURCE: {file:lines}
{actual code snippet}

{add a section for each relevant pattern found in Phase 2}

## Intentional Deviations (refactors only)

{Omit this section unless the plan deliberately changes a current convention.}

| Current Convention (per style.md) | New Convention | Rationale |
|---|---|---|
| {what the codebase does today} | {what this plan introduces} | {why the change} |

After the refactor lands, run `/covenant:codify` to refresh `.covenant/style.md`.

## Project Conventions

Language: {language}
Package manager: {npm/go modules/pip/etc.}
Test runner: {command}
Build command: {command}
Linter: {command}
Type checker: {command}

## Delivery Checklist

After all steps complete, verify:
- [ ] All steps completed and Done-when criteria met
- [ ] Build / type-check / lint pass with no new errors
- [ ] Tests exist for all new behavior
- [ ] Code follows the conventions documented above
- [ ] No hardcoded values that belong in config or constants
- [ ] No internal types leaked through public API

`/covenant:implement` adds review-finding and conformance items at runtime — do not duplicate them here.
```

### Phase file template (`01-{name}.md`, `02-{name}.md`, ...)

```markdown
# Phase {N} — {Phase Name}

## Context

{One paragraph: what this phase accomplishes and why it comes at this point in the sequence}

## Dependencies

{What must be complete before this phase starts, or "None — can start immediately"}

---

## Step {N}.1 — {Descriptive Step Name}

**Goal**: {One sentence — what this step achieves}

**File(s)**: `{exact/path/to/file.ext}`

**Types / Signatures** (pure code — no prose comments, no spec references):
```{language}
// Real type definitions and function signatures only.
// No "implements SC-1", no "see spec section 4.2", no plan-step IDs.
// Doc comments only if the project's .covenant/style.md says exports get them.
```

**Implementation Notes** (metadata of the plan — does NOT go into the source code):
- {Algorithmic detail or invariant that is non-obvious}
- {Edge case that must be handled}
- {Integration point with existing code}
- {Performance consideration if relevant}

**Done-when**: {Mechanically verifiable criterion — e.g., "`go build ./...` exits 0 with no new errors"}

---

## Step {N}.2 — {Descriptive Step Name}

{... same structure ...}
```

### Step writing rules

- **Atomicity**: every step is independently verifiable and produces a concrete artifact
- **Completeness**: the phases cover 100% of the work required by the spec — nothing left to "figure out during implementation"
- **Precision**: types and signatures are real code, not prose
- **No spec leakage in code snippets**: do not write `// SC-1`, `// MUST: ...`, `// see spec §4.2`, or step IDs inside the Types/Signatures block. The plan and spec are reference documents — they do not become source-code comments. Project documentation conventions live in `.covenant/style.md`.
- **Ordering**: dependencies come before dependents
- **No test specifications**: sentinel creates tests at runtime
- **No documentation phase**: librarian handles documentation at runtime
- **No vague steps**: "Implement business logic" is not a step — name exactly what to implement

---

## Phase 6 — OUTPUT: Summary Report

After saving all files, always display:

```
## Plan Created

- **Folder**: `.covenant/plans/{name}/`
- **Source Spec**: {path or "N/A"} · **Phase**: {phase name or "standalone"}
- **Language**: {detected language}
- **Scope**: {N} phases · {N} total steps · {N} files to change
- **Key Patterns**: {top 3 discovered patterns, comma-separated}
- **External Research**: {topics researched, or "none needed"}
- **Risks**: {top risk in one line, or "none identified"}
- **Confidence Score**: {1-10} — {one-line justification}

> Next step: `/covenant:implement .covenant/plans/{name}/`
```

---

## Verification: Before Finalizing

The plan must pass the **No Prior Knowledge Test**: a developer unfamiliar with this codebase should be able to implement the feature using only this plan, without searching the codebase or asking questions.

Concretely, verify:
- Every step has Goal, File(s), Types/Signatures, Implementation Notes, and Done-when.
- Every code snippet is a real example from this codebase — none invented. `SOURCE:` references point to real `file:lines`.
- No step requires additional codebase searching during implementation.
- GOTCHAs are documented wherever a subtle mistake is possible.

If any check fails, add the missing context before finalizing.
