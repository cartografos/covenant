---
description: "Hunt for silent failures — swallowed errors, dangerous fallbacks, unhandled async failures, and missing error propagation"
argument-hint: "[path/to/scan] (blank = full repo)"
---

# /covenant:hunt — Silent Failure Hunter

**Input**: $ARGUMENTS (optional path to scope the scan)

Check for language marker files and read `rules/common/security.md` + `rules/{lang}/security.md` before proceeding.

Find bugs that hide in plain sight. Silent failures cause incidents with no logs, no alerts, and no obvious error — the system just does the wrong thing quietly.

Run this on any codebase, any time. Especially valuable before merging code that touches error handling, async flows, or data pipelines.

---

## Scope

| Input | Scope |
|---|---|
| Blank | Entire repository |
| Directory path | That directory recursively |
| File path | That file only |

---

## Launch Oracle

```
Subagent: oracle
Scope: {resolved path or "full repository"}
Language: {detected from go.mod / package.json / pyproject.toml / Cargo.toml / composer.json}
Goal: Hunt all six silent failure categories. Report every finding with a concrete trigger scenario and a fix.
```

---

## Output

```
## Hunt Complete

**Scope**: {path scanned}
**Language**: {detected language}

{oracle report}

---
{If CRITICAL or HIGH findings:}
> These are active bugs — they will cause silent misbehavior in production.
> Fix before merging.

{If clean:}
> No silent failures found. Error handling looks solid.
```
