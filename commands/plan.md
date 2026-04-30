---
description: "Generate a step-by-step implementation plan from a spec file, with deep codebase analysis and language-aware pattern extraction"
argument-hint: "<path/to/spec.md | feature description>"
---

# /covenant:plan — Implementation Plan

**Input**: $ARGUMENTS

Generate a detailed, self-contained implementation plan from a specification. Every pattern, convention, and gotcha captured once — so implementation needs zero additional searches.

**Golden Rule**: If you would need to search the codebase during implementation, capture that knowledge NOW in the plan.

---

## Startup: Load Language Rules

The SessionStart hook injects the detected language and absolute paths to rule files into the session context. Look for the `[Covenant]` block — it lists `Rule files:` with absolute paths. Read every listed rule file before proceeding. If no `[Covenant]` block is present or no rule files are listed, skip and continue.

---

## Phase 0 — DETECT: Understand Input

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

Launch the `catalog` agent to perform deep codebase investigation. Catalog handles the eight search categories and five traces below — do not duplicate this work manually.

```
Subagent: catalog
Question: "Investigate how this codebase implements features similar to {feature being planned}. Map patterns, conventions, contracts, and dependencies in the relevant area."
Mode: full
Scope: {packages, modules, or directories relevant to the feature}
Goal: Produce a complete discovery table covering: similar implementations, naming conventions, error handling, logging, type definitions, test patterns, configuration, and dependencies. Include five traces: entry points, data flow, state changes, contracts, and architectural patterns. Every finding must include file:line references and real code snippets.
```

### What Catalog Investigates

**Eight Search Categories:**

1. **Similar Implementations** — Features that resemble what we are building
2. **Naming Conventions** — File, type, function, variable naming in this area
3. **Error Handling** — Error creation, wrapping, propagation, and return patterns
4. **Logging Patterns** — What gets logged, at what level, in what format
5. **Type Definitions** — Relevant types, interfaces, and schemas
6. **Test Patterns** — How similar features are tested
7. **Configuration** — Config files, env vars, feature flags
8. **Dependencies** — Packages, internal libraries, external APIs

**Five Traces:**

1. **Entry Points** — How requests reach the area being modified
2. **Data Flow** — How data moves through relevant code paths
3. **State Changes** — What state is mutated, where, and under what conditions
4. **Contracts** — Interfaces, APIs, or protocols the new code must honor
5. **Patterns** — Architectural patterns in use

### Unified Discovery Table

After catalog completes, compile findings into one reference table:

| Category | File:Lines | Pattern | Key Snippet |
|---|---|---|---|
| Naming | `pkg/users/service.go:1-10` | PascalCase types, camelCase methods | `type UserService struct` |
| Error Handling | `pkg/errors/errors.go:15-30` | Sentinel errors + wrapping | `var ErrNotFound = errors.New(...)` |
| ... | ... | ... | ... |

If catalog surfaces contradictions, hidden risks, or undocumented assumptions, carry them forward into Phase 4 (DESIGN) as constraints.

---

## Phase 3 — RESEARCH: External Knowledge

If the feature involves external libraries, APIs, or unfamiliar technology, launch catalog again with a targeted scope:

```
Subagent: catalog
Question: "What are the best practices, known issues, and version-specific gotchas for {library/API/technology}?"
Mode: assumption
Scope: {specific dependency or external system}
Goal: Validate assumptions about external dependencies. Check official docs, known breaking changes, and CVEs at the pinned version. Report findings with sources.
```

Format each finding as:
```
KEY_INSIGHT: {what you learned}
APPLIES_TO: {which part of the plan this affects}
GOTCHA: {warnings or version-specific issues}
SOURCE: {URL or documentation reference}
```

If the feature uses only well-understood internal patterns, skip this phase and note: "No external research needed — feature uses established internal patterns."

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

Files that MUST be read before implementing any step:

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `{path}` | {lines} | {core pattern to follow} |
| P1 | `{path}` | {lines} | {related types or contracts} |
| P2 | `{path}` | {lines} | {similar implementation for reference} |

## Patterns to Mirror

Code patterns discovered in this codebase. Follow these exactly.

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

## Project Conventions

Language: {language}
Package manager: {npm/go modules/pip/etc.}
Test runner: {command}
Build command: {command}
Linter: {command}
Type checker: {command}

## Delivery Checklist

After all steps are complete, verify:
- [ ] All steps completed and Done-when criteria verified
- [ ] No compiler / interpreter errors
- [ ] All exported symbols have doc comments
- [ ] No internal types leaked through public API
- [ ] Code follows conventions documented in this overview
- [ ] Tests exist for all new behavior
- [ ] No hardcoded values (use config or constants)
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

**Types / Signatures**:
```{language}
// Full type definitions, function signatures, and doc comments
// This is the contract — implementation fills in the body
```

**Implementation Notes**:
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

Check the plan against these requirements:

### Context Completeness
- [ ] All relevant files discovered and documented with file:line references
- [ ] Naming conventions captured with real code snippets
- [ ] Error handling patterns documented with real examples
- [ ] Test patterns identified from actual test files
- [ ] All external dependencies listed

### Implementation Readiness
- [ ] Every step has Goal, File(s), Types/Signatures, Implementation Notes, and Done-when
- [ ] No step requires additional codebase searching
- [ ] Import paths are specified or derivable from patterns
- [ ] GOTCHAs documented wherever a subtle mistake is possible

### Pattern Faithfulness
- [ ] All code snippets are actual codebase examples — none invented
- [ ] SOURCE references point to real, verified file paths and line numbers
- [ ] Patterns cover naming, errors, logging, data access, and tests

### No Prior Knowledge Test
A developer unfamiliar with this codebase should be able to implement the feature using ONLY this plan, without searching the codebase or asking questions. If not — add the missing context.
