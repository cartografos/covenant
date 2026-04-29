---
description: "Security audit — scans for vulnerabilities, secrets, injection patterns, and insecure dependencies. Run before merging any branch."
argument-hint: "[path/to/scan] (blank = full repo)"
---

# /covenant:security — Security Audit

**Input**: $ARGUMENTS (optional path to scope the scan)

Check for language marker files and read `rules/common/security.md` + `rules/{lang}/security.md` before proceeding.

Launch a focused security review of the codebase or a specific area. Produces a structured report of findings by severity before they reach production.

Run this:
- Before merging any implementation branch
- After adding new endpoints, auth flows, or data handling
- When introducing new dependencies
- On-demand for any area you want audited

---

## Scope Detection

| Input | Scope |
|---|---|
| Blank | Entire repository |
| Directory path (`pkg/auth/`, `src/payments/`) | That directory and its subdirectories |
| File path | That file only |
| Glob pattern (`**/*.go`) | Matching files |

---

## Launch Warden

Delegate the full audit to the `warden` agent with the resolved scope:

```
Subagent: warden
Scope: {resolved path or "full repository"}
Language: {detected from go.mod / package.json / pyproject.toml}
Goal: Full security audit. Report all findings by severity. Include dependency scan.
```

Wait for warden to complete before displaying results.

---

## Output

Display the warden report exactly as produced, then append:

```
## Security Audit Complete

**Scope**: {path scanned}
**Language**: {detected language}
**Files scanned**: {N}

### Summary
| Severity | Count | Action Required |
|---|---|---|
| CRITICAL | {N} | Fix before any merge |
| HIGH | {N} | Fix before merge |
| MEDIUM | {N} | Fix or document acceptance |
| LOW | {N} | Fix at discretion |
| INFO | {N} | Informational only |

### Dependency Scan
{Result of govulncheck / npm audit / pip-audit}

---
{If CRITICAL or HIGH findings exist}
> Fix all CRITICAL and HIGH findings before merging.
> Re-run `/covenant:security` after fixes to confirm clean.

{If no CRITICAL or HIGH findings}
> No blocking issues found. Review MEDIUM findings before merge.
```
