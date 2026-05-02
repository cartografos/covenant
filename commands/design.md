---
description: "Architecture design — study the codebase and propose 2-3 concrete approaches with tradeoffs before writing any spec or code"
argument-hint: "<feature or system to design>"
---

# /covenant:design — Architecture Design

**Input**: $ARGUMENTS

Explore architectural options before committing to a spec or implementation. The `architect` agent studies your existing codebase, proposes concrete approaches with honest tradeoffs, and produces a blueprint after you choose.

Use this before `/covenant:spec` when:
- The feature is complex enough that the right architecture is not obvious
- You want to evaluate multiple approaches before committing
- You need a blueprint (interfaces, types, file structure) to hand off

---

## Launch Architect

Delegate to the `architect` agent with the full request:

```
Subagent: architect
Request: {$ARGUMENTS}
Goal:
  1. Study the codebase to understand existing patterns
  2. Propose 2-3 architectural approaches with concrete tradeoffs
  3. Wait for user to select an approach
  4. Produce a blueprint: component map, interfaces/types in code, data flow, build sequence
```

The architect will interact with you directly during the design process — asking for clarification, presenting options, and waiting for your decision before producing the blueprint.

---

## After the Blueprint

Once the architect delivers a blueprint, save it to disk:

```bash
mkdir -p .covenant/designs
```

Write the blueprint to `.covenant/designs/{kebab-case-name}.design.md` using this template:

```markdown
# Design — {Feature Name}

> Chosen approach: {approach name} · Date: {YYYY-MM-DD}

## Approaches Considered

### {Approach 1 name}
{Summary and tradeoffs}

### {Approach 2 name}
{Summary and tradeoffs}

## Selected: {Approach Name}

{Why this approach was chosen}

## Blueprint

### Component Map

| Action | File | Purpose |
|---|---|---|
{table from blueprint}

### Interfaces and Types

```{language}
{key interfaces/types from blueprint}
```

### Data Flow

{data flow from blueprint}

### Build Sequence

{build sequence from blueprint}
```

Then display the summary:

```
## Design Complete

**Feature**: {feature name}
**Chosen approach**: {approach name}
**Saved to**: `.covenant/designs/{name}.design.md`
**Files to create**: {N}
**Files to modify**: {N}

### Component Map
| Action | File | Purpose |
|---|---|---|
{table from blueprint}

### Key Interfaces
{code block with main interfaces/types from blueprint}

---
> Next step: `/covenant:spec .covenant/designs/{name}.design.md`
> The spec will use this design as the foundation for Phase 2 (Solution Exploration).
```
