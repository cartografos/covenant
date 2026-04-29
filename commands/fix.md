---
description: "Fix build errors, type errors, and compiler failures with minimal surgical changes — no refactoring, just makes the build pass"
argument-hint: "[error output or blank to run build automatically]"
---

# /covenant:fix — Build Error Fixer

**Input**: $ARGUMENTS (optional — paste error output, or leave blank to run the build automatically)

Fix build failures fast. The `engineer` agent identifies root causes and applies the smallest possible change to make the build pass. No refactoring. No opinions. Just green.

---

## Launch Engineer

```
Subagent: engineer
Error output: {$ARGUMENTS if provided, otherwise "run build command automatically"}
Goal: Fix all build/type errors with minimal changes. Verify build passes before reporting done.
```

---

## Output

Display the engineer's report directly, then append:

```
## Fix Complete

**Build status**: passing
**Changes**: {N files modified}

---
> Verify the fix makes sense before committing.
> If the fix looks wrong, describe what you expected and run `/covenant:fix` again.
```
