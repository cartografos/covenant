---
description: "Explore and investigate a codebase — understand how something works, where it lives, or how pieces connect. Free-form, no planning output."
argument-hint: "<question | topic | function | file | flow>"
---

# /covenant:explore — Code Explorer

**Input**: $ARGUMENTS

Investigate the codebase and answer a question. No plan. No spec. Just understanding.

Use this when you want to know:
- How does X work?
- Where is Y defined or used?
- What calls Z?
- What is the flow for this operation?
- How is this module organized?
- What patterns does this codebase use for X?

---

## Detect Intent

Classify $ARGUMENTS into one of these modes:

| Input | Mode | Action |
|---|---|---|
| A question ("how does auth work?") | **Flow** | Trace the relevant code path end-to-end |
| A symbol name (`UserService`, `handlePayment`) | **Symbol** | Find definition, all call sites, and related types |
| A file path (`pkg/auth/token.go`) | **File** | Explain structure, exports, dependencies, and role |
| A concept ("error handling", "database access") | **Pattern** | Find all instances, extract the pattern in use |
| A directory | **Module** | Map the module: what it owns, its exports, its dependencies |
| Blank | Ask | "What do you want to explore?" |

If the input is ambiguous, pick the most likely mode and state it at the top of the response.

---

## Exploration Process

### Step 1 — Orient

Get your bearings before diving in:
- Directory structure of the relevant area
- Entry points and main files
- Language and key dependencies

### Step 2 — Search

Use Grep, Glob, and Read to find what matters. Follow these traces based on mode:

**Flow mode** — trace the request/action path:
1. Find the entry point (handler, CLI command, consumer, cron)
2. Follow each function call into the next layer
3. Note where data is read, transformed, and written
4. Identify error paths and how they propagate
5. Find the exit point (response, event, side effect)

**Symbol mode** — map a specific symbol:
1. Find the definition (file, line, full signature)
2. Find all direct callers
3. Find types it depends on and types that depend on it
4. Note any interface it implements or satisfies

**File mode** — explain a file:
1. Read the file completely
2. List all exported symbols with one-line descriptions
3. Map its imports (what it depends on)
4. Find what imports it (what depends on it)
5. Explain its role in the larger system

**Pattern mode** — find how something is done:
1. Find all instances of the pattern across the codebase
2. Identify the common structure
3. Note variations and exceptions
4. Summarize the convention in use

**Module mode** — map a directory:
1. List all files and their purpose
2. Identify what the module exports vs. keeps internal
3. Map inbound and outbound dependencies
4. Describe the module's responsibility in one sentence

### Step 3 — Connect

After gathering facts, make the connections explicit:
- How do the pieces relate?
- What is the data flow?
- What assumptions does the code make?
- What is non-obvious or worth noting?

---

## Output Format

No rigid template — adapt to what you found. Always include:

1. **Direct answer** to the question at the top (1–3 sentences)
2. **Code locations** — every claim backed by a `file:line` reference
3. **Relevant snippets** — show the actual code that matters, not paraphrases
4. **Flow or structure diagram** (ASCII) if a visual helps
5. **Non-obvious observations** — gotchas, patterns, or surprises worth knowing

Keep the response focused. If the scope is large, summarize the key parts and offer to go deeper on any specific piece.

---

## Depth Control

If $ARGUMENTS contains a depth modifier, adjust accordingly:

| Modifier | Behavior |
|---|---|
| `--quick` | Surface-level only — location, signature, one-liner explanation |
| `--deep` | Follow all references, trace all callers, read all related files |
| `--flow` | Force flow-trace mode regardless of input type |
| `--pattern` | Force pattern-search mode — find all instances across the codebase |

Default depth: enough to answer the question without being exhaustive.
