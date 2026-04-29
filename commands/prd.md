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
INITIATE → FOUNDATION → GROUNDING → DEEP DIVE → TECHNICAL → DECISIONS → GENERATE → SUMMARY
```

Each phase builds on the previous. GATE lines require user response before continuing — never skip them.

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

## Phase 3 — GROUNDING: Market & Context Research

After receiving foundation answers, conduct research in parallel:

**Market research:**
1. Find similar products or features in the market
2. Identify how others solve this problem
3. Note common patterns, anti-patterns, and known failure modes
4. Check for recent trends or shifts in this space

**Codebase research (if a project exists):**
1. Find existing functionality relevant to this idea
2. Identify patterns, components, or infrastructure that could be leveraged
3. Note technical constraints or opportunities

**Summarize findings to user:**

> **What I found:**
> - {Market insight 1}
> - {Competitor approach or gap}
> - {Relevant codebase pattern, if applicable}
>
> Does this change or refine your thinking?

**GATE**: Brief pause for user input (can be "continue" or adjustments).

---

## Phase 4 — DEEP DIVE: Vision & Users

Based on foundation + research, ask:

> **Vision & Users:**
>
> 1. **Vision**: In one sentence, what is the ideal end state if this succeeds?
>
> 2. **Primary User**: Describe your most important user — their role, daily context, and what triggers their need.
>
> 3. **Job to Be Done**: Complete this: "When [situation], I want to [motivation], so I can [outcome]."
>
> 4. **Non-Users**: Who is explicitly NOT the target? Who should this design ignore?
>
> 5. **Constraints**: What hard limitations exist? (time, budget, technical, regulatory, org)

**GATE**: Wait for user responses before proceeding.

---

## Phase 5 — TECHNICAL: Feasibility Assessment

**If a codebase exists**, run two parallel investigations:

Investigation 1 — Feasibility:
1. Identify existing infrastructure that can be leveraged
2. Find similar patterns already implemented
3. Map integration points and dependencies
4. Locate relevant types, config, and test patterns

Investigation 2 — Constraints:
1. Trace how related features are implemented end-to-end
2. Map data flow through potential integration points
3. Identify architectural patterns and their boundaries
4. Estimate complexity based on similar implemented features

**Summarize to user:**

> **Technical Context:**
> - **Feasibility**: {HIGH / MEDIUM / LOW} — because {reason}
> - **Can leverage**: {existing patterns or infrastructure}
> - **Key technical risk**: {main concern}
>
> Any technical constraints I should know about?

**If no codebase**, research technical approaches:
1. Find how others have implemented this technically
2. Identify common implementation patterns and pitfalls
3. Note version-specific gotchas or ecosystem considerations

**GATE**: Brief pause for user input before proceeding.

---

## Phase 6 — DECISIONS: Scope & Approach

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

## Phase 7 — GENERATE: Write PRD

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

## Phase 8 — SUMMARY: Report to User

After saving the PRD, always display this summary:

```
## PRD Created

**File**: `.covenant/prds/{name}.prd.md`

### At a Glance
| Field | Value |
|-------|-------|
| Problem | {one line} |
| Solution | {one line} |
| Primary Metric | {target and measurement method} |
| Complexity | {Simple / Medium / Complex} |
| MVP Phases | {N phases defined} |

### Validation Status
| Section | Status |
|---------|--------|
| Problem Statement | {Validated / Assumption} |
| User Research | {Done / Needed} |
| Technical Feasibility | {Assessed / TBD} |
| Success Metrics | {Defined / Needs refinement} |
| Hypothesis | {Clear / Vague} |

### Open Questions ({N})
{List each open question}

### Recommended Next Step
{One of: user research, technical spike, stakeholder review, proceed to spec}

### Implementation Phases
| # | Phase | Status | Parallel |
|---|-------|--------|----------|
{table rows from PRD}

---
> To create a spec for the next pending phase:
> `/covenant:spec .covenant/prds/{name}.prd.md`
```
