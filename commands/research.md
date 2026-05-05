---
description: "Deep code research — validates assumptions, maps hidden dependencies, and answers questions you can't answer by just reading the code"
argument-hint: "<question | topic | function | module> [--mode impact|trace|full|assumption]"
---

# /covenant:research — Deep Code Research

**Input**: $ARGUMENTS (a research question or investigation target)

Go beyond surface-level code reading. Validate assumptions, map hidden dependencies, cross-reference with external documentation, and produce evidence-backed findings about the **current** state of the code. Use this when `explore` is not enough — when you need to understand not just WHAT the code does, but WHY it exists in its current form and WHAT would break if it changed. Do not investigate git history or commits.

---

## When to Use This vs. /covenant:explore

| Use explore when... | Use research when... |
|---|---|
| You need to find where something lives | You need to understand why it works the way it does |
| You want to read a code path | You want a full call graph + data flow trace |
| You need a quick answer | You need a defensible answer with evidence |
| Surface-level understanding is enough | You're making a decision that depends on deep understanding |

---

## Detect Research Mode

Parse $ARGUMENTS for an explicit `--mode` flag or infer from the question:

| Mode | Trigger | Focus |
|---|---|---|
| **full** | `--mode full` or default for broad questions | All investigation phases — complete research |
| **trace** | `--mode trace` or "how does X work end-to-end" | Deep call graph + data flow tracing |
| **impact** | `--mode impact` or "what breaks if we change X" | Dependency mapping + risk assessment |
| **assumption** | `--mode assumption` or "is it true that X" | Hypothesis testing + external validation |

Default: **full** if no mode is detected.

---

## Launch Scholar

Delegate the full investigation to the `catalog` agent:

```
Subagent: catalog
Question: {the research question from $ARGUMENTS}
Mode: {detected mode}
Scope: {file, function, module, or concept being researched}
Goal: Deep investigation of the current code. Follow every thread. Cross-reference code, tests, and external docs. Do not investigate git history or commits. Report findings with evidence and confidence levels.
```

Wait for catalog to complete before displaying results.

---

## Output

Display the catalog's report exactly as produced, then append:

```
## Research Complete

**Question**: {original question}
**Mode**: {mode used}
**Confidence**: {catalog's confidence level}

### Key Findings
| # | Finding | Evidence | Risk |
|---|---|---|---|
| 1 | {one-line finding} | `{file:line}` | {none / low / medium / high} |
| 2 | ... | ... | ... |

### Unanswered Questions
{List from catalog — things that could not be determined}

---
{If unanswered questions exist}
> Some questions remain open. To dig deeper:
> - `/covenant:research {specific follow-up question}`
> - `/covenant:explore {specific area to investigate}`

{If hidden risks were found}
> Hidden risks detected. Consider running:
> - `/covenant:hunt` to scan for silent failures in the affected area
> - `/covenant:security` if security-related risks were flagged
```

---

## Multi-Target Research

If $ARGUMENTS contains multiple targets separated by `+` or `vs` or `and`:

```
/covenant:research "auth middleware vs session middleware"
/covenant:research "OrderService + PaymentService interaction"
```

Launch one catalog per target, then produce a comparative report:

```
### Comparison: {target A} vs {target B}

| Dimension | {Target A} | {Target B} |
|---|---|---|
| Created | {date} | {date} |
| Last modified | {date} | {date} |
| Complexity | {lines / dependencies} | {lines / dependencies} |
| Test coverage | {tested / gaps} | {tested / gaps} |
| Hidden risks | {count} | {count} |

### Interactions Between Them
{How do they communicate? Shared state? Shared dependencies? Race conditions?}

### Contradictions
{Places where A and B handle the same concern differently}
```
