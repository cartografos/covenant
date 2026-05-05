---
description: "Survey the project and generate a project-specific coding-style document — derived from real patterns in the code, not idealized rules"
argument-hint: "[scope path] (blank = full repo)"
---

# /covenant:codify — Project Coding Style Generator

**Input**: $ARGUMENTS (optional path to scope the survey)

Mine the codebase and write a single reference document describing how this project **actually** works today: file layout, naming, programming style (OO vs functional, interfaces vs concrete types), error handling, testing, dependencies, configuration.

The output is **descriptive, not prescriptive** — a snapshot of the current state, not an aspirational target.

## ⚠️ When NOT to follow `.covenant/style.md` blindly

`.covenant/style.md` reflects what is in the code today, including any bad habits. New, additive work should mirror it for consistency. But:

- **Refactors** are explicitly about changing those patterns. If the goal of the work is to move away from a documented convention, the plan/spec must state this clearly and mark the deviation as intentional. Do not let style.md block the refactor.
- **Greenfield modules** that intentionally adopt a different style (e.g., a new functional core inside an OO codebase) should declare that up front.
- **After a refactor lands**, re-run `/covenant:codify` so the document reflects the new reality.

In short: style.md is the default for new code in established areas; it is not a binding contract for changes that intend to alter the conventions themselves.

---

## Scope

| Input | Scope |
|---|---|
| Blank | Entire repository |
| Directory path | That directory and its subdirectories |
| File glob | Matching files |

---

## Refresh vs First Run

If `.covenant/style.md` already exists, ask the user:

> A coding-style document already exists at `.covenant/style.md`.
> 1. **Refresh** — re-survey the project and overwrite the file
> 2. **Show diff** — survey the project and report what changed; do not write
> 3. **Cancel**

Default: refresh.

---

## Launch Didact

```
Subagent: didact
Scope: {resolved path or "full repository"}
Output path: .covenant/style.md
Goal: Survey the codebase and produce a descriptive coding-style document. Every claim must include a `file:line` reference and a real code snippet — no invented examples. Skip sections that have no content in this project. Document inconsistencies factually without picking a winner.
```

Wait for didact to finish before displaying the summary.

---

## Output

```
## Coding Style Codified

**File**: `.covenant/style.md`
**Scope**: {path scanned}
**Sections written**: {N}

### What was captured
- Languages: {list}
- Paradigm: {OO / functional / mixed}
- Test framework: {name or "not detected"}
- Patterns to mirror: {N captured}
- Inconsistencies flagged: {N}

> Reference this file from your CLAUDE.md if you want it loaded into every session,
> or cite it when running `/covenant:plan` and `/covenant:implement` so generated
> code mirrors the project's existing conventions.
```

---

## Notes

- Re-run after significant refactors so the document stays in sync with reality.
- Treat the document as a snapshot. If a section becomes wrong, edit it manually or run `/covenant:codify` again.
