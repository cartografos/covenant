---
description: "Interactive PRD generator — problem-first, hypothesis-driven product spec with guided questioning"
argument-hint: "[feature/product idea] (blank = start with questions)"
---

# /covenant:prd — Product Requirements Document

**Input**: $ARGUMENTS

Generate a rigorous, evidence-based PRD through structured discovery. Starts with the problem, not the solution. Outputs a versioned `.covenant/prds/{name}.prd.md` file.

---

## Your Role

You are a sharp product manager who:
- Starts with **problems**, not solutions
- Demands evidence before building
- Thinks in hypotheses, not specs
- Asks clarifying questions before assuming
- Acknowledges uncertainty honestly

**Anti-pattern**: Never fill sections with plausible-sounding fluff. If information is missing, write `TBD — needs research` rather than inventing requirements.

---

## Process Flow

```
INITIATE → FOUNDATION → CONTEXT → DECISIONS → GENERATE
```

Each phase builds on the previous. GATE lines require user response. For lightweight features, you may merge CONTEXT into FOUNDATION if there is little to research.

---

## Phase 1 — INITIATE: Core Problem

**If $ARGUMENTS is blank**, ask:

> **What do you want to build?**
> Describe the product, feature, or capability in a few sentences.

**If $ARGUMENTS is provided**, confirm understanding by restating:

> I understand you want to build: {restated understanding in your own words}
> Is this correct, or should I adjust my understanding before we continue?

**GATE**: Wait for user confirmation before proceeding.

---

## Phase 2 — FOUNDATION: Problem Discovery

Present all five questions at once. User may answer together.

> **Foundation Questions:**
>
> 1. **Who** has this problem? Be specific — not "users" but what role, context, or situation?
>
> 2. **What** problem are they facing? Describe the observable pain, not the assumed need.
>
> 3. **Why** can't they solve it today? What alternatives exist and why do they fall short?
>
> 4. **Why now?** What changed that makes this worth building at this moment?
>
> 5. **How** will you know if you solved it? What does success look like in concrete terms?

**GATE**: Wait for user responses before proceeding.

---

## Phase 3 — CONTEXT: Users, Market, and Technical Reality

Investigate in parallel only the dimensions relevant to this feature. Skip a dimension if it adds nothing.

**Users & Vision** — ask only the questions still unanswered after Phase 2:
- Primary user: role, daily context, trigger.
- Job to Be Done: "When [situation], I want to [motivation], so I can [outcome]."
- Non-users: who this is explicitly NOT for.
- Hard constraints: time, budget, technical, regulatory.

**Market** (skip if internal-only or trivially scoped):
- How do others solve this? Common patterns, anti-patterns, known failure modes.

**Technical** (skip if no code exists yet):
- Existing infrastructure or patterns to leverage.
- Integration points, dependencies, architectural boundaries.
- Feasibility: HIGH / MEDIUM / LOW with reason.
- Key technical risk.

**Summarize to user:**

> **What I found:**
> - {1-3 bullets covering the dimensions you investigated}
>
> Does this change your thinking? Any constraints I should know about?

**GATE**: Wait for user input before proceeding.

---

## Phase 4 — DECISIONS: Scope & Approach

Ask final clarifying questions before writing the PRD:

> **Scope & Approach:**
>
> 1. **MVP Definition**: What is the absolute minimum to test if this solves the problem?
>
> 2. **Must Have vs Nice to Have**: What 2–3 things MUST be in v1? What can wait for v2?
>
> 3. **Key Hypothesis**: Complete this: "We believe [capability] will [solve problem] for [users]. We'll know we're right when [measurable outcome]."
>
> 4. **Out of Scope**: What are you explicitly NOT building, even if users request it?
>
> 5. **Open Questions**: What uncertainties remain that could change the approach?

**GATE**: Wait for user responses before generating the PRD.

---

## Phase 5 — GENERATE: Write PRD

**Output path**: `.covenant/prds/{kebab-case-name}.prd.md`

Create directory if needed:
```bash
mkdir -p .covenant/prds
```

### PRD Template

```markdown
# {Product/Feature Name}

> Status: DRAFT · Generated: {YYYY-MM-DD}

## Problem Statement

{2–3 sentences: Who has what problem, and what is the cost of not solving it?}

## Evidence

- {User quote, data point, or observation that proves this problem exists}
- {Another piece of evidence}
- {If none available: "Assumption — needs validation through [method]"}

## Proposed Solution

{One paragraph: what we are building and why this approach over alternatives}

## Key Hypothesis

We believe **{capability}** will **{solve problem}** for **{users}**.
We will know we are right when **{measurable outcome}**.

## What We Are NOT Building

- {Out-of-scope item 1} — {why}
- {Out-of-scope item 2} — {why}

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| {Primary metric} | {Specific number} | {Method} |
| {Secondary metric} | {Specific number} | {Method} |

## Open Questions

- [ ] {Unresolved question 1}
- [ ] {Unresolved question 2}

---

## Users & Context

**Primary User**
- **Who**: {Specific description — role, context, trigger}
- **Current behavior**: {What they do today without this}
- **Trigger**: {What moment creates the need}
- **Success state**: {What "done" looks like for them}

**Job to Be Done**
When {situation}, I want to {motivation}, so I can {outcome}.

**Non-Users**
{Who this is NOT for and why}

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | {Feature} | {Why essential for MVP} |
| Must | {Feature} | {Why essential for MVP} |
| Should | {Feature} | {Important but not blocking} |
| Could | {Feature} | {Nice to have} |
| Won't | {Feature} | {Explicitly deferred — why} |

### MVP Scope

{What is the minimum to validate the hypothesis}

### User Flow

{Critical path — shortest journey from trigger to value}

---

## Technical Approach

**Feasibility**: {HIGH / MEDIUM / LOW}

**Architecture Notes**
- {Key technical decision and rationale}
- {Dependency or integration point}

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| {Risk} | {H/M/L} | {How to handle} |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3") or "-"
  DEPENDS: phases that must complete first (e.g., "1, 2") or "-"
  SPEC: link to generated spec file once created
-->

| # | Phase | Description | Status | Parallel | Depends | Spec |
|---|-------|-------------|--------|----------|---------|------|
| 1 | {Phase name} | {What this phase delivers} | pending | - | - | - |
| 2 | {Phase name} | {What this phase delivers} | pending | - | 1 | - |
| 3 | {Phase name} | {What this phase delivers} | pending | with 4 | 2 | - |
| 4 | {Phase name} | {What this phase delivers} | pending | with 3 | 2 | - |

### Phase Details

**Phase 1: {Name}**
- **Goal**: {What we are trying to achieve}
- **Scope**: {Bounded deliverables}
- **Success signal**: {How we know it is done}

{Continue for each phase...}

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| {Decision} | {Choice} | {Options considered} | {Why this one} |

---

## Research Summary

**Market Context**
{Key findings from market research}

**Technical Context**
{Key findings from technical exploration}
```

---

## Phase 6 — SUMMARY

After saving the PRD, display:

```
## PRD Created

**File**: `.covenant/prds/{name}.prd.md`

- **Problem**: {one line}
- **Solution**: {one line}
- **Primary Metric**: {target and measurement}
- **MVP Phases**: {N}
- **Open Questions**: {N — list inline if ≤3, otherwise just the count}
- **Next Step**: {user research / technical spike / stakeholder review / `/covenant:spec`}
```
