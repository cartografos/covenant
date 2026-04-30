---
description: "Review PR comments — fetches all comments from a GitHub PR, categorizes them, and generates an actionable resolution plan"
argument-hint: "<PR# or GitHub PR URL>"
---

# /covenant:review — PR Comment Reviewer

**Input**: $ARGUMENTS (PR number or full GitHub PR URL)

Fetch all comments from a GitHub pull request, classify them by type and urgency, and produce a structured action plan to resolve every open thread.

---

## Parse Input

| Input | Action |
|---|---|
| Blank | Run `gh pr view --json number -q .number` to get the current branch's PR. If none, ask the user. |
| Number (`42`, `#42`) | Use as PR number directly |
| URL (`github.com/org/repo/pull/42`) | Extract owner, repo, and PR number from the URL |

Set `$PR` to the resolved PR number. Set `$REPO` to `owner/repo` if extracted from URL, otherwise leave blank (gh uses current repo).

---

## Fetch PR Data

Run these gh commands to gather full context:

### 1. PR metadata

```bash
gh pr view $PR --json title,body,state,author,baseRefName,headRefName,mergeable,reviewDecision,labels
```

### 2. Review comments (inline on diff)

```bash
gh api repos/{owner}/{repo}/pulls/$PR/comments --paginate
```

If `$REPO` is blank, detect it:
```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

### 3. Issue comments (general conversation)

```bash
gh api repos/{owner}/{repo}/issues/$PR/comments --paginate
```

### 4. Reviews (approval/changes-requested/comment)

```bash
gh api repos/{owner}/{repo}/pulls/$PR/reviews --paginate
```

### 5. PR diff

```bash
gh pr diff $PR
```

---

## Classify Comments

For each comment (from both review comments and issue comments), classify:

### By status

| Status | Criteria |
|---|---|
| **Open** | No reply resolving it, not marked as resolved in GH |
| **Resolved** | Explicitly resolved in GH, or author confirmed fix |
| **Outdated** | References code that no longer exists in the current diff |

### By type

| Type | Criteria |
|---|---|
| **Bug** | Points out incorrect behavior, logic error, or regression |
| **Security** | Flags a vulnerability, secret exposure, or unsafe pattern |
| **Design** | Questions architecture, naming, or approach |
| **Nit** | Style, formatting, or minor preference |
| **Question** | Asks for clarification without requesting a change |
| **Blocker** | Explicitly blocks approval or merge |
| **Praise** | Positive feedback, no action needed |

### By urgency

| Urgency | Criteria |
|---|---|
| **Must fix** | Bug, Security, or Blocker type — OR from a reviewer who requested changes |
| **Should fix** | Design comments from reviewers with write access |
| **Consider** | Nits and questions |
| **No action** | Praise, resolved, or outdated |

---

## Analysis

### Cross-reference with diff

For each open comment:
1. Read the referenced file and line range in the current HEAD
2. Determine if the comment has already been addressed by a subsequent commit
3. If addressed, mark as **Resolved (by commit)**
4. If not addressed, keep as **Open** and include the current code at that location

### Group related comments

Comments on the same file, same function, or same concern should be grouped. If multiple reviewers raise the same issue, note it once with all reviewers attributed.

---

## Output

```
## PR Comment Review — #{PR number}

**Title**: {PR title}
**Author**: {PR author}
**Base**: {base branch} ← {head branch}
**Review status**: {approved / changes requested / pending}
**Reviewers**: {list with their review state}

---

### Summary
| Category | Open | Resolved | Total |
|---|---|---|---|
| Must fix | {N} | {N} | {N} |
| Should fix | {N} | {N} | {N} |
| Consider | {N} | {N} | {N} |
| No action | — | {N} | {N} |

**Open threads**: {N} of {total} require action

---

### Must Fix

#### [MF-1] {Short description}
**Reviewer**: @{username}
**Type**: {Bug / Security / Blocker}
**File**: `{file}:{line}`
**Comment**: {verbatim or condensed quote}
**Current code**:
​```{lang}
{current code at that location}
​```
**Suggested fix**: {what the reviewer asked for, or your analysis of what needs to change}

{Repeat for each must-fix item}

---

### Should Fix

#### [SF-1] {Short description}
**Reviewer**: @{username}
**Type**: {Design}
**File**: `{file}:{line}`
**Comment**: {quote}
**Analysis**: {agree/disagree with reasoning}

{Repeat}

---

### Consider

#### [C-1] {Short description}
**Reviewer**: @{username}
**Comment**: {quote}
**Recommendation**: {address / skip with reason}

{Repeat}

---

### Already Resolved
{List of comments that were resolved or addressed by subsequent commits, with brief note of how}

---

### Action Plan

Priority-ordered list of changes to make:

1. **{MF-1}** — {one-line action} → `{file}`
2. **{MF-2}** — {one-line action} → `{file}`
3. **{SF-1}** — {one-line action} → `{file}`
...

**Estimated scope**: {N} files, {small / medium / large} change set
```

After displaying the report, ask:

> **Ready to address these comments? (all / must-fix only / pick specific items / no)**

---

## Addressing Comments

If the user chooses to address comments:

### For each item in the action plan (in priority order):

1. Read the file and understand the surrounding context
2. Apply the fix following existing code patterns
3. Verify the fix compiles/passes type checks
4. Print: `Fixed: {item ID} — {short description} [{file}]`

### After all fixes:

Run the project's build/test command to verify nothing broke.

```
## Comments Addressed

**Fixed**: {N} items
**Files modified**: {list}
**Build**: {passing / failing}
**Tests**: {passing / N failures}

---
> Review the changes, then commit and push to update the PR.
> Reviewers will be notified of new commits automatically.
```
