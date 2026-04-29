---
description: "Generate a guided code tour — a step-by-step walkthrough anchored to real file locations. Opens in VSCode CodeTour extension."
argument-hint: "<topic | intent | 'onboarding' | 'architecture' | 'pr-review' | path/to/feature>"
---

# /covenant:tour — Code Tour Generator

**Input**: $ARGUMENTS

Generate a `.tour` file that walks a reader through a codebase, a feature, or a concept — step by step, anchored to real lines of code. Opens in the VSCode CodeTour extension.

Use this when you want to:
- Onboard a new developer to a codebase or module
- Explain how a feature works from entry point to exit
- Document a PR's changes for reviewers
- Create a permanent record of an architectural investigation
- Leave a walkthrough for a debugging session

---

## Phase 1 — Detect Intent and Persona

Determine what kind of tour to generate from $ARGUMENTS:

| Input | Persona | Steps |
|---|---|---|
| `onboarding` / `new dev` / `getting started` | new-joiner | 9–13 steps — broad orientation |
| `architecture` / `system design` | architect | 12–16 steps — structural focus |
| `pr` / `pr-review` / `changes` | pr-reviewer | 7–11 steps — what changed and why |
| `debug` / `bug` / `incident` | bug-fixer | 7–11 steps — trace the failure path |
| `feature: X` / `how does X work` | feature-explainer | 7–11 steps — one feature end-to-end |
| `security` / `auth` | security-reviewer | 7–11 steps — trust boundaries and validation |
| Free-form topic | feature-explainer | 7–11 steps |

State the detected persona and step count target at the start.

---

## Phase 2 — Discover the Codebase

Read relevant code before writing a single step. Never anchor a step to a file or line you have not verified exists.

### Discovery checklist

1. Read the README and identify: what does this project do, what is the main entry point?
2. List the top-level directory structure — understand module organization
3. Find the entry points: `main.go`, `main.ts`, `app.py`, `index.ts`, router files, CLI commands
4. Find files relevant to $ARGUMENTS using Grep and Glob
5. For PR tours: `git diff --name-only HEAD~1` or check recently modified files
6. Read every file you plan to anchor a step to — verify the content at the target line

### Anchor verification (mandatory)

Before adding any step to the tour:
- Confirm the file exists at the exact path
- Confirm the line number is within the file's length
- Confirm the content at that line matches what the step describes
- If the target content is on a different line than expected, find the correct line

A tour with broken anchors is worse than no tour.

---

## Phase 3 — Design the Narrative

A good tour tells a story. Plan the arc before writing steps:

```
1. Orientation     — where are we? what does this project/module do?
2. Module map      — what are the main components and their responsibilities?
3–N. Core path     — walk the most important execution path step by step
N-1. Edge case     — one gotcha or non-obvious behavior worth highlighting
N.   Closing       — what comes next? where to explore further?
```

For each step, plan using SMIG:
- **S**ituation: what is the reader looking at?
- **M**echanism: how does this piece work?
- **I**mplication: why does this matter?
- **G**otcha: what would a careful reader easily miss here?

Not every step needs all four — use what applies.

---

## Phase 4 — Write the Tour File

Save to: `.tours/{persona}-{kebab-topic}.tour`

```bash
mkdir -p .tours
```

### Tour file format

```json
{
  "$schema": "https://aka.ms/codetour-schema",
  "title": "{Descriptive Title}",
  "description": "{One sentence: what this tour covers and who it is for}",
  "ref": "main",
  "steps": [
    {
      "directory": "{path/to/dir}",
      "title": "{Step title}",
      "description": "{Step description — see writing rules below}"
    },
    {
      "file": "{exact/path/to/file.go}",
      "line": 42,
      "title": "{Step title}",
      "description": "{Step description}"
    },
    {
      "file": "{exact/path/to/file.ts}",
      "selection": {
        "start": { "line": 10, "character": 1 },
        "end": { "line": 25, "character": 1 }
      },
      "title": "{Step title}",
      "description": "{Step description}"
    }
  ]
}
```

### Step type selection

| Type | Use when |
|---|---|
| `directory` | Orienting the reader to a module or package |
| `file` + `line` | Default — pointing to a specific declaration or call |
| `file` + `selection` | When a block of code (function body, struct, config) matters as a whole |
| `description` only (no file) | Closing step with summary or next steps — use sparingly |

### Step description writing rules

- Lead with what the reader is seeing, then explain why it matters
- Keep each step under 5 sentences — if you need more, split into two steps
- Use markdown: `code spans`, **bold** for emphasis, bullet lists for multiple points
- Reference other files with relative paths when relevant: `See also: pkg/auth/token.go`
- End the last step with: what to explore next, or where to go to implement a change

### What to avoid

- Steps that describe what the code does (the reader can read) — explain WHY and WHAT TO WATCH FOR
- Steps anchored to line numbers that change frequently (prefer selecting a stable declaration)
- More than 16 steps — a tour that is too long will not be finished
- Invented file paths or line numbers — verify every anchor

---

## Phase 5 — Summary

After saving the tour file, display:

```
## Tour Created

**File**: `.tours/{persona}-{topic}.tour`
**Title**: {tour title}
**Persona**: {detected persona}
**Steps**: {N}

### Tour Outline
| # | Step | Location |
|---|------|----------|
| 1 | {title} | {directory or file:line} |
| 2 | {title} | {file:line} |
| ... | ... | ... |

### How to open
1. Install the **CodeTour** extension in VSCode (if not already installed)
2. Open the Explorer panel → find **CODETOURS** section
3. Click **{tour title}** to start

> Or run from command palette: `CodeTour: Start Tour`
```
