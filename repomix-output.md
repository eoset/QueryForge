This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.cursor/
  commands/
    speckit.analyze.md
    speckit.checklist.md
    speckit.clarify.md
    speckit.constitution.md
    speckit.implement.md
    speckit.plan.md
    speckit.specify.md
    speckit.tasks.md
    speckit.taskstoissues.md
  rules/
    specify-rules.mdc
.github/
  workflows/
    repomix.yml
    test.yml
.husky/
  pre-commit
.specify/
  memory/
    constitution.md
  scripts/
    bash/
      check-prerequisites.sh
      common.sh
      create-new-feature.sh
      setup-plan.sh
      update-agent-context.sh
  templates/
    agent-file-template.md
    checklist-template.md
    plan-template.md
    spec-template.md
    tasks-template.md
specs/
  001-bigquery-browser/
    checklists/
      requirements.md
    contracts/
      ipc-api.md
    data-model.md
    plan.md
    quickstart.md
    research.md
    spec.md
    tasks.md
src/
  main/
    ipc/
      bigquery.ts
      connection.ts
      queries.ts
      results-cache.ts
      tabs.ts
      ui-settings.ts
    storage/
      connection-store.ts
      query-store.ts
      results-cache-store.ts
      tabs-store.ts
      ui-settings-store.ts
    main.ts
    preload.ts
  renderer/
    components/
      AboutDialog/
        AboutDialog.css
        AboutDialog.tsx
      ConnectionDialog/
        ConnectionDialog.css
        ConnectionDialog.tsx
      DatasetTree/
        DatasetTree.css
        DatasetTree.tsx
      ErrorBoundary/
        ErrorBoundary.css
        ErrorBoundary.tsx
      HelpDialog/
        HelpDialog.css
        HelpDialog.tsx
      QueryEditor/
        QueryEditor.css
        QueryEditor.tsx
      QueryResults/
        CanvasTable.tsx
        ColumnSortMenu.css
        ColumnSortMenu.tsx
        QueryResults.css
        QueryResults.tsx
        RowContextMenu.css
        RowContextMenu.tsx
      SampleDataModal/
        SampleDataModal.css
        SampleDataModal.tsx
      SavedQueries/
        SavedQueries.css
        SavedQueries.tsx
      SavedQueriesTree/
        SavedQueriesTree.css
        SavedQueriesTree.tsx
      SchemaSidebar/
        SchemaSidebar.css
        SchemaSidebar.tsx
      SidebarHeader/
        SidebarHeader.css
        SidebarHeader.tsx
      SidebarSwitcher/
        SidebarSwitcher.css
        SidebarSwitcher.tsx
      TabBar/
        TabBar.css
        TabBar.tsx
      ViewDefinitionModal/
        ViewDefinitionModal.css
        ViewDefinitionModal.tsx
    hooks/
      useBigQuery.ts
    stores/
      bigquery-metadata-store.ts
      connection-store.ts
      queries-store.ts
      tabs-store.ts
    types/
      electron-api.d.ts
    utils/
      bigquery-completions.ts
      bigquery-formatter.ts
    App.css
    App.tsx
    index.html
    index.tsx
  shared/
    types/
      bigquery.ts
      connection.ts
      dataset.ts
      query.ts
    utils/
      connection-validation.ts
tests/
  integration/
    connection-integration.test.tsx
    tabs-integration.test.tsx
  unit/
    main/
      query-store.test.ts
      tabs-store.test.ts
      ui-settings-store.test.ts
    renderer/
      components/
        ConnectionDialog.test.tsx
        ErrorBoundary.test.tsx
        SidebarHeader.test.tsx
        SidebarSwitcher.test.tsx
        TabBar.test.tsx
      hooks/
        useBigQuery.test.ts
      stores/
        bigquery-metadata-store.test.ts
        connection-store.test.ts
        queries-store.test.ts
        tabs-store.test.ts
      App.test.tsx
      bigquery-formatter-additional.test.ts
      bigquery-formatter.test.ts
    shared/
      connection-validation.test.ts
  setup.ts
.eslintignore
.eslintrc.json
.gitignore
.prettierignore
.prettierrc.json
eslint.config.js
jest.config.js
package.json
README.md
tsconfig.json
webpack.renderer.config.js
```

# Files

## File: .cursor/commands/speckit.analyze.md
````markdown
---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/speckit.analyze`.

## Execution Steps

### 1. Initialize Analysis Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command).
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Overview/Context
- Functional Requirements
- Non-Functional Requirements
- User Stories
- Edge Cases (if present)

**From plan.md:**

- Architecture/stack choices
- Data Model references
- Phases
- Technical constraints

**From tasks.md:**

- Task IDs
- Descriptions
- Phase grouping
- Parallel markers [P]
- Referenced file paths

**From constitution:**

- Load `.specify/memory/constitution.md` for principle validation

### 3. Build Semantic Models

Create internal representations (do not include raw artifacts in output):

- **Requirements inventory**: Each functional + non-functional requirement with a stable key (derive slug based on imperative phrase; e.g., "User can upload file" → `user-can-upload-file`)
- **User story/action inventory**: Discrete user actions with acceptance criteria
- **Task coverage mapping**: Map each task to one or more requirements or stories (inference by keyword / explicit reference patterns like IDs or key phrases)
- **Constitution rule set**: Extract principle names and MUST/SHOULD normative statements

### 4. Detection Passes (Token-Efficient Analysis)

Focus on high-signal findings. Limit to 50 findings total; aggregate remainder in overflow summary.

#### A. Duplication Detection

- Identify near-duplicate requirements
- Mark lower-quality phrasing for consolidation

#### B. Ambiguity Detection

- Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???, `<placeholder>`, etc.)

#### C. Underspecification

- Requirements with verbs but missing object or measurable outcome
- User stories missing acceptance criteria alignment
- Tasks referencing files or components not defined in spec/plan

#### D. Constitution Alignment

- Any requirement or plan element conflicting with a MUST principle
- Missing mandated sections or quality gates from constitution

#### E. Coverage Gaps

- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not reflected in tasks (e.g., performance, security)

#### F. Inconsistency

- Terminology drift (same concept named differently across files)
- Data entities referenced in plan but absent in spec (or vice versa)
- Task ordering contradictions (e.g., integration tasks before foundational setup tasks without dependency note)
- Conflicting requirements (e.g., one requires Next.js while other specifies Vue)

### 5. Severity Assignment

Use this heuristic to prioritize findings:

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks baseline functionality
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy not affecting execution order

### 6. Produce Compact Analysis Report

Output a Markdown report (no file writes) with the following structure:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

(Add one row per finding; generate stable IDs prefixed by category initial.)

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**

- Total Requirements
- Total Tasks
- Coverage % (requirements with >=1 task)
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 7. Provide Next Actions

At end of report, output a concise Next Actions block:

- If CRITICAL issues exist: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed, but provide improvement suggestions
- Provide explicit command suggestions: e.g., "Run /speckit.specify with refinement", "Run /speckit.plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'"

### 8. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

## Operating Principles

### Context Efficiency

- **Minimal high-signal tokens**: Focus on actionable findings, not exhaustive documentation
- **Progressive disclosure**: Load artifacts incrementally; don't dump all content into analysis
- **Token-efficient output**: Limit findings table to 50 rows; summarize overflow
- **Deterministic results**: Rerunning without changes should produce consistent IDs and counts

### Analysis Guidelines

- **NEVER modify files** (this is read-only analysis)
- **NEVER hallucinate missing sections** (if absent, report them accurately)
- **Prioritize constitution violations** (these are always CRITICAL)
- **Use examples over exhaustive rules** (cite specific instances, not generic patterns)
- **Report zero issues gracefully** (emit success report with coverage statistics)

## Context

$ARGUMENTS
````

## File: .cursor/commands/speckit.checklist.md
````markdown
---
description: Generate a custom checklist for the current feature based on user requirements.
---

## Checklist Purpose: "Unit Tests for English"

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** - they validate the quality, clarity, and completeness of requirements in a given domain.

**NOT for verification/testing**:

- ❌ NOT "Verify the button clicks correctly"
- ❌ NOT "Test error handling works"
- ❌ NOT "Confirm the API returns 200"
- ❌ NOT checking if code/implementation matches the spec

**FOR requirements quality validation**:

- ✅ "Are visual hierarchy requirements defined for all card types?" (completeness)
- ✅ "Is 'prominent display' quantified with specific sizing/positioning?" (clarity)
- ✅ "Are hover state requirements consistent across all interactive elements?" (consistency)
- ✅ "Are accessibility requirements defined for keyboard navigation?" (coverage)
- ✅ "Does the spec define what happens when logo image fails to load?" (edge cases)

**Metaphor**: If your spec is code written in English, the checklist is its unit test suite. You're testing whether the requirements are well-written, complete, unambiguous, and ready for implementation - NOT whether the implementation works.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution Steps

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS list.
   - All file paths must be absolute.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Clarify intent (dynamic)**: Derive up to THREE initial contextual clarifying questions (no pre-baked catalog). They MUST:
   - Be generated from the user's phrasing + extracted signals from spec/plan/tasks
   - Only ask about information that materially changes checklist content
   - Be skipped individually if already unambiguous in `$ARGUMENTS`
   - Prefer precision over breadth

   Generation algorithm:
   1. Extract signals: feature domain keywords (e.g., auth, latency, UX, API), risk indicators ("critical", "must", "compliance"), stakeholder hints ("QA", "review", "security team"), and explicit deliverables ("a11y", "rollback", "contracts").
   2. Cluster signals into candidate focus areas (max 4) ranked by relevance.
   3. Identify probable audience & timing (author, reviewer, QA, release) if not explicit.
   4. Detect missing dimensions: scope breadth, depth/rigor, risk emphasis, exclusion boundaries, measurable acceptance criteria.
   5. Formulate questions chosen from these archetypes:
      - Scope refinement (e.g., "Should this include integration touchpoints with X and Y or stay limited to local module correctness?")
      - Risk prioritization (e.g., "Which of these potential risk areas should receive mandatory gating checks?")
      - Depth calibration (e.g., "Is this a lightweight pre-commit sanity list or a formal release gate?")
      - Audience framing (e.g., "Will this be used by the author only or peers during PR review?")
      - Boundary exclusion (e.g., "Should we explicitly exclude performance tuning items this round?")
      - Scenario class gap (e.g., "No recovery flows detected—are rollback / partial failure paths in scope?")

   Question formatting rules:
   - If presenting options, generate a compact table with columns: Option | Candidate | Why It Matters
   - Limit to A–E options maximum; omit table if a free-form answer is clearer
   - Never ask the user to restate what they already said
   - Avoid speculative categories (no hallucination). If uncertain, ask explicitly: "Confirm whether X belongs in scope."

   Defaults when interaction impossible:
   - Depth: Standard
   - Audience: Reviewer (PR) if code-related; Author otherwise
   - Focus: Top 2 relevance clusters

   Output the questions (label Q1/Q2/Q3). After answers: if ≥2 scenario classes (Alternate / Exception / Recovery / Non-Functional domain) remain unclear, you MAY ask up to TWO more targeted follow‑ups (Q4/Q5) with a one-line justification each (e.g., "Unresolved recovery path risk"). Do not exceed five total questions. Skip escalation if user explicitly declines more.

3. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers:
   - Derive checklist theme (e.g., security, review, deploy, ux)
   - Consolidate explicit must-have items mentioned by user
   - Map focus selections to category scaffolding
   - Infer any missing context from spec/plan/tasks (do NOT hallucinate)

4. **Load feature context**: Read from FEATURE_DIR:
   - spec.md: Feature requirements and scope
   - plan.md (if exists): Technical details, dependencies
   - tasks.md (if exists): Implementation tasks

   **Context Loading Strategy**:
   - Load only necessary portions relevant to active focus areas (avoid full-file dumping)
   - Prefer summarizing long sections into concise scenario/requirement bullets
   - Use progressive disclosure: add follow-on retrieval only if gaps detected
   - If source docs are large, generate interim summary items instead of embedding raw text

5. **Generate checklist** - Create "Unit Tests for Requirements":
   - Create `FEATURE_DIR/checklists/` directory if it doesn't exist
   - Generate unique checklist filename:
     - Use short, descriptive name based on domain (e.g., `ux.md`, `api.md`, `security.md`)
     - Format: `[domain].md`
     - If file exists, append to existing file
   - Number items sequentially starting from CHK001
   - Each `/speckit.checklist` run creates a NEW file (never overwrites existing checklists)

   **CORE PRINCIPLE - Test the Requirements, Not the Implementation**:
   Every checklist item MUST evaluate the REQUIREMENTS THEMSELVES for:
   - **Completeness**: Are all necessary requirements present?
   - **Clarity**: Are requirements unambiguous and specific?
   - **Consistency**: Do requirements align with each other?
   - **Measurability**: Can requirements be objectively verified?
   - **Coverage**: Are all scenarios/edge cases addressed?

   **Category Structure** - Group items by requirement quality dimensions:
   - **Requirement Completeness** (Are all necessary requirements documented?)
   - **Requirement Clarity** (Are requirements specific and unambiguous?)
   - **Requirement Consistency** (Do requirements align without conflicts?)
   - **Acceptance Criteria Quality** (Are success criteria measurable?)
   - **Scenario Coverage** (Are all flows/cases addressed?)
   - **Edge Case Coverage** (Are boundary conditions defined?)
   - **Non-Functional Requirements** (Performance, Security, Accessibility, etc. - are they specified?)
   - **Dependencies & Assumptions** (Are they documented and validated?)
   - **Ambiguities & Conflicts** (What needs clarification?)

   **HOW TO WRITE CHECKLIST ITEMS - "Unit Tests for English"**:

   ❌ **WRONG** (Testing implementation):
   - "Verify landing page displays 3 episode cards"
   - "Test hover states work on desktop"
   - "Confirm logo click navigates home"

   ✅ **CORRECT** (Testing requirements quality):
   - "Are the exact number and layout of featured episodes specified?" [Completeness]
   - "Is 'prominent display' quantified with specific sizing/positioning?" [Clarity]
   - "Are hover state requirements consistent across all interactive elements?" [Consistency]
   - "Are keyboard navigation requirements defined for all interactive UI?" [Coverage]
   - "Is the fallback behavior specified when logo image fails to load?" [Edge Cases]
   - "Are loading states defined for asynchronous episode data?" [Completeness]
   - "Does the spec define visual hierarchy for competing UI elements?" [Clarity]

   **ITEM STRUCTURE**:
   Each item should follow this pattern:
   - Question format asking about requirement quality
   - Focus on what's WRITTEN (or not written) in the spec/plan
   - Include quality dimension in brackets [Completeness/Clarity/Consistency/etc.]
   - Reference spec section `[Spec §X.Y]` when checking existing requirements
   - Use `[Gap]` marker when checking for missing requirements

   **EXAMPLES BY QUALITY DIMENSION**:

   Completeness:
   - "Are error handling requirements defined for all API failure modes? [Gap]"
   - "Are accessibility requirements specified for all interactive elements? [Completeness]"
   - "Are mobile breakpoint requirements defined for responsive layouts? [Gap]"

   Clarity:
   - "Is 'fast loading' quantified with specific timing thresholds? [Clarity, Spec §NFR-2]"
   - "Are 'related episodes' selection criteria explicitly defined? [Clarity, Spec §FR-5]"
   - "Is 'prominent' defined with measurable visual properties? [Ambiguity, Spec §FR-4]"

   Consistency:
   - "Do navigation requirements align across all pages? [Consistency, Spec §FR-10]"
   - "Are card component requirements consistent between landing and detail pages? [Consistency]"

   Coverage:
   - "Are requirements defined for zero-state scenarios (no episodes)? [Coverage, Edge Case]"
   - "Are concurrent user interaction scenarios addressed? [Coverage, Gap]"
   - "Are requirements specified for partial data loading failures? [Coverage, Exception Flow]"

   Measurability:
   - "Are visual hierarchy requirements measurable/testable? [Acceptance Criteria, Spec §FR-1]"
   - "Can 'balanced visual weight' be objectively verified? [Measurability, Spec §FR-2]"

   **Scenario Classification & Coverage** (Requirements Quality Focus):
   - Check if requirements exist for: Primary, Alternate, Exception/Error, Recovery, Non-Functional scenarios
   - For each scenario class, ask: "Are [scenario type] requirements complete, clear, and consistent?"
   - If scenario class missing: "Are [scenario type] requirements intentionally excluded or missing? [Gap]"
   - Include resilience/rollback when state mutation occurs: "Are rollback requirements defined for migration failures? [Gap]"

   **Traceability Requirements**:
   - MINIMUM: ≥80% of items MUST include at least one traceability reference
   - Each item should reference: spec section `[Spec §X.Y]`, or use markers: `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`
   - If no ID system exists: "Is a requirement & acceptance criteria ID scheme established? [Traceability]"

   **Surface & Resolve Issues** (Requirements Quality Problems):
   Ask questions about the requirements themselves:
   - Ambiguities: "Is the term 'fast' quantified with specific metrics? [Ambiguity, Spec §NFR-1]"
   - Conflicts: "Do navigation requirements conflict between §FR-10 and §FR-10a? [Conflict]"
   - Assumptions: "Is the assumption of 'always available podcast API' validated? [Assumption]"
   - Dependencies: "Are external podcast API requirements documented? [Dependency, Gap]"
   - Missing definitions: "Is 'visual hierarchy' defined with measurable criteria? [Gap]"

   **Content Consolidation**:
   - Soft cap: If raw candidate items > 40, prioritize by risk/impact
   - Merge near-duplicates checking the same requirement aspect
   - If >5 low-impact edge cases, create one item: "Are edge cases X, Y, Z addressed in requirements? [Coverage]"

   **🚫 ABSOLUTELY PROHIBITED** - These make it an implementation test, not a requirements test:
   - ❌ Any item starting with "Verify", "Test", "Confirm", "Check" + implementation behavior
   - ❌ References to code execution, user actions, system behavior
   - ❌ "Displays correctly", "works properly", "functions as expected"
   - ❌ "Click", "navigate", "render", "load", "execute"
   - ❌ Test cases, test plans, QA procedures
   - ❌ Implementation details (frameworks, APIs, algorithms)

   **✅ REQUIRED PATTERNS** - These test requirements quality:
   - ✅ "Are [requirement type] defined/specified/documented for [scenario]?"
   - ✅ "Is [vague term] quantified/clarified with specific criteria?"
   - ✅ "Are requirements consistent between [section A] and [section B]?"
   - ✅ "Can [requirement] be objectively measured/verified?"
   - ✅ "Are [edge cases/scenarios] addressed in requirements?"
   - ✅ "Does the spec define [missing aspect]?"

6. **Structure Reference**: Generate the checklist following the canonical template in `.specify/templates/checklist-template.md` for title, meta section, category headings, and ID formatting. If template is unavailable, use: H1 title, purpose/created meta lines, `##` category sections containing `- [ ] CHK### <requirement item>` lines with globally incrementing IDs starting at CHK001.

7. **Report**: Output full path to created checklist, item count, and remind user that each run creates a new file. Summarize:
   - Focus areas selected
   - Depth level
   - Actor/timing
   - Any explicit user-specified must-have items incorporated

**Important**: Each `/speckit.checklist` command invocation creates a checklist file using short, descriptive names unless file already exists. This allows:

- Multiple checklists of different types (e.g., `ux.md`, `test.md`, `security.md`)
- Simple, memorable filenames that indicate checklist purpose
- Easy identification and navigation in the `checklists/` folder

To avoid clutter, use descriptive types and clean up obsolete checklists when done.

## Example Checklist Types & Sample Items

**UX Requirements Quality:** `ux.md`

Sample items (testing the requirements, NOT the implementation):

- "Are visual hierarchy requirements defined with measurable criteria? [Clarity, Spec §FR-1]"
- "Is the number and positioning of UI elements explicitly specified? [Completeness, Spec §FR-1]"
- "Are interaction state requirements (hover, focus, active) consistently defined? [Consistency]"
- "Are accessibility requirements specified for all interactive elements? [Coverage, Gap]"
- "Is fallback behavior defined when images fail to load? [Edge Case, Gap]"
- "Can 'prominent display' be objectively measured? [Measurability, Spec §FR-4]"

**API Requirements Quality:** `api.md`

Sample items:

- "Are error response formats specified for all failure scenarios? [Completeness]"
- "Are rate limiting requirements quantified with specific thresholds? [Clarity]"
- "Are authentication requirements consistent across all endpoints? [Consistency]"
- "Are retry/timeout requirements defined for external dependencies? [Coverage, Gap]"
- "Is versioning strategy documented in requirements? [Gap]"

**Performance Requirements Quality:** `performance.md`

Sample items:

- "Are performance requirements quantified with specific metrics? [Clarity]"
- "Are performance targets defined for all critical user journeys? [Coverage]"
- "Are performance requirements under different load conditions specified? [Completeness]"
- "Can performance requirements be objectively measured? [Measurability]"
- "Are degradation requirements defined for high-load scenarios? [Edge Case, Gap]"

**Security Requirements Quality:** `security.md`

Sample items:

- "Are authentication requirements specified for all protected resources? [Coverage]"
- "Are data protection requirements defined for sensitive information? [Completeness]"
- "Is the threat model documented and requirements aligned to it? [Traceability]"
- "Are security requirements consistent with compliance obligations? [Consistency]"
- "Are security failure/breach response requirements defined? [Gap, Exception Flow]"

## Anti-Examples: What NOT To Do

**❌ WRONG - These test implementation, not requirements:**

```markdown
- [ ] CHK001 - Verify landing page displays 3 episode cards [Spec §FR-001]
- [ ] CHK002 - Test hover states work correctly on desktop [Spec §FR-003]
- [ ] CHK003 - Confirm logo click navigates to home page [Spec §FR-010]
- [ ] CHK004 - Check that related episodes section shows 3-5 items [Spec §FR-005]
```

**✅ CORRECT - These test requirements quality:**

```markdown
- [ ] CHK001 - Are the number and layout of featured episodes explicitly specified? [Completeness, Spec §FR-001]
- [ ] CHK002 - Are hover state requirements consistently defined for all interactive elements? [Consistency, Spec §FR-003]
- [ ] CHK003 - Are navigation requirements clear for all clickable brand elements? [Clarity, Spec §FR-010]
- [ ] CHK004 - Is the selection criteria for related episodes documented? [Gap, Spec §FR-005]
- [ ] CHK005 - Are loading state requirements defined for asynchronous episode data? [Gap]
- [ ] CHK006 - Can "visual hierarchy" requirements be objectively measured? [Measurability, Spec §FR-001]
```

**Key Differences:**

- Wrong: Tests if the system works correctly
- Correct: Tests if the requirements are written correctly
- Wrong: Verification of behavior
- Correct: Validation of requirement quality
- Wrong: "Does it do X?"
- Correct: "Is X clearly specified?"
````

## File: .cursor/commands/speckit.clarify.md
````markdown
---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Note: This clarification workflow is expected to run (and be completed) BEFORE invoking `/speckit.plan`. If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.

Execution steps:

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root **once** (combined `--json --paths-only` mode / `-Json -PathsOnly`). Parse minimal JSON payload fields:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Optionally capture `IMPL_PLAN`, `TASKS` for future chained flows.)
   - If JSON parsing fails, abort and instruct user to re-run `/speckit.specify` or verify feature branch environment.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. Load the current spec file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing. Produce an internal coverage map used for prioritization (do not output raw map unless no questions will be asked).

   Functional Scope & Behavior:
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   Domain & Data Model:
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   Interaction & UX Flow:
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility or localization notes

   Non-Functional Quality Attributes:
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   Integration & External Dependencies:
   - External services/APIs and failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   Edge Cases & Failure Handling:
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   Constraints & Tradeoffs:
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs or rejected alternatives

   Terminology & Consistency:
   - Canonical glossary terms
   - Avoided synonyms / deprecated terms

   Completion Signals:
   - Acceptance criteria testability
   - Measurable Definition of Done style indicators

   Misc / Placeholders:
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

   For each category with Partial or Missing status, add a candidate question opportunity unless:
   - Clarification would not materially change implementation or validation strategy
   - Information is better deferred to planning phase (note internally)

3. Generate (internally) a prioritized queue of candidate clarification questions (maximum 5). Do NOT output them all at once. Apply these constraints:
    - Maximum of 10 total questions across the whole session.
    - Each question must be answerable with EITHER:
       - A short multiple‑choice selection (2–5 distinct, mutually exclusive options), OR
       - A one-word / short‑phrase answer (explicitly constrain: "Answer in <=5 words").
    - Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation.
    - Ensure category coverage balance: attempt to cover the highest impact unresolved categories first; avoid asking two low-impact questions when a single high-impact area (e.g., security posture) is unresolved.
    - Exclude questions already answered, trivial stylistic preferences, or plan-level execution details (unless blocking correctness).
    - Favor clarifications that reduce downstream rework risk or prevent misaligned acceptance tests.
    - If more than 5 categories remain unresolved, select the top 5 by (Impact * Uncertainty) heuristic.

4. Sequential questioning loop (interactive):
    - Present EXACTLY ONE question at a time.
    - For multiple‑choice questions:
       - **Analyze all options** and determine the **most suitable option** based on:
          - Best practices for the project type
          - Common patterns in similar implementations
          - Risk reduction (security, performance, maintainability)
          - Alignment with any explicit project goals or constraints visible in the spec
       - Present your **recommended option prominently** at the top with clear reasoning (1-2 sentences explaining why this is the best choice).
       - Format as: `**Recommended:** Option [X] - <reasoning>`
       - Then render all options as a Markdown table:

       | Option | Description |
       |--------|-------------|
       | A | <Option A description> |
       | B | <Option B description> |
       | C | <Option C description> (add D/E as needed up to 5) |
       | Short | Provide a different short answer (<=5 words) (Include only if free-form alternative is appropriate) |

       - After the table, add: `You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.`
    - For short‑answer style (no meaningful discrete options):
       - Provide your **suggested answer** based on best practices and context.
       - Format as: `**Suggested:** <your proposed answer> - <brief reasoning>`
       - Then output: `Format: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", or provide your own answer.`
    - After the user answers:
       - If the user replies with "yes", "recommended", or "suggested", use your previously stated recommendation/suggestion as the answer.
       - Otherwise, validate the answer maps to one option or fits the <=5 word constraint.
       - If ambiguous, ask for a quick disambiguation (count still belongs to same question; do not advance).
       - Once satisfactory, record it in working memory (do not yet write to disk) and move to the next queued question.
    - Stop asking further questions when:
       - All critical ambiguities resolved early (remaining queued items become unnecessary), OR
       - User signals completion ("done", "good", "no more"), OR
       - You reach 5 asked questions.
    - Never reveal future queued questions in advance.
    - If no valid questions exist at start, immediately report no critical ambiguities.

5. Integration after EACH accepted answer (incremental update approach):
    - Maintain in-memory representation of the spec (loaded once at start) plus the raw file contents.
    - For the first integrated answer in this session:
       - Ensure a `## Clarifications` section exists (create it just after the highest-level contextual/overview section per the spec template if missing).
       - Under it, create (if not present) a `### Session YYYY-MM-DD` subheading for today.
    - Append a bullet line immediately after acceptance: `- Q: <question> → A: <final answer>`.
    - Then immediately apply the clarification to the most appropriate section(s):
       - Functional ambiguity → Update or add a bullet in Functional Requirements.
       - User interaction / actor distinction → Update User Stories or Actors subsection (if present) with clarified role, constraint, or scenario.
       - Data shape / entities → Update Data Model (add fields, types, relationships) preserving ordering; note added constraints succinctly.
       - Non-functional constraint → Add/modify measurable criteria in Non-Functional / Quality Attributes section (convert vague adjective to metric or explicit target).
       - Edge case / negative flow → Add a new bullet under Edge Cases / Error Handling (or create such subsection if template provides placeholder for it).
       - Terminology conflict → Normalize term across spec; retain original only if necessary by adding `(formerly referred to as "X")` once.
    - If the clarification invalidates an earlier ambiguous statement, replace that statement instead of duplicating; leave no obsolete contradictory text.
    - Save the spec file AFTER each integration to minimize risk of context loss (atomic overwrite).
    - Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
    - Keep each inserted clarification minimal and testable (avoid narrative drift).

6. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Total asked (accepted) questions ≤ 5.
   - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
   - No contradictory earlier statement remains (scan for now-invalid alternative choices removed).
   - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Terminology consistency: same canonical term used across all updated sections.

7. Write the updated spec back to `FEATURE_SPEC`.

8. Report completion (after questioning loop ends or early termination):
   - Number of questions asked & answered.
   - Path to updated spec.
   - Sections touched (list names).
   - Coverage summary table listing each taxonomy category with Status: Resolved (was Partial/Missing and addressed), Deferred (exceeds question quota or better suited for planning), Clear (already sufficient), Outstanding (still Partial/Missing but low impact).
   - If any Outstanding or Deferred remain, recommend whether to proceed to `/speckit.plan` or run `/speckit.clarify` again later post-plan.
   - Suggested next command.

Behavior rules:

- If no meaningful ambiguities found (or all potential questions would be low-impact), respond: "No critical ambiguities detected worth formal clarification." and suggest proceeding.
- If spec file missing, instruct user to run `/speckit.specify` first (do not create a new spec here).
- Never exceed 5 total asked questions (clarification retries for a single question do not count as new questions).
- Avoid speculative tech stack questions unless the absence blocks functional clarity.
- Respect user early termination signals ("stop", "done", "proceed").
- If no questions asked due to full coverage, output a compact coverage summary (all categories Clear) then suggest advancing.
- If quota reached with unresolved high-impact categories remaining, explicitly flag them under Deferred with rationale.

Context for prioritization: $ARGUMENTS
````

## File: .cursor/commands/speckit.constitution.md
````markdown
---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
handoffs: 
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

Follow this execution flow:

1. Load the existing constitution template at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that - follow the general template. You will update the doc accordingly.

2. Collect/derive values for placeholders:
   - If user input (conversation) supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if embedded).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date (if unknown ask or mark TODO), `LAST_AMENDED_DATE` is today if changes are made, otherwise keep previous.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - If version bump type ambiguous, propose reasoning before finalizing.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Consistency propagation checklist (convert prior checklist into active validations):
   - Read `.specify/templates/plan-template.md` and ensure any "Constitution Check" or rules align with updated principles.
   - Read `.specify/templates/spec-template.md` for scope/requirements alignment—update if constitution adds/removes mandatory sections or constraints.
   - Read `.specify/templates/tasks-template.md` and ensure task categorization reflects new or removed principle-driven task types (e.g., observability, versioning, testing discipline).
   - Read each command file in `.specify/templates/commands/*.md` (including this one) to verify no outdated references (agent-specific names like CLAUDE only) remain when generic guidance is required.
   - Read any runtime guidance docs (e.g., `README.md`, `docs/quickstart.md`, or agent-specific guidance files if present). Update references to principles changed.

5. Produce a Sync Impact Report (prepend as an HTML comment at top of the constitution file after update):
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred.

6. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).

7. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

Formatting & Style Requirements:

- Use Markdown headings exactly as in the template (do not demote/promote levels).
- Wrap long rationale lines to keep readability (<100 chars ideally) but do not hard enforce with awkward breaks.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

If the user supplies partial updates (e.g., only one principle revision), still perform validation and version decision steps.

If critical info missing (e.g., ratification date truly unknown), insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.

Do not create a new template; always operate on the existing `.specify/memory/constitution.md` file.
````

## File: .cursor/commands/speckit.implement.md
````markdown
---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

6. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

7. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

8. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

9. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckit.tasks` first to regenerate the task list.
````

## File: .cursor/commands/speckit.plan.md
````markdown
---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
````

## File: .cursor/commands/speckit.specify.md
````markdown
---
description: Create or update the feature specification from a natural language feature description.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Check for existing branches before creating new one**:
   
   a. First, fetch all remote branches to ensure we have the latest information:
      ```bash
      git fetch --all --prune
      ```
   
   b. Find the highest feature number across all sources for the short-name:
      - Remote branches: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - Local branches: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - Specs directories: Check for directories matching `specs/[0-9]+-<short-name>`
   
   c. Determine the next available number:
      - Extract all numbers from all three sources
      - Find the highest number N
      - Use N+1 for the new branch number
   
   d. Run the script `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"` with the calculated number and short-name:
      - Pass `--number N+1` and `--short-name "your-short-name"` along with the feature description
      - Bash example: `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS" --json --number 5 --short-name "user-auth" "Add user authentication"`
      - PowerShell example: `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS" -Json -Number 5 -ShortName "user-auth" "Add user authentication"`
   
   **IMPORTANT**:
   - Check all three sources (remote branches, local branches, specs directories) to find the highest number
   - Only match branches/directories with the exact short-name pattern
   - If no existing branches/directories found with this short-name, start with number 1
   - You must only ever run this script once per feature
   - The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for
   - The JSON output will contain BRANCH_NAME and SPEC_FILE paths
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot")

3. Load `.specify/templates/spec-template.md` to understand required sections.

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

5. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

6. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `FEATURE_DIR/checklists/requirements.md` using the checklist template structure with these validation items:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified
      
      ## Feature Readiness
      
      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification
      
      ## Notes
      
      - Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
      ```

   b. **Run Validation Check**: Review the spec against each checklist item:
      - For each item, determine if it passes or fails
      - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:

      - **If all items pass**: Mark checklist complete and proceed to step 6

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List the failing items and specific issues
        2. Update the spec to address each issue
        3. Re-run validation until all items pass (max 3 iterations)
        4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

      - **If [NEEDS CLARIFICATION] markers remain**:
        1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
        2. **LIMIT CHECK**: If more than 3 markers exist, keep only the 3 most critical (by scope/security/UX impact) and make informed guesses for the rest
        3. For each clarification needed (max 3), present options to user in this format:

           ```markdown
           ## Question [N]: [Topic]
           
           **Context**: [Quote relevant spec section]
           
           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]
           
           **Suggested Answers**:
           
           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |
           
           **Your choice**: _[Wait for user response]_
           ```

        4. **CRITICAL - Table Formatting**: Ensure markdown tables are properly formatted:
           - Use consistent spacing with pipes aligned
           - Each cell should have spaces around content: `| Content |` not `|Content|`
           - Header separator must have at least 3 dashes: `|--------|`
           - Test that the table renders correctly in markdown preview
        5. Number questions sequentially (Q1, Q2, Q3 - max 3 total)
        6. Present all questions together before waiting for responses
        7. Wait for user to respond with their choices for all questions (e.g., "Q1: A, Q2: Custom - [details], Q3: B")
        8. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
        9. Re-run validation after all clarifications are resolved

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

7. Report completion with branch name, spec file path, checklist results, and readiness for the next phase (`/speckit.clarify` or `/speckit.plan`).

**NOTE:** The script creates and checks out the new branch and initializes the spec file before writing.

## General Guidelines

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec. That will be a separate command.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: RESTful APIs unless specified otherwise

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)
````

## File: .cursor/commands/speckit.tasks.md
````markdown
---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `.specify.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per user story
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Endpoints/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)

2. **From Contracts**:
   - Map each contract/endpoint → to the user story it serves
   - If tests requested: Each contract → contract test task [P] before implementation in that story's phase

3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns
````

## File: .cursor/commands/speckit.taskstoissues.md
````markdown
---
description: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.
tools: ['github/github-mcp-server/issue_write']
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

**ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL**

1. For each task in the list, use the GitHub MCP server to create a new issue in the repository that is representative of the Git remote.

**UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL**
````

## File: .cursor/rules/specify-rules.mdc
````
# bq_browser Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-25

## Active Technologies

- TypeScript 5.x, Node.js 18+ + Electron 28+, React 18+, @google-cloud/bigquery, electron-store (001-bigquery-browser)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 18+: Follow standard conventions

## Recent Changes

- 001-bigquery-browser: Added TypeScript 5.x, Node.js 18+ + Electron 28+, React 18+, @google-cloud/bigquery, electron-store

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
````

## File: .github/workflows/repomix.yml
````yaml
name: Run Repomix on Main Push
on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  run-repomix:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install repomix
        run: npm install -g repomix

      - name: Run repomix
        run: repomix --style markdown --output repomix-output.md

      - name: Check if repomix output changed
        run: |
          if git diff --quiet; then
            echo "no_changes=true" >> $GITHUB_ENV
          else
            echo "no_changes=false" >> $GITHUB_ENV
          fi

      - name: Commit and push changes
        if: env.no_changes == 'false'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add repomix-output.md
          git commit -m "Update repomix output"
          git push origin main
````

## File: .github/workflows/test.yml
````yaml
name: Tests

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        id: test
        run: |
          # Run tests and capture output
          npm test -- --silent --coverage --coverageReporters=text-summary 2>&1 | tee test-output.txt
          
          # Store exit code
          TEST_EXIT_CODE=${PIPESTATUS[0]}
          
          # Extract summary for the comment
          echo "## Test Results" > test-summary.md
          echo "" >> test-summary.md
          
          if [ $TEST_EXIT_CODE -eq 0 ]; then
            echo "✅ **All tests passed!**" >> test-summary.md
          else
            echo "❌ **Some tests failed**" >> test-summary.md
          fi
          
          echo "" >> test-summary.md
          echo "\`\`\`" >> test-summary.md
          grep -E "(Test Suites:|Tests:|Snapshots:|Time:|Statements|Branches|Functions|Lines)" test-output.txt >> test-summary.md
          echo "\`\`\`" >> test-summary.md
          
          # Exit with the test exit code
          exit $TEST_EXIT_CODE
        continue-on-error: true

      - name: Comment PR with test results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('test-summary.md', 'utf8');
            
            // Find existing comment
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            
            const botComment = comments.find(comment => 
              comment.user.type === 'Bot' && 
              comment.body.includes('## Test Results')
            );
            
            const commentBody = summary + '\n\n*Updated: ' + new Date().toISOString() + '*';
            
            if (botComment) {
              // Update existing comment
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: botComment.id,
                body: commentBody
              });
            } else {
              // Create new comment
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: commentBody
              });
            }

      - name: Fail if tests failed
        if: steps.test.outcome == 'failure'
        run: exit 1
````

## File: .husky/pre-commit
````
npm test
````

## File: .specify/memory/constitution.md
````markdown
# [PROJECT_NAME] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]
<!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]
<!-- Example: II. CLI Interface -->
[PRINCIPLE_2_DESCRIPTION]
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
[PRINCIPLE_3_DESCRIPTION]
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]
<!-- Example: IV. Integration Testing -->
[PRINCIPLE_4_DESCRIPTION]
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
[PRINCIPLE_5_DESCRIPTION]
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
````

## File: .specify/scripts/bash/check-prerequisites.sh
````bash
#!/usr/bin/env bash

# Consolidated prerequisite checking script
#
# This script provides unified prerequisite checking for Spec-Driven Development workflow.
# It replaces the functionality previously spread across multiple scripts.
#
# Usage: ./check-prerequisites.sh [OPTIONS]
#
# OPTIONS:
#   --json              Output in JSON format
#   --require-tasks     Require tasks.md to exist (for implementation phase)
#   --include-tasks     Include tasks.md in AVAILABLE_DOCS list
#   --paths-only        Only output path variables (no validation)
#   --help, -h          Show help message
#
# OUTPUTS:
#   JSON mode: {"FEATURE_DIR":"...", "AVAILABLE_DOCS":["..."]}
#   Text mode: FEATURE_DIR:... \n AVAILABLE_DOCS: \n ✓/✗ file.md
#   Paths only: REPO_ROOT: ... \n BRANCH: ... \n FEATURE_DIR: ... etc.

set -e

# Parse command line arguments
JSON_MODE=false
REQUIRE_TASKS=false
INCLUDE_TASKS=false
PATHS_ONLY=false

for arg in "$@"; do
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --require-tasks)
            REQUIRE_TASKS=true
            ;;
        --include-tasks)
            INCLUDE_TASKS=true
            ;;
        --paths-only)
            PATHS_ONLY=true
            ;;
        --help|-h)
            cat << 'EOF'
Usage: check-prerequisites.sh [OPTIONS]

Consolidated prerequisite checking for Spec-Driven Development workflow.

OPTIONS:
  --json              Output in JSON format
  --require-tasks     Require tasks.md to exist (for implementation phase)
  --include-tasks     Include tasks.md in AVAILABLE_DOCS list
  --paths-only        Only output path variables (no prerequisite validation)
  --help, -h          Show this help message

EXAMPLES:
  # Check task prerequisites (plan.md required)
  ./check-prerequisites.sh --json
  
  # Check implementation prerequisites (plan.md + tasks.md required)
  ./check-prerequisites.sh --json --require-tasks --include-tasks
  
  # Get feature paths only (no validation)
  ./check-prerequisites.sh --paths-only
  
EOF
            exit 0
            ;;
        *)
            echo "ERROR: Unknown option '$arg'. Use --help for usage information." >&2
            exit 1
            ;;
    esac
done

# Source common functions
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get feature paths and validate branch
eval $(get_feature_paths)
check_feature_branch "$CURRENT_BRANCH" "$HAS_GIT" || exit 1

# If paths-only mode, output paths and exit (support JSON + paths-only combined)
if $PATHS_ONLY; then
    if $JSON_MODE; then
        # Minimal JSON paths payload (no validation performed)
        printf '{"REPO_ROOT":"%s","BRANCH":"%s","FEATURE_DIR":"%s","FEATURE_SPEC":"%s","IMPL_PLAN":"%s","TASKS":"%s"}\n' \
            "$REPO_ROOT" "$CURRENT_BRANCH" "$FEATURE_DIR" "$FEATURE_SPEC" "$IMPL_PLAN" "$TASKS"
    else
        echo "REPO_ROOT: $REPO_ROOT"
        echo "BRANCH: $CURRENT_BRANCH"
        echo "FEATURE_DIR: $FEATURE_DIR"
        echo "FEATURE_SPEC: $FEATURE_SPEC"
        echo "IMPL_PLAN: $IMPL_PLAN"
        echo "TASKS: $TASKS"
    fi
    exit 0
fi

# Validate required directories and files
if [[ ! -d "$FEATURE_DIR" ]]; then
    echo "ERROR: Feature directory not found: $FEATURE_DIR" >&2
    echo "Run /speckit.specify first to create the feature structure." >&2
    exit 1
fi

if [[ ! -f "$IMPL_PLAN" ]]; then
    echo "ERROR: plan.md not found in $FEATURE_DIR" >&2
    echo "Run /speckit.plan first to create the implementation plan." >&2
    exit 1
fi

# Check for tasks.md if required
if $REQUIRE_TASKS && [[ ! -f "$TASKS" ]]; then
    echo "ERROR: tasks.md not found in $FEATURE_DIR" >&2
    echo "Run /speckit.tasks first to create the task list." >&2
    exit 1
fi

# Build list of available documents
docs=()

# Always check these optional docs
[[ -f "$RESEARCH" ]] && docs+=("research.md")
[[ -f "$DATA_MODEL" ]] && docs+=("data-model.md")

# Check contracts directory (only if it exists and has files)
if [[ -d "$CONTRACTS_DIR" ]] && [[ -n "$(ls -A "$CONTRACTS_DIR" 2>/dev/null)" ]]; then
    docs+=("contracts/")
fi

[[ -f "$QUICKSTART" ]] && docs+=("quickstart.md")

# Include tasks.md if requested and it exists
if $INCLUDE_TASKS && [[ -f "$TASKS" ]]; then
    docs+=("tasks.md")
fi

# Output results
if $JSON_MODE; then
    # Build JSON array of documents
    if [[ ${#docs[@]} -eq 0 ]]; then
        json_docs="[]"
    else
        json_docs=$(printf '"%s",' "${docs[@]}")
        json_docs="[${json_docs%,}]"
    fi
    
    printf '{"FEATURE_DIR":"%s","AVAILABLE_DOCS":%s}\n' "$FEATURE_DIR" "$json_docs"
else
    # Text output
    echo "FEATURE_DIR:$FEATURE_DIR"
    echo "AVAILABLE_DOCS:"
    
    # Show status of each potential document
    check_file "$RESEARCH" "research.md"
    check_file "$DATA_MODEL" "data-model.md"
    check_dir "$CONTRACTS_DIR" "contracts/"
    check_file "$QUICKSTART" "quickstart.md"
    
    if $INCLUDE_TASKS; then
        check_file "$TASKS" "tasks.md"
    fi
fi
````

## File: .specify/scripts/bash/common.sh
````bash
#!/usr/bin/env bash
# Common functions and variables for all scripts

# Get repository root, with fallback for non-git repositories
get_repo_root() {
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        # Fall back to script location for non-git repos
        local script_dir="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        (cd "$script_dir/../../.." && pwd)
    fi
}

# Get current branch, with fallback for non-git repositories
get_current_branch() {
    # First check if SPECIFY_FEATURE environment variable is set
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi

    # Then check git if available
    if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
        git rev-parse --abbrev-ref HEAD
        return
    fi

    # For non-git repos, try to find the latest feature directory
    local repo_root=$(get_repo_root)
    local specs_dir="$repo_root/specs"

    if [[ -d "$specs_dir" ]]; then
        local latest_feature=""
        local highest=0

        for dir in "$specs_dir"/*; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" =~ ^([0-9]{3})- ]]; then
                    local number=${BASH_REMATCH[1]}
                    number=$((10#$number))
                    if [[ "$number" -gt "$highest" ]]; then
                        highest=$number
                        latest_feature=$dirname
                    fi
                fi
            fi
        done

        if [[ -n "$latest_feature" ]]; then
            echo "$latest_feature"
            return
        fi
    fi

    echo "main"  # Final fallback
}

# Check if we have git available
has_git() {
    git rev-parse --show-toplevel >/dev/null 2>&1
}

check_feature_branch() {
    local branch="$1"
    local has_git_repo="$2"

    # For non-git repos, we can't enforce branch naming but still provide output
    if [[ "$has_git_repo" != "true" ]]; then
        echo "[specify] Warning: Git repository not detected; skipped branch validation" >&2
        return 0
    fi

    if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
        echo "ERROR: Not on a feature branch. Current branch: $branch" >&2
        echo "Feature branches should be named like: 001-feature-name" >&2
        return 1
    fi

    return 0
}

get_feature_dir() { echo "$1/specs/$2"; }

# Find feature directory by numeric prefix instead of exact branch match
# This allows multiple branches to work on the same spec (e.g., 004-fix-bug, 004-add-feature)
find_feature_dir_by_prefix() {
    local repo_root="$1"
    local branch_name="$2"
    local specs_dir="$repo_root/specs"

    # Extract numeric prefix from branch (e.g., "004" from "004-whatever")
    if [[ ! "$branch_name" =~ ^([0-9]{3})- ]]; then
        # If branch doesn't have numeric prefix, fall back to exact match
        echo "$specs_dir/$branch_name"
        return
    fi

    local prefix="${BASH_REMATCH[1]}"

    # Search for directories in specs/ that start with this prefix
    local matches=()
    if [[ -d "$specs_dir" ]]; then
        for dir in "$specs_dir"/"$prefix"-*; do
            if [[ -d "$dir" ]]; then
                matches+=("$(basename "$dir")")
            fi
        done
    fi

    # Handle results
    if [[ ${#matches[@]} -eq 0 ]]; then
        # No match found - return the branch name path (will fail later with clear error)
        echo "$specs_dir/$branch_name"
    elif [[ ${#matches[@]} -eq 1 ]]; then
        # Exactly one match - perfect!
        echo "$specs_dir/${matches[0]}"
    else
        # Multiple matches - this shouldn't happen with proper naming convention
        echo "ERROR: Multiple spec directories found with prefix '$prefix': ${matches[*]}" >&2
        echo "Please ensure only one spec directory exists per numeric prefix." >&2
        echo "$specs_dir/$branch_name"  # Return something to avoid breaking the script
    fi
}

get_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    local has_git_repo="false"

    if has_git; then
        has_git_repo="true"
    fi

    # Use prefix-based lookup to support multiple branches per spec
    local feature_dir=$(find_feature_dir_by_prefix "$repo_root" "$current_branch")

    cat <<EOF
REPO_ROOT='$repo_root'
CURRENT_BRANCH='$current_branch'
HAS_GIT='$has_git_repo'
FEATURE_DIR='$feature_dir'
FEATURE_SPEC='$feature_dir/spec.md'
IMPL_PLAN='$feature_dir/plan.md'
TASKS='$feature_dir/tasks.md'
RESEARCH='$feature_dir/research.md'
DATA_MODEL='$feature_dir/data-model.md'
QUICKSTART='$feature_dir/quickstart.md'
CONTRACTS_DIR='$feature_dir/contracts'
EOF
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
````

## File: .specify/scripts/bash/create-new-feature.sh
````bash
#!/usr/bin/env bash

set -e

JSON_MODE=false
SHORT_NAME=""
BRANCH_NUMBER=""
ARGS=()
i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json) 
            JSON_MODE=true 
            ;;
        --short-name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            # Check if the next argument is another option (starts with --)
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            SHORT_NAME="$next_arg"
            ;;
        --number)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            BRANCH_NUMBER="$next_arg"
            ;;
        --help|-h) 
            echo "Usage: $0 [--json] [--short-name <name>] [--number N] <feature_description>"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --short-name <name> Provide a custom short name (2-4 words) for the branch"
            echo "  --number N          Specify branch number manually (overrides auto-detection)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 'Add user authentication system' --short-name 'user-auth'"
            echo "  $0 'Implement OAuth2 integration for API' --number 5"
            exit 0
            ;;
        *) 
            ARGS+=("$arg") 
            ;;
    esac
    i=$((i + 1))
done

FEATURE_DESCRIPTION="${ARGS[*]}"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] [--short-name <name>] [--number N] <feature_description>" >&2
    exit 1
fi

# Function to find the repository root by searching for existing project markers
find_repo_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ] || [ -d "$dir/.specify" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Function to get highest number from specs directory
get_highest_from_specs() {
    local specs_dir="$1"
    local highest=0
    
    if [ -d "$specs_dir" ]; then
        for dir in "$specs_dir"/*; do
            [ -d "$dir" ] || continue
            dirname=$(basename "$dir")
            number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
            number=$((10#$number))
            if [ "$number" -gt "$highest" ]; then
                highest=$number
            fi
        done
    fi
    
    echo "$highest"
}

# Function to get highest number from git branches
get_highest_from_branches() {
    local highest=0
    
    # Get all branches (local and remote)
    branches=$(git branch -a 2>/dev/null || echo "")
    
    if [ -n "$branches" ]; then
        while IFS= read -r branch; do
            # Clean branch name: remove leading markers and remote prefixes
            clean_branch=$(echo "$branch" | sed 's/^[* ]*//; s|^remotes/[^/]*/||')
            
            # Extract feature number if branch matches pattern ###-*
            if echo "$clean_branch" | grep -q '^[0-9]\{3\}-'; then
                number=$(echo "$clean_branch" | grep -o '^[0-9]\{3\}' || echo "0")
                number=$((10#$number))
                if [ "$number" -gt "$highest" ]; then
                    highest=$number
                fi
            fi
        done <<< "$branches"
    fi
    
    echo "$highest"
}

# Function to check existing branches (local and remote) and return next available number
check_existing_branches() {
    local short_name="$1"
    local specs_dir="$2"
    
    # Fetch all remotes to get latest branch info (suppress errors if no remotes)
    git fetch --all --prune 2>/dev/null || true
    
    # Find all branches matching the pattern using git ls-remote (more reliable)
    local remote_branches=$(git ls-remote --heads origin 2>/dev/null | grep -E "refs/heads/[0-9]+-${short_name}$" | sed 's/.*\/\([0-9]*\)-.*/\1/' | sort -n)
    
    # Also check local branches
    local local_branches=$(git branch 2>/dev/null | grep -E "^[* ]*[0-9]+-${short_name}$" | sed 's/^[* ]*//' | sed 's/-.*//' | sort -n)
    
    # Check specs directory as well
    local spec_dirs=""
    if [ -d "$specs_dir" ]; then
        spec_dirs=$(find "$specs_dir" -maxdepth 1 -type d -name "[0-9]*-${short_name}" 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/-.*//' | sort -n)
    fi
    
    # Combine all sources and get the highest number
    local max_num=0
    for num in $remote_branches $local_branches $spec_dirs; do
        if [ "$num" -gt "$max_num" ]; then
            max_num=$num
        fi
    done
    
    # Return next number
    echo $((max_num + 1))
}

# Function to clean and format a branch name
clean_branch_name() {
    local name="$1"
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Resolve repository root. Prefer git information when available, but fall back
# to searching for repository markers so the workflow still functions in repositories that
# were initialised with --no-git.
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    HAS_GIT=true
else
    REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
    if [ -z "$REPO_ROOT" ]; then
        echo "Error: Could not determine repository root. Please run this script from within the repository." >&2
        exit 1
    fi
    HAS_GIT=false
fi

cd "$REPO_ROOT"

SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

# Function to generate branch name with stop word filtering and length filtering
generate_branch_name() {
    local description="$1"
    
    # Common stop words to filter out
    local stop_words="^(i|a|an|the|to|for|of|in|on|at|by|with|from|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall|this|that|these|those|my|your|our|their|want|need|add|get|set)$"
    
    # Convert to lowercase and split into words
    local clean_name=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')
    
    # Filter words: remove stop words and words shorter than 3 chars (unless they're uppercase acronyms in original)
    local meaningful_words=()
    for word in $clean_name; do
        # Skip empty words
        [ -z "$word" ] && continue
        
        # Keep words that are NOT stop words AND (length >= 3 OR are potential acronyms)
        if ! echo "$word" | grep -qiE "$stop_words"; then
            if [ ${#word} -ge 3 ]; then
                meaningful_words+=("$word")
            elif echo "$description" | grep -q "\b${word^^}\b"; then
                # Keep short words if they appear as uppercase in original (likely acronyms)
                meaningful_words+=("$word")
            fi
        fi
    done
    
    # If we have meaningful words, use first 3-4 of them
    if [ ${#meaningful_words[@]} -gt 0 ]; then
        local max_words=3
        if [ ${#meaningful_words[@]} -eq 4 ]; then max_words=4; fi
        
        local result=""
        local count=0
        for word in "${meaningful_words[@]}"; do
            if [ $count -ge $max_words ]; then break; fi
            if [ -n "$result" ]; then result="$result-"; fi
            result="$result$word"
            count=$((count + 1))
        done
        echo "$result"
    else
        # Fallback to original logic if no meaningful words found
        local cleaned=$(clean_branch_name "$description")
        echo "$cleaned" | tr '-' '\n' | grep -v '^$' | head -3 | tr '\n' '-' | sed 's/-$//'
    fi
}

# Generate branch name
if [ -n "$SHORT_NAME" ]; then
    # Use provided short name, just clean it up
    BRANCH_SUFFIX=$(clean_branch_name "$SHORT_NAME")
else
    # Generate from description with smart filtering
    BRANCH_SUFFIX=$(generate_branch_name "$FEATURE_DESCRIPTION")
fi

# Determine branch number
if [ -z "$BRANCH_NUMBER" ]; then
    if [ "$HAS_GIT" = true ]; then
        # Check existing branches on remotes
        BRANCH_NUMBER=$(check_existing_branches "$BRANCH_SUFFIX" "$SPECS_DIR")
    else
        # Fall back to local directory check
        HIGHEST=$(get_highest_from_specs "$SPECS_DIR")
        BRANCH_NUMBER=$((HIGHEST + 1))
    fi
fi

FEATURE_NUM=$(printf "%03d" "$BRANCH_NUMBER")
BRANCH_NAME="${FEATURE_NUM}-${BRANCH_SUFFIX}"

# GitHub enforces a 244-byte limit on branch names
# Validate and truncate if necessary
MAX_BRANCH_LENGTH=244
if [ ${#BRANCH_NAME} -gt $MAX_BRANCH_LENGTH ]; then
    # Calculate how much we need to trim from suffix
    # Account for: feature number (3) + hyphen (1) = 4 chars
    MAX_SUFFIX_LENGTH=$((MAX_BRANCH_LENGTH - 4))
    
    # Truncate suffix at word boundary if possible
    TRUNCATED_SUFFIX=$(echo "$BRANCH_SUFFIX" | cut -c1-$MAX_SUFFIX_LENGTH)
    # Remove trailing hyphen if truncation created one
    TRUNCATED_SUFFIX=$(echo "$TRUNCATED_SUFFIX" | sed 's/-$//')
    
    ORIGINAL_BRANCH_NAME="$BRANCH_NAME"
    BRANCH_NAME="${FEATURE_NUM}-${TRUNCATED_SUFFIX}"
    
    >&2 echo "[specify] Warning: Branch name exceeded GitHub's 244-byte limit"
    >&2 echo "[specify] Original: $ORIGINAL_BRANCH_NAME (${#ORIGINAL_BRANCH_NAME} bytes)"
    >&2 echo "[specify] Truncated to: $BRANCH_NAME (${#BRANCH_NAME} bytes)"
fi

if [ "$HAS_GIT" = true ]; then
    git checkout -b "$BRANCH_NAME"
else
    >&2 echo "[specify] Warning: Git repository not detected; skipped branch creation for $BRANCH_NAME"
fi

FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi

# Set the SPECIFY_FEATURE environment variable for the current session
export SPECIFY_FEATURE="$BRANCH_NAME"

if $JSON_MODE; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s"}\n' "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_NUM: $FEATURE_NUM"
    echo "SPECIFY_FEATURE environment variable set to: $BRANCH_NAME"
fi
````

## File: .specify/scripts/bash/setup-plan.sh
````bash
#!/usr/bin/env bash

set -e

# Parse command line arguments
JSON_MODE=false
ARGS=()

for arg in "$@"; do
    case "$arg" in
        --json) 
            JSON_MODE=true 
            ;;
        --help|-h) 
            echo "Usage: $0 [--json]"
            echo "  --json    Output results in JSON format"
            echo "  --help    Show this help message"
            exit 0 
            ;;
        *) 
            ARGS+=("$arg") 
            ;;
    esac
done

# Get script directory and load common functions
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get all paths and variables from common functions
eval $(get_feature_paths)

# Check if we're on a proper feature branch (only for git repos)
check_feature_branch "$CURRENT_BRANCH" "$HAS_GIT" || exit 1

# Ensure the feature directory exists
mkdir -p "$FEATURE_DIR"

# Copy plan template if it exists
TEMPLATE="$REPO_ROOT/.specify/templates/plan-template.md"
if [[ -f "$TEMPLATE" ]]; then
    cp "$TEMPLATE" "$IMPL_PLAN"
    echo "Copied plan template to $IMPL_PLAN"
else
    echo "Warning: Plan template not found at $TEMPLATE"
    # Create a basic plan file if template doesn't exist
    touch "$IMPL_PLAN"
fi

# Output results
if $JSON_MODE; then
    printf '{"FEATURE_SPEC":"%s","IMPL_PLAN":"%s","SPECS_DIR":"%s","BRANCH":"%s","HAS_GIT":"%s"}\n' \
        "$FEATURE_SPEC" "$IMPL_PLAN" "$FEATURE_DIR" "$CURRENT_BRANCH" "$HAS_GIT"
else
    echo "FEATURE_SPEC: $FEATURE_SPEC"
    echo "IMPL_PLAN: $IMPL_PLAN" 
    echo "SPECS_DIR: $FEATURE_DIR"
    echo "BRANCH: $CURRENT_BRANCH"
    echo "HAS_GIT: $HAS_GIT"
fi
````

## File: .specify/scripts/bash/update-agent-context.sh
````bash
#!/usr/bin/env bash

# Update agent context files with information from plan.md
#
# This script maintains AI agent context files by parsing feature specifications 
# and updating agent-specific configuration files with project information.
#
# MAIN FUNCTIONS:
# 1. Environment Validation
#    - Verifies git repository structure and branch information
#    - Checks for required plan.md files and templates
#    - Validates file permissions and accessibility
#
# 2. Plan Data Extraction
#    - Parses plan.md files to extract project metadata
#    - Identifies language/version, frameworks, databases, and project types
#    - Handles missing or incomplete specification data gracefully
#
# 3. Agent File Management
#    - Creates new agent context files from templates when needed
#    - Updates existing agent files with new project information
#    - Preserves manual additions and custom configurations
#    - Supports multiple AI agent formats and directory structures
#
# 4. Content Generation
#    - Generates language-specific build/test commands
#    - Creates appropriate project directory structures
#    - Updates technology stacks and recent changes sections
#    - Maintains consistent formatting and timestamps
#
# 5. Multi-Agent Support
#    - Handles agent-specific file paths and naming conventions
#    - Supports: Claude, Gemini, Copilot, Cursor, Qwen, opencode, Codex, Windsurf, Kilo Code, Auggie CLI, Roo Code, CodeBuddy CLI, Amp, SHAI, or Amazon Q Developer CLI
#    - Can update single agents or all existing agent files
#    - Creates default Claude file if no agent files exist
#
# Usage: ./update-agent-context.sh [agent_type]
# Agent types: claude|gemini|copilot|cursor-agent|qwen|opencode|codex|windsurf|kilocode|auggie|shai|q
# Leave empty to update all existing agent files

set -e

# Enable strict error handling
set -u
set -o pipefail

#==============================================================================
# Configuration and Global Variables
#==============================================================================

# Get script directory and load common functions
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get all paths and variables from common functions
eval $(get_feature_paths)

NEW_PLAN="$IMPL_PLAN"  # Alias for compatibility with existing code
AGENT_TYPE="${1:-}"

# Agent-specific file paths  
CLAUDE_FILE="$REPO_ROOT/CLAUDE.md"
GEMINI_FILE="$REPO_ROOT/GEMINI.md"
COPILOT_FILE="$REPO_ROOT/.github/agents/copilot-instructions.md"
CURSOR_FILE="$REPO_ROOT/.cursor/rules/specify-rules.mdc"
QWEN_FILE="$REPO_ROOT/QWEN.md"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"
WINDSURF_FILE="$REPO_ROOT/.windsurf/rules/specify-rules.md"
KILOCODE_FILE="$REPO_ROOT/.kilocode/rules/specify-rules.md"
AUGGIE_FILE="$REPO_ROOT/.augment/rules/specify-rules.md"
ROO_FILE="$REPO_ROOT/.roo/rules/specify-rules.md"
CODEBUDDY_FILE="$REPO_ROOT/CODEBUDDY.md"
AMP_FILE="$REPO_ROOT/AGENTS.md"
SHAI_FILE="$REPO_ROOT/SHAI.md"
Q_FILE="$REPO_ROOT/AGENTS.md"

# Template file
TEMPLATE_FILE="$REPO_ROOT/.specify/templates/agent-file-template.md"

# Global variables for parsed plan data
NEW_LANG=""
NEW_FRAMEWORK=""
NEW_DB=""
NEW_PROJECT_TYPE=""

#==============================================================================
# Utility Functions
#==============================================================================

log_info() {
    echo "INFO: $1"
}

log_success() {
    echo "✓ $1"
}

log_error() {
    echo "ERROR: $1" >&2
}

log_warning() {
    echo "WARNING: $1" >&2
}

# Cleanup function for temporary files
cleanup() {
    local exit_code=$?
    rm -f /tmp/agent_update_*_$$
    rm -f /tmp/manual_additions_$$
    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

#==============================================================================
# Validation Functions
#==============================================================================

validate_environment() {
    # Check if we have a current branch/feature (git or non-git)
    if [[ -z "$CURRENT_BRANCH" ]]; then
        log_error "Unable to determine current feature"
        if [[ "$HAS_GIT" == "true" ]]; then
            log_info "Make sure you're on a feature branch"
        else
            log_info "Set SPECIFY_FEATURE environment variable or create a feature first"
        fi
        exit 1
    fi
    
    # Check if plan.md exists
    if [[ ! -f "$NEW_PLAN" ]]; then
        log_error "No plan.md found at $NEW_PLAN"
        log_info "Make sure you're working on a feature with a corresponding spec directory"
        if [[ "$HAS_GIT" != "true" ]]; then
            log_info "Use: export SPECIFY_FEATURE=your-feature-name or create a new feature first"
        fi
        exit 1
    fi
    
    # Check if template exists (needed for new files)
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_warning "Template file not found at $TEMPLATE_FILE"
        log_warning "Creating new agent files will fail"
    fi
}

#==============================================================================
# Plan Parsing Functions
#==============================================================================

extract_plan_field() {
    local field_pattern="$1"
    local plan_file="$2"
    
    grep "^\*\*${field_pattern}\*\*: " "$plan_file" 2>/dev/null | \
        head -1 | \
        sed "s|^\*\*${field_pattern}\*\*: ||" | \
        sed 's/^[ \t]*//;s/[ \t]*$//' | \
        grep -v "NEEDS CLARIFICATION" | \
        grep -v "^N/A$" || echo ""
}

parse_plan_data() {
    local plan_file="$1"
    
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file not found: $plan_file"
        return 1
    fi
    
    if [[ ! -r "$plan_file" ]]; then
        log_error "Plan file is not readable: $plan_file"
        return 1
    fi
    
    log_info "Parsing plan data from $plan_file"
    
    NEW_LANG=$(extract_plan_field "Language/Version" "$plan_file")
    NEW_FRAMEWORK=$(extract_plan_field "Primary Dependencies" "$plan_file")
    NEW_DB=$(extract_plan_field "Storage" "$plan_file")
    NEW_PROJECT_TYPE=$(extract_plan_field "Project Type" "$plan_file")
    
    # Log what we found
    if [[ -n "$NEW_LANG" ]]; then
        log_info "Found language: $NEW_LANG"
    else
        log_warning "No language information found in plan"
    fi
    
    if [[ -n "$NEW_FRAMEWORK" ]]; then
        log_info "Found framework: $NEW_FRAMEWORK"
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]]; then
        log_info "Found database: $NEW_DB"
    fi
    
    if [[ -n "$NEW_PROJECT_TYPE" ]]; then
        log_info "Found project type: $NEW_PROJECT_TYPE"
    fi
}

format_technology_stack() {
    local lang="$1"
    local framework="$2"
    local parts=()
    
    # Add non-empty parts
    [[ -n "$lang" && "$lang" != "NEEDS CLARIFICATION" ]] && parts+=("$lang")
    [[ -n "$framework" && "$framework" != "NEEDS CLARIFICATION" && "$framework" != "N/A" ]] && parts+=("$framework")
    
    # Join with proper formatting
    if [[ ${#parts[@]} -eq 0 ]]; then
        echo ""
    elif [[ ${#parts[@]} -eq 1 ]]; then
        echo "${parts[0]}"
    else
        # Join multiple parts with " + "
        local result="${parts[0]}"
        for ((i=1; i<${#parts[@]}; i++)); do
            result="$result + ${parts[i]}"
        done
        echo "$result"
    fi
}

#==============================================================================
# Template and Content Generation Functions
#==============================================================================

get_project_structure() {
    local project_type="$1"
    
    if [[ "$project_type" == *"web"* ]]; then
        echo "backend/\\nfrontend/\\ntests/"
    else
        echo "src/\\ntests/"
    fi
}

get_commands_for_language() {
    local lang="$1"
    
    case "$lang" in
        *"Python"*)
            echo "cd src && pytest && ruff check ."
            ;;
        *"Rust"*)
            echo "cargo test && cargo clippy"
            ;;
        *"JavaScript"*|*"TypeScript"*)
            echo "npm test \\&\\& npm run lint"
            ;;
        *)
            echo "# Add commands for $lang"
            ;;
    esac
}

get_language_conventions() {
    local lang="$1"
    echo "$lang: Follow standard conventions"
}

create_new_agent_file() {
    local target_file="$1"
    local temp_file="$2"
    local project_name="$3"
    local current_date="$4"
    
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "Template not found at $TEMPLATE_FILE"
        return 1
    fi
    
    if [[ ! -r "$TEMPLATE_FILE" ]]; then
        log_error "Template file is not readable: $TEMPLATE_FILE"
        return 1
    fi
    
    log_info "Creating new agent context file from template..."
    
    if ! cp "$TEMPLATE_FILE" "$temp_file"; then
        log_error "Failed to copy template file"
        return 1
    fi
    
    # Replace template placeholders
    local project_structure
    project_structure=$(get_project_structure "$NEW_PROJECT_TYPE")
    
    local commands
    commands=$(get_commands_for_language "$NEW_LANG")
    
    local language_conventions
    language_conventions=$(get_language_conventions "$NEW_LANG")
    
    # Perform substitutions with error checking using safer approach
    # Escape special characters for sed by using a different delimiter or escaping
    local escaped_lang=$(printf '%s\n' "$NEW_LANG" | sed 's/[\[\.*^$()+{}|]/\\&/g')
    local escaped_framework=$(printf '%s\n' "$NEW_FRAMEWORK" | sed 's/[\[\.*^$()+{}|]/\\&/g')
    local escaped_branch=$(printf '%s\n' "$CURRENT_BRANCH" | sed 's/[\[\.*^$()+{}|]/\\&/g')
    
    # Build technology stack and recent change strings conditionally
    local tech_stack
    if [[ -n "$escaped_lang" && -n "$escaped_framework" ]]; then
        tech_stack="- $escaped_lang + $escaped_framework ($escaped_branch)"
    elif [[ -n "$escaped_lang" ]]; then
        tech_stack="- $escaped_lang ($escaped_branch)"
    elif [[ -n "$escaped_framework" ]]; then
        tech_stack="- $escaped_framework ($escaped_branch)"
    else
        tech_stack="- ($escaped_branch)"
    fi

    local recent_change
    if [[ -n "$escaped_lang" && -n "$escaped_framework" ]]; then
        recent_change="- $escaped_branch: Added $escaped_lang + $escaped_framework"
    elif [[ -n "$escaped_lang" ]]; then
        recent_change="- $escaped_branch: Added $escaped_lang"
    elif [[ -n "$escaped_framework" ]]; then
        recent_change="- $escaped_branch: Added $escaped_framework"
    else
        recent_change="- $escaped_branch: Added"
    fi

    local substitutions=(
        "s|\[PROJECT NAME\]|$project_name|"
        "s|\[DATE\]|$current_date|"
        "s|\[EXTRACTED FROM ALL PLAN.MD FILES\]|$tech_stack|"
        "s|\[ACTUAL STRUCTURE FROM PLANS\]|$project_structure|g"
        "s|\[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES\]|$commands|"
        "s|\[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE\]|$language_conventions|"
        "s|\[LAST 3 FEATURES AND WHAT THEY ADDED\]|$recent_change|"
    )
    
    for substitution in "${substitutions[@]}"; do
        if ! sed -i.bak -e "$substitution" "$temp_file"; then
            log_error "Failed to perform substitution: $substitution"
            rm -f "$temp_file" "$temp_file.bak"
            return 1
        fi
    done
    
    # Convert \n sequences to actual newlines
    newline=$(printf '\n')
    sed -i.bak2 "s/\\\\n/${newline}/g" "$temp_file"
    
    # Clean up backup files
    rm -f "$temp_file.bak" "$temp_file.bak2"
    
    return 0
}




update_existing_agent_file() {
    local target_file="$1"
    local current_date="$2"
    
    log_info "Updating existing agent context file..."
    
    # Use a single temporary file for atomic update
    local temp_file
    temp_file=$(mktemp) || {
        log_error "Failed to create temporary file"
        return 1
    }
    
    # Process the file in one pass
    local tech_stack=$(format_technology_stack "$NEW_LANG" "$NEW_FRAMEWORK")
    local new_tech_entries=()
    local new_change_entry=""
    
    # Prepare new technology entries
    if [[ -n "$tech_stack" ]] && ! grep -q "$tech_stack" "$target_file"; then
        new_tech_entries+=("- $tech_stack ($CURRENT_BRANCH)")
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]] && [[ "$NEW_DB" != "NEEDS CLARIFICATION" ]] && ! grep -q "$NEW_DB" "$target_file"; then
        new_tech_entries+=("- $NEW_DB ($CURRENT_BRANCH)")
    fi
    
    # Prepare new change entry
    if [[ -n "$tech_stack" ]]; then
        new_change_entry="- $CURRENT_BRANCH: Added $tech_stack"
    elif [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]] && [[ "$NEW_DB" != "NEEDS CLARIFICATION" ]]; then
        new_change_entry="- $CURRENT_BRANCH: Added $NEW_DB"
    fi
    
    # Check if sections exist in the file
    local has_active_technologies=0
    local has_recent_changes=0
    
    if grep -q "^## Active Technologies" "$target_file" 2>/dev/null; then
        has_active_technologies=1
    fi
    
    if grep -q "^## Recent Changes" "$target_file" 2>/dev/null; then
        has_recent_changes=1
    fi
    
    # Process file line by line
    local in_tech_section=false
    local in_changes_section=false
    local tech_entries_added=false
    local changes_entries_added=false
    local existing_changes_count=0
    local file_ended=false
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Handle Active Technologies section
        if [[ "$line" == "## Active Technologies" ]]; then
            echo "$line" >> "$temp_file"
            in_tech_section=true
            continue
        elif [[ $in_tech_section == true ]] && [[ "$line" =~ ^##[[:space:]] ]]; then
            # Add new tech entries before closing the section
            if [[ $tech_entries_added == false ]] && [[ ${#new_tech_entries[@]} -gt 0 ]]; then
                printf '%s\n' "${new_tech_entries[@]}" >> "$temp_file"
                tech_entries_added=true
            fi
            echo "$line" >> "$temp_file"
            in_tech_section=false
            continue
        elif [[ $in_tech_section == true ]] && [[ -z "$line" ]]; then
            # Add new tech entries before empty line in tech section
            if [[ $tech_entries_added == false ]] && [[ ${#new_tech_entries[@]} -gt 0 ]]; then
                printf '%s\n' "${new_tech_entries[@]}" >> "$temp_file"
                tech_entries_added=true
            fi
            echo "$line" >> "$temp_file"
            continue
        fi
        
        # Handle Recent Changes section
        if [[ "$line" == "## Recent Changes" ]]; then
            echo "$line" >> "$temp_file"
            # Add new change entry right after the heading
            if [[ -n "$new_change_entry" ]]; then
                echo "$new_change_entry" >> "$temp_file"
            fi
            in_changes_section=true
            changes_entries_added=true
            continue
        elif [[ $in_changes_section == true ]] && [[ "$line" =~ ^##[[:space:]] ]]; then
            echo "$line" >> "$temp_file"
            in_changes_section=false
            continue
        elif [[ $in_changes_section == true ]] && [[ "$line" == "- "* ]]; then
            # Keep only first 2 existing changes
            if [[ $existing_changes_count -lt 2 ]]; then
                echo "$line" >> "$temp_file"
                ((existing_changes_count++))
            fi
            continue
        fi
        
        # Update timestamp
        if [[ "$line" =~ \*\*Last\ updated\*\*:.*[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] ]]; then
            echo "$line" | sed "s/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/$current_date/" >> "$temp_file"
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$target_file"
    
    # Post-loop check: if we're still in the Active Technologies section and haven't added new entries
    if [[ $in_tech_section == true ]] && [[ $tech_entries_added == false ]] && [[ ${#new_tech_entries[@]} -gt 0 ]]; then
        printf '%s\n' "${new_tech_entries[@]}" >> "$temp_file"
        tech_entries_added=true
    fi
    
    # If sections don't exist, add them at the end of the file
    if [[ $has_active_technologies -eq 0 ]] && [[ ${#new_tech_entries[@]} -gt 0 ]]; then
        echo "" >> "$temp_file"
        echo "## Active Technologies" >> "$temp_file"
        printf '%s\n' "${new_tech_entries[@]}" >> "$temp_file"
        tech_entries_added=true
    fi
    
    if [[ $has_recent_changes -eq 0 ]] && [[ -n "$new_change_entry" ]]; then
        echo "" >> "$temp_file"
        echo "## Recent Changes" >> "$temp_file"
        echo "$new_change_entry" >> "$temp_file"
        changes_entries_added=true
    fi
    
    # Move temp file to target atomically
    if ! mv "$temp_file" "$target_file"; then
        log_error "Failed to update target file"
        rm -f "$temp_file"
        return 1
    fi
    
    return 0
}
#==============================================================================
# Main Agent File Update Function
#==============================================================================

update_agent_file() {
    local target_file="$1"
    local agent_name="$2"
    
    if [[ -z "$target_file" ]] || [[ -z "$agent_name" ]]; then
        log_error "update_agent_file requires target_file and agent_name parameters"
        return 1
    fi
    
    log_info "Updating $agent_name context file: $target_file"
    
    local project_name
    project_name=$(basename "$REPO_ROOT")
    local current_date
    current_date=$(date +%Y-%m-%d)
    
    # Create directory if it doesn't exist
    local target_dir
    target_dir=$(dirname "$target_file")
    if [[ ! -d "$target_dir" ]]; then
        if ! mkdir -p "$target_dir"; then
            log_error "Failed to create directory: $target_dir"
            return 1
        fi
    fi
    
    if [[ ! -f "$target_file" ]]; then
        # Create new file from template
        local temp_file
        temp_file=$(mktemp) || {
            log_error "Failed to create temporary file"
            return 1
        }
        
        if create_new_agent_file "$target_file" "$temp_file" "$project_name" "$current_date"; then
            if mv "$temp_file" "$target_file"; then
                log_success "Created new $agent_name context file"
            else
                log_error "Failed to move temporary file to $target_file"
                rm -f "$temp_file"
                return 1
            fi
        else
            log_error "Failed to create new agent file"
            rm -f "$temp_file"
            return 1
        fi
    else
        # Update existing file
        if [[ ! -r "$target_file" ]]; then
            log_error "Cannot read existing file: $target_file"
            return 1
        fi
        
        if [[ ! -w "$target_file" ]]; then
            log_error "Cannot write to existing file: $target_file"
            return 1
        fi
        
        if update_existing_agent_file "$target_file" "$current_date"; then
            log_success "Updated existing $agent_name context file"
        else
            log_error "Failed to update existing agent file"
            return 1
        fi
    fi
    
    return 0
}

#==============================================================================
# Agent Selection and Processing
#==============================================================================

update_specific_agent() {
    local agent_type="$1"
    
    case "$agent_type" in
        claude)
            update_agent_file "$CLAUDE_FILE" "Claude Code"
            ;;
        gemini)
            update_agent_file "$GEMINI_FILE" "Gemini CLI"
            ;;
        copilot)
            update_agent_file "$COPILOT_FILE" "GitHub Copilot"
            ;;
        cursor-agent)
            update_agent_file "$CURSOR_FILE" "Cursor IDE"
            ;;
        qwen)
            update_agent_file "$QWEN_FILE" "Qwen Code"
            ;;
        opencode)
            update_agent_file "$AGENTS_FILE" "opencode"
            ;;
        codex)
            update_agent_file "$AGENTS_FILE" "Codex CLI"
            ;;
        windsurf)
            update_agent_file "$WINDSURF_FILE" "Windsurf"
            ;;
        kilocode)
            update_agent_file "$KILOCODE_FILE" "Kilo Code"
            ;;
        auggie)
            update_agent_file "$AUGGIE_FILE" "Auggie CLI"
            ;;
        roo)
            update_agent_file "$ROO_FILE" "Roo Code"
            ;;
        codebuddy)
            update_agent_file "$CODEBUDDY_FILE" "CodeBuddy CLI"
            ;;
        amp)
            update_agent_file "$AMP_FILE" "Amp"
            ;;
        shai)
            update_agent_file "$SHAI_FILE" "SHAI"
            ;;
        q)
            update_agent_file "$Q_FILE" "Amazon Q Developer CLI"
            ;;
        *)
            log_error "Unknown agent type '$agent_type'"
            log_error "Expected: claude|gemini|copilot|cursor-agent|qwen|opencode|codex|windsurf|kilocode|auggie|roo|amp|shai|q"
            exit 1
            ;;
    esac
}

update_all_existing_agents() {
    local found_agent=false
    
    # Check each possible agent file and update if it exists
    if [[ -f "$CLAUDE_FILE" ]]; then
        update_agent_file "$CLAUDE_FILE" "Claude Code"
        found_agent=true
    fi
    
    if [[ -f "$GEMINI_FILE" ]]; then
        update_agent_file "$GEMINI_FILE" "Gemini CLI"
        found_agent=true
    fi
    
    if [[ -f "$COPILOT_FILE" ]]; then
        update_agent_file "$COPILOT_FILE" "GitHub Copilot"
        found_agent=true
    fi
    
    if [[ -f "$CURSOR_FILE" ]]; then
        update_agent_file "$CURSOR_FILE" "Cursor IDE"
        found_agent=true
    fi
    
    if [[ -f "$QWEN_FILE" ]]; then
        update_agent_file "$QWEN_FILE" "Qwen Code"
        found_agent=true
    fi
    
    if [[ -f "$AGENTS_FILE" ]]; then
        update_agent_file "$AGENTS_FILE" "Codex/opencode"
        found_agent=true
    fi
    
    if [[ -f "$WINDSURF_FILE" ]]; then
        update_agent_file "$WINDSURF_FILE" "Windsurf"
        found_agent=true
    fi
    
    if [[ -f "$KILOCODE_FILE" ]]; then
        update_agent_file "$KILOCODE_FILE" "Kilo Code"
        found_agent=true
    fi

    if [[ -f "$AUGGIE_FILE" ]]; then
        update_agent_file "$AUGGIE_FILE" "Auggie CLI"
        found_agent=true
    fi
    
    if [[ -f "$ROO_FILE" ]]; then
        update_agent_file "$ROO_FILE" "Roo Code"
        found_agent=true
    fi

    if [[ -f "$CODEBUDDY_FILE" ]]; then
        update_agent_file "$CODEBUDDY_FILE" "CodeBuddy CLI"
        found_agent=true
    fi

    if [[ -f "$SHAI_FILE" ]]; then
        update_agent_file "$SHAI_FILE" "SHAI"
        found_agent=true
    fi

    if [[ -f "$Q_FILE" ]]; then
        update_agent_file "$Q_FILE" "Amazon Q Developer CLI"
        found_agent=true
    fi
    
    # If no agent files exist, create a default Claude file
    if [[ "$found_agent" == false ]]; then
        log_info "No existing agent files found, creating default Claude file..."
        update_agent_file "$CLAUDE_FILE" "Claude Code"
    fi
}
print_summary() {
    echo
    log_info "Summary of changes:"
    
    if [[ -n "$NEW_LANG" ]]; then
        echo "  - Added language: $NEW_LANG"
    fi
    
    if [[ -n "$NEW_FRAMEWORK" ]]; then
        echo "  - Added framework: $NEW_FRAMEWORK"
    fi
    
    if [[ -n "$NEW_DB" ]] && [[ "$NEW_DB" != "N/A" ]]; then
        echo "  - Added database: $NEW_DB"
    fi
    
    echo

    log_info "Usage: $0 [claude|gemini|copilot|cursor-agent|qwen|opencode|codex|windsurf|kilocode|auggie|codebuddy|shai|q]"
}

#==============================================================================
# Main Execution
#==============================================================================

main() {
    # Validate environment before proceeding
    validate_environment
    
    log_info "=== Updating agent context files for feature $CURRENT_BRANCH ==="
    
    # Parse the plan file to extract project information
    if ! parse_plan_data "$NEW_PLAN"; then
        log_error "Failed to parse plan data"
        exit 1
    fi
    
    # Process based on agent type argument
    local success=true
    
    if [[ -z "$AGENT_TYPE" ]]; then
        # No specific agent provided - update all existing agent files
        log_info "No agent specified, updating all existing agent files..."
        if ! update_all_existing_agents; then
            success=false
        fi
    else
        # Specific agent provided - update only that agent
        log_info "Updating specific agent: $AGENT_TYPE"
        if ! update_specific_agent "$AGENT_TYPE"; then
            success=false
        fi
    fi
    
    # Print summary
    print_summary
    
    if [[ "$success" == true ]]; then
        log_success "Agent context update completed successfully"
        exit 0
    else
        log_error "Agent context update completed with errors"
        exit 1
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
````

## File: .specify/templates/agent-file-template.md
````markdown
# [PROJECT NAME] Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies

[EXTRACTED FROM ALL PLAN.MD FILES]

## Project Structure

```text
[ACTUAL STRUCTURE FROM PLANS]
```

## Commands

[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

## Code Style

[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

## Recent Changes

[LAST 3 FEATURES AND WHAT THEY ADDED]

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
````

## File: .specify/templates/checklist-template.md
````markdown
# [CHECKLIST TYPE] Checklist: [FEATURE NAME]

**Purpose**: [Brief description of what this checklist covers]
**Created**: [DATE]
**Feature**: [Link to spec.md or relevant documentation]

**Note**: This checklist is generated by the `/speckit.checklist` command based on feature context and requirements.

<!-- 
  ============================================================================
  IMPORTANT: The checklist items below are SAMPLE ITEMS for illustration only.
  
  The /speckit.checklist command MUST replace these with actual items based on:
  - User's specific checklist request
  - Feature requirements from spec.md
  - Technical context from plan.md
  - Implementation details from tasks.md
  
  DO NOT keep these sample items in the generated checklist file.
  ============================================================================
-->

## [Category 1]

- [ ] CHK001 First checklist item with clear action
- [ ] CHK002 Second checklist item
- [ ] CHK003 Third checklist item

## [Category 2]

- [ ] CHK004 Another category item
- [ ] CHK005 Item with specific criteria
- [ ] CHK006 Final item in this category

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Link to relevant resources or documentation
- Items are numbered sequentially for easy reference
````

## File: .specify/templates/plan-template.md
````markdown
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
````

## File: .specify/templates/spec-template.md
````markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
````

## File: .specify/templates/tasks-template.md
````markdown
---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T013 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T014 [US1] Implement [Service] in src/services/[service].py (depends on T012, T013)
- [ ] T015 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T016 [US1] Add validation and error handling
- [ ] T017 [US1] Add logging for user story 1 operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
````

## File: specs/001-bigquery-browser/checklists/requirements.md
````markdown
# Specification Quality Checklist: BigQuery Browser Application

**Purpose**: Validate specification completeness and quality before proceeding to planning  
**Created**: 2025-01-27  
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Specification is complete and ready for planning phase
- All user stories are independently testable and prioritized
- Success criteria are measurable and technology-agnostic
- Edge cases and out-of-scope items are clearly defined
````

## File: specs/001-bigquery-browser/contracts/ipc-api.md
````markdown
# IPC API Contracts: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the IPC (Inter-Process Communication) API contracts between the Electron renderer process (React UI) and main process (Node.js/Electron APIs). All IPC communication uses Electron's `ipcMain` and `ipcRenderer` APIs via a preload script for security.

## IPC Channel Naming Convention

- Format: `{domain}:{action}`
- Examples: `bigquery:execute`, `connection:configure`, `queries:save`

## Preload API

The preload script exposes a controlled API surface to the renderer process:

```typescript
interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string): Promise<QueryResult>
    cancel(jobId: string): Promise<void>
  }
  
  // Connection management
  connection: {
    configure(config: ConnectionConfig): Promise<void>
    getActive(): Promise<ConnectionConfiguration | null>
    test(config: ConnectionConfig): Promise<boolean>
    disconnect(): Promise<void>
  }
  
  // Saved queries
  queries: {
    list(): Promise<SavedQuery[]>
    get(id: string): Promise<SavedQuery>
    save(query: SaveQueryInput): Promise<SavedQuery>
    update(id: string, updates: UpdateQueryInput): Promise<SavedQuery>
    delete(id: string): Promise<void>
    search(term: string): Promise<SavedQuery[]>
  }
}
```

---

## BigQuery Operations

### `bigquery:execute`

Execute a SQL query against BigQuery.

**Request**:
```typescript
{
  channel: 'bigquery:execute',
  args: [queryText: string, projectId: string]
}
```

**Response**:
```typescript
Promise<{
  columns: ColumnMetadata[]
  rows: Row[]
  totalRows: number
  rowsReturned: number
  executionTimeMs: number
  bytesProcessed?: number
  jobId: string
  hasMore: boolean
}>
```

**Errors**:
- `BIGQUERY_ERROR`: BigQuery API error (includes error message)
- `NETWORK_ERROR`: Network connectivity issue
- `AUTH_ERROR`: Authentication failure
- `TIMEOUT_ERROR`: Query execution timeout

**Example**:
```typescript
const result = await window.electronAPI.bigquery.execute(
  'SELECT * FROM `project.dataset.table` LIMIT 100',
  'my-project-id'
)
```

---

### `bigquery:cancel`

Cancel a running BigQuery query job.

**Request**:
```typescript
{
  channel: 'bigquery:cancel',
  args: [jobId: string]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `JOB_NOT_FOUND`: Job ID not found or already completed
- `CANCEL_FAILED`: Failed to cancel job

**Example**:
```typescript
await window.electronAPI.bigquery.cancel('job_1234567890')
```

---

## Connection Management

### `connection:configure`

Configure and establish connection to BigQuery.

**Request**:
```typescript
{
  channel: 'connection:configure',
  args: [config: {
    projectId: string
    authType: 'service-account' | 'application-default'
    serviceAccountKeyPath?: string
    serviceAccountKey?: string  // JSON string
  }]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `INVALID_PROJECT_ID`: Project ID format invalid
- `INVALID_CREDENTIALS`: Service account key invalid or missing
- `CONNECTION_FAILED`: Failed to establish connection
- `AUTH_FAILED`: Authentication failed

**Example**:
```typescript
await window.electronAPI.connection.configure({
  projectId: 'my-project-id',
  authType: 'service-account',
  serviceAccountKeyPath: '/path/to/key.json'
})
```

---

### `connection:getActive`

Get the currently active connection configuration.

**Request**:
```typescript
{
  channel: 'connection:getActive',
  args: []
}
```

**Response**:
```typescript
Promise<ConnectionConfiguration | null>
```

**Errors**: None (returns null if no active connection)

**Example**:
```typescript
const connection = await window.electronAPI.connection.getActive()
```

---

### `connection:test`

Test a connection configuration without making it active.

**Request**:
```typescript
{
  channel: 'connection:test',
  args: [config: ConnectionConfig]
}
```

**Response**:
```typescript
Promise<boolean>  // true if connection successful
```

**Errors**: Returns false on failure (error details logged in main process)

**Example**:
```typescript
const isValid = await window.electronAPI.connection.test({
  projectId: 'test-project',
  authType: 'service-account',
  serviceAccountKeyPath: '/path/to/key.json'
})
```

---

### `connection:disconnect`

Disconnect from BigQuery and clear active connection.

**Request**:
```typescript
{
  channel: 'connection:disconnect',
  args: []
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**: None

**Example**:
```typescript
await window.electronAPI.connection.disconnect()
```

---

## Saved Queries Operations

### `queries:list`

Get all saved queries.

**Request**:
```typescript
{
  channel: 'queries:list',
  args: []
}
```

**Response**:
```typescript
Promise<SavedQuery[]>
```

**Errors**:
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const queries = await window.electronAPI.queries.list()
```

---

### `queries:get`

Get a specific saved query by ID.

**Request**:
```typescript
{
  channel: 'queries:get',
  args: [id: string]
}
```

**Response**:
```typescript
Promise<SavedQuery>
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const query = await window.electronAPI.queries.get('query-uuid')
```

---

### `queries:save`

Save a new query.

**Request**:
```typescript
{
  channel: 'queries:save',
  args: [query: {
    name: string
    sqlText: string
    description?: string
    tags?: string[]
  }]
}
```

**Response**:
```typescript
Promise<SavedQuery>  // Includes generated id, createdAt, updatedAt
```

**Errors**:
- `INVALID_NAME`: Name is empty or invalid
- `DUPLICATE_NAME`: Query with same name already exists
- `STORAGE_ERROR`: Failed to write to storage

**Example**:
```typescript
const saved = await window.electronAPI.queries.save({
  name: 'My Query',
  sqlText: 'SELECT * FROM table',
  description: 'Description here',
  tags: ['analytics', 'daily']
})
```

---

### `queries:update`

Update an existing saved query.

**Request**:
```typescript
{
  channel: 'queries:update',
  args: [id: string, updates: {
    name?: string
    sqlText?: string
    description?: string
    tags?: string[]
  }]
}
```

**Response**:
```typescript
Promise<SavedQuery>  // Updated query with new updatedAt
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `INVALID_NAME`: Name is empty or invalid (if provided)
- `DUPLICATE_NAME`: Another query with same name exists (if name changed)
- `STORAGE_ERROR`: Failed to write to storage

**Example**:
```typescript
const updated = await window.electronAPI.queries.update('query-uuid', {
  name: 'Updated Name',
  description: 'New description'
})
```

---

### `queries:delete`

Delete a saved query.

**Request**:
```typescript
{
  channel: 'queries:delete',
  args: [id: string]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `STORAGE_ERROR`: Failed to delete from storage

**Example**:
```typescript
await window.electronAPI.queries.delete('query-uuid')
```

---

### `queries:search`

Search saved queries by name or SQL text.

**Request**:
```typescript
{
  channel: 'queries:search',
  args: [term: string]
}
```

**Response**:
```typescript
Promise<SavedQuery[]>  // Filtered queries matching search term
```

**Errors**:
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const results = await window.electronAPI.queries.search('analytics')
```

---

## Type Definitions

### ConnectionConfig
```typescript
interface ConnectionConfig {
  projectId: string
  authType: 'service-account' | 'application-default'
  serviceAccountKeyPath?: string
  serviceAccountKey?: string  // JSON string content
}
```

### ConnectionConfiguration
```typescript
interface ConnectionConfiguration {
  projectId: string
  authType: 'service-account' | 'application-default'
  serviceAccountKeyPath?: string
  lastConnected?: string  // ISO timestamp
  isActive: boolean
}
```

### SavedQuery
```typescript
interface SavedQuery {
  id: string
  name: string
  sqlText: string
  description?: string
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
  tags?: string[]
}
```

### SaveQueryInput
```typescript
interface SaveQueryInput {
  name: string
  sqlText: string
  description?: string
  tags?: string[]
}
```

### UpdateQueryInput
```typescript
interface UpdateQueryInput {
  name?: string
  sqlText?: string
  description?: string
  tags?: string[]
}
```

### QueryResult
```typescript
interface QueryResult {
  columns: ColumnMetadata[]
  rows: Row[]
  totalRows: number
  rowsReturned: number
  executionTimeMs: number
  bytesProcessed?: number
  jobId: string
  hasMore: boolean
}
```

### ColumnMetadata
```typescript
interface ColumnMetadata {
  name: string
  type: string  // BigQuery type: STRING, INTEGER, FLOAT, etc.
  mode?: string  // NULLABLE, REQUIRED, REPEATED
}
```

### Row
```typescript
interface Row {
  values: any[]  // Values matching column order
}
```

---

## Error Handling

All IPC methods return promises that reject with structured error objects:

```typescript
interface IPCError {
  code: string  // Error code (e.g., 'BIGQUERY_ERROR', 'QUERY_NOT_FOUND')
  message: string  // Human-readable error message
  details?: any  // Additional error details
}
```

**Error Codes**:
- `BIGQUERY_ERROR`: BigQuery API error
- `NETWORK_ERROR`: Network connectivity issue
- `AUTH_ERROR`: Authentication failure
- `TIMEOUT_ERROR`: Operation timeout
- `INVALID_PROJECT_ID`: Invalid project ID format
- `INVALID_CREDENTIALS`: Invalid credentials
- `CONNECTION_FAILED`: Connection establishment failed
- `JOB_NOT_FOUND`: BigQuery job not found
- `CANCEL_FAILED`: Failed to cancel job
- `QUERY_NOT_FOUND`: Saved query not found
- `INVALID_NAME`: Invalid query name
- `DUPLICATE_NAME`: Duplicate query name
- `STORAGE_ERROR`: Storage operation failed

---

## Implementation Notes

### Main Process Handlers

IPC handlers should be registered in the main process:

```typescript
// src/main/ipc/bigquery.ts
ipcMain.handle('bigquery:execute', async (event, queryText, projectId) => {
  // Implementation
})

ipcMain.handle('bigquery:cancel', async (event, jobId) => {
  // Implementation
})
```

### Preload Script

Preload script exposes safe API to renderer:

```typescript
// src/main/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string) => 
      ipcRenderer.invoke('bigquery:execute', queryText, projectId),
    cancel: (jobId: string) => 
      ipcRenderer.invoke('bigquery:cancel', jobId)
  },
  // ... other APIs
})
```

### Renderer Usage

Renderer uses exposed API:

```typescript
// src/renderer/hooks/useBigQuery.ts
const executeQuery = async (queryText: string) => {
  const connection = await window.electronAPI.connection.getActive()
  if (!connection) throw new Error('No active connection')
  
  return await window.electronAPI.bigquery.execute(queryText, connection.projectId)
}
```

---

## Testing Contracts

### Unit Tests
- Test IPC handlers with mocked BigQuery client
- Test error handling and validation
- Test data transformation (BigQuery response → QueryResult)

### Integration Tests
- Test end-to-end IPC communication
- Test with real BigQuery (test project)
- Test error scenarios (network failures, auth failures)

### Contract Tests
- Verify IPC channel names match
- Verify request/response types match
- Verify error codes are consistent
````

## File: specs/001-bigquery-browser/data-model.md
````markdown
# Data Model: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design & Contracts

## Entities

### ConnectionConfiguration

Represents GCP project connection settings and authentication credentials.

**Fields**:
- `projectId` (string, required): GCP project ID
- `authType` (enum: 'service-account' | 'application-default', required): Authentication method
- `serviceAccountKeyPath` (string, optional): Path to service account JSON file (if authType is 'service-account')
- `serviceAccountKey` (string, optional): Service account key JSON content (encrypted in storage)
- `lastConnected` (timestamp, optional): Last successful connection timestamp
- `isActive` (boolean): Whether this connection is currently active

**Validation Rules**:
- `projectId` must be non-empty and match GCP project ID format
- If `authType` is 'service-account', either `serviceAccountKeyPath` or `serviceAccountKey` must be provided
- `serviceAccountKey` must be valid JSON if provided

**Storage**: Encrypted using Electron safeStorage API, stored in main process only

**Relationships**: None (single active connection at a time)

---

### QueryTab

Represents an individual query workspace tab with its own editor and results.

**Fields**:
- `id` (string, required): Unique tab identifier (UUID)
- `title` (string, required): Tab display title (defaults to "Query N" or query name if saved)
- `queryText` (string, required): SQL query text
- `isModified` (boolean): Whether query has been modified since last save/load
- `executionStatus` (enum: 'idle' | 'running' | 'completed' | 'error' | 'cancelled'): Current execution state
- `jobId` (string, optional): BigQuery job ID for cancellation
- `results` (QueryResult, optional): Query execution results
- `error` (string, optional): Error message if execution failed
- `lastExecuted` (timestamp, optional): Last execution timestamp
- `savedQueryId` (string, optional): Reference to SavedQuery if loaded from saved query

**Validation Rules**:
- `id` must be unique across all tabs
- `queryText` must be non-empty string
- `executionStatus` transitions: idle → running → (completed | error | cancelled)

**Storage**: In-memory only (renderer process state)

**Relationships**: 
- May reference one `SavedQuery` (via `savedQueryId`)

---

### SavedQuery

Represents a query that has been saved locally for reuse.

**Fields**:
- `id` (string, required): Unique identifier (UUID)
- `name` (string, required): User-defined query name
- `sqlText` (string, required): SQL query text
- `description` (string, optional): Optional description/notes
- `createdAt` (timestamp, required): Creation timestamp
- `updatedAt` (timestamp, required): Last modification timestamp
- `tags` (string[], optional): Optional tags for organization

**Validation Rules**:
- `name` must be non-empty, max 255 characters
- `name` must be unique (enforced at storage level)
- `sqlText` must be non-empty
- `createdAt` <= `updatedAt`

**Storage**: JSON file via electron-store in app user data directory

**Relationships**: None (standalone entity)

**File Format**:
```json
{
  "queries": [
    {
      "id": "uuid",
      "name": "Query Name",
      "sqlText": "SELECT * FROM ...",
      "description": "Optional description",
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

---

### QueryResult

Represents the data returned from executing a query.

**Fields**:
- `columns` (ColumnMetadata[], required): Column definitions
- `rows` (Row[], required): Data rows (may be paginated)
- `totalRows` (number, required): Total number of rows returned
- `rowsReturned` (number, required): Number of rows in current result set
- `executionTimeMs` (number, required): Query execution time in milliseconds
- `bytesProcessed` (number, optional): Bytes processed by query
- `jobId` (string, required): BigQuery job ID
- `hasMore` (boolean): Whether more rows are available (pagination)

**Validation Rules**:
- `columns.length` must match `rows[0].length` (if rows exist)
- `rowsReturned` <= `totalRows`
- `executionTimeMs` >= 0

**Storage**: In-memory only (renderer process state)

**Relationships**: 
- Belongs to one `QueryTab`

---

### ColumnMetadata

Represents metadata for a result column.

**Fields**:
- `name` (string, required): Column name
- `type` (string, required): BigQuery data type (STRING, INTEGER, FLOAT, BOOLEAN, TIMESTAMP, DATE, etc.)
- `mode` (string, optional): Column mode (NULLABLE, REQUIRED, REPEATED)

**Validation Rules**:
- `name` must be non-empty

---

### Row

Represents a single row of query results.

**Fields**:
- `values` (any[], required): Cell values matching column order

**Validation Rules**:
- `values.length` must match parent QueryResult's `columns.length`

---

## State Management

### Connection Store (Zustand)

Manages active connection state.

**State**:
- `connection`: ConnectionConfiguration | null
- `isConnecting`: boolean
- `connectionError`: string | null

**Actions**:
- `setConnection(config: ConnectionConfiguration)`
- `clearConnection()`
- `setConnecting(isConnecting: boolean)`
- `setConnectionError(error: string | null)`

---

### Tabs Store (Zustand)

Manages query tabs state.

**State**:
- `tabs`: QueryTab[]
- `activeTabId`: string | null

**Actions**:
- `createTab(): string` (returns new tab ID)
- `closeTab(tabId: string)`
- `setActiveTab(tabId: string)`
- `updateTab(tabId: string, updates: Partial<QueryTab>)`
- `setTabQuery(tabId: string, queryText: string)`
- `setTabResults(tabId: string, results: QueryResult)`
- `setTabError(tabId: string, error: string)`
- `setTabStatus(tabId: string, status: QueryTab['executionStatus'])`

---

### Saved Queries Store (Zustand)

Manages saved queries state.

**State**:
- `queries`: SavedQuery[]
- `isLoading`: boolean
- `searchTerm`: string

**Actions**:
- `loadQueries()`: Promise<void>
- `saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
- `updateQuery(id: string, updates: Partial<SavedQuery>): Promise<void>`
- `deleteQuery(id: string): Promise<void>`
- `setSearchTerm(term: string)`
- `getFilteredQueries(): SavedQuery[]` (computed based on searchTerm)

---

## Data Flow

### Query Execution Flow

1. User types query in QueryTab
2. User clicks "Execute" button
3. Renderer calls IPC: `bigquery:execute(queryText, projectId)`
4. Main process creates BigQuery job
5. Main process streams results back via IPC
6. Renderer updates QueryTab with results
7. QueryTab state updated: executionStatus = 'completed', results set

### Save Query Flow

1. User clicks "Save Query" in QueryTab
2. User provides name (and optional description)
3. Renderer calls IPC: `queries:save({ name, sqlText, description })`
4. Main process generates ID, timestamps, saves to electron-store
5. Main process returns SavedQuery via IPC
6. Renderer updates SavedQueries store
7. QueryTab updated with savedQueryId

### Load Query Flow

1. User selects saved query from list
2. Renderer calls IPC: `queries:load(id)`
3. Main process loads SavedQuery from electron-store
4. Main process returns SavedQuery via IPC
5. Renderer creates new QueryTab or updates active tab with query text
6. QueryTab updated with savedQueryId reference

---

## Validation Rules Summary

### ConnectionConfiguration
- Project ID: Non-empty, valid GCP format
- Auth: Service account key must be valid JSON if provided

### QueryTab
- Query text: Non-empty
- Status transitions: Valid state machine

### SavedQuery
- Name: Non-empty, max 255 chars, unique
- SQL: Non-empty

### QueryResult
- Column/row consistency: Columns match row structure
- Pagination: rowsReturned <= totalRows

---

## Storage Locations

### Main Process (Node.js)
- **Connection credentials**: Electron safeStorage API (encrypted)
- **Saved queries**: `electron-store` → `app.getPath('userData')/queries.json`

### Renderer Process (React)
- **Tabs state**: Zustand store (in-memory)
- **Connection state**: Zustand store (in-memory)
- **Saved queries cache**: Zustand store (loaded from main process)

---

## Migration Considerations

### Future Schema Changes
- Version field in saved queries JSON for migration support
- Backward compatibility: Handle missing optional fields gracefully
- Export/import functionality for user data portability
````

## File: specs/001-bigquery-browser/plan.md
````markdown
# Implementation Plan: BigQuery Browser Application

**Branch**: `001-bigquery-browser` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-bigquery-browser/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a desktop application using Electron that enables users to connect to Google Cloud Platform BigQuery, execute SQL queries in multiple tabs, and save queries locally for reuse. The application will use React for the UI layer, Node.js for BigQuery integration, and local JSON file storage for query persistence.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: Electron 28+, React 18+, @google-cloud/bigquery, electron-store  
**Storage**: Local JSON files (via electron-store) for saved queries, in-memory state for active tabs  
**Testing**: Jest, React Testing Library, Electron Test Utils  
**Target Platform**: Desktop (Windows, macOS, Linux)  
**Project Type**: Desktop application (Electron)  
**Performance Goals**: 
- Query execution: <5s for queries returning up to 1000 rows
- Tab switching: <100ms response time
- Application startup: <3s to ready state
- Support up to 10 concurrent tabs without degradation
**Constraints**: 
- Must work offline for saved queries (no network required for query management)
- Credentials stored securely using Electron's safeStorage API
- Memory efficient: handle result sets up to 100,000 rows
- Cross-platform compatibility (Windows, macOS, Linux)
**Scale/Scope**: 
- Single-user desktop application
- Local file storage (no cloud sync)
- Support for multiple GCP projects (one active at a time)
- Estimated 5,000-10,000 lines of code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASSED

The constitution file is a template without specific constraints. No violations detected. The project follows standard Electron application patterns with clear separation of concerns between main process (Node.js) and renderer process (React).

## Project Structure

### Documentation (this feature)

```text
specs/001-bigquery-browser/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main/                    # Electron main process
│   ├── main.ts             # Entry point, window management
│   ├── preload.ts          # Preload script for IPC bridge
│   ├── ipc/                # IPC handlers
│   │   ├── bigquery.ts     # BigQuery query execution handlers
│   │   ├── connection.ts   # Connection management handlers
│   │   └── queries.ts      # Saved query CRUD handlers
│   └── storage/            # Local storage management
│       └── query-store.ts  # Query persistence using electron-store
├── renderer/               # React renderer process
│   ├── components/         # React components
│   │   ├── QueryEditor/    # SQL editor component
│   │   ├── QueryResults/   # Results table component
│   │   ├── TabBar/         # Tab management component
│   │   ├── ConnectionDialog/ # Connection configuration dialog
│   │   └── SavedQueries/   # Saved queries list/management
│   ├── hooks/              # React hooks
│   │   ├── useBigQuery.ts  # BigQuery operations hook
│   │   ├── useTabs.ts      # Tab management hook
│   │   └── useSavedQueries.ts # Saved queries hook
│   ├── stores/             # State management (Zustand/Context)
│   │   ├── connection-store.ts
│   │   ├── tabs-store.ts
│   │   └── queries-store.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── bigquery.ts
│   │   ├── connection.ts
│   │   └── query.ts
│   └── App.tsx             # Root component
├── shared/                 # Shared types/utilities
│   ├── types/
│   └── utils/
└── assets/                 # Static assets

tests/
├── unit/                   # Unit tests
│   ├── main/
│   └── renderer/
├── integration/            # Integration tests
│   └── bigquery.test.ts
└── e2e/                    # End-to-end tests
    └── app.test.ts
```

**Structure Decision**: Single Electron application with clear separation between main process (Node.js/Electron APIs) and renderer process (React UI). IPC communication bridges the two processes. Local storage handled in main process for security, UI state managed in renderer process.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected.
````

## File: specs/001-bigquery-browser/quickstart.md
````markdown
# Quickstart Guide: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design & Contracts

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account with BigQuery API enabled
- GCP project with BigQuery access
- Service account key file (JSON) OR Application Default Credentials configured

## Project Setup

### 1. Initialize Project

```bash
# Create project directory
mkdir bq-browser
cd bq-browser

# Initialize npm project
npm init -y

# Install Electron and dependencies
npm install electron react react-dom typescript @types/react @types/node
npm install @google-cloud/bigquery electron-store zustand
npm install @monaco-editor/react react-window

# Install dev dependencies
npm install --save-dev @types/react @types/node jest @testing-library/react
npm install --save-dev electron-builder electron-forge
```

### 2. Project Structure

Create the following directory structure:

```
bq-browser/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   ├── ipc/
│   │   └── storage/
│   ├── renderer/       # React renderer process
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── App.tsx
│   └── shared/         # Shared types/utilities
├── tests/
├── package.json
└── tsconfig.json
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4. Configure Electron

Update `package.json`:

```json
{
  "main": "dist/main/main.js",
  "scripts": {
    "build": "tsc",
    "start": "npm run build && electron .",
    "dev": "electron-forge start",
    "package": "electron-builder",
    "test": "jest"
  }
}
```

## Core Implementation Steps

### Step 1: Main Process Entry Point

Create `src/main/main.ts`:

```typescript
import { app, BrowserWindow } from 'electron'
import * as path from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(createWindow)
```

### Step 2: Preload Script

Create `src/main/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string) =>
      ipcRenderer.invoke('bigquery:execute', queryText, projectId),
    cancel: (jobId: string) =>
      ipcRenderer.invoke('bigquery:cancel', jobId)
  },
  connection: {
    configure: (config: any) =>
      ipcRenderer.invoke('connection:configure', config),
    getActive: () =>
      ipcRenderer.invoke('connection:getActive'),
    test: (config: any) =>
      ipcRenderer.invoke('connection:test', config),
    disconnect: () =>
      ipcRenderer.invoke('connection:disconnect')
  },
  queries: {
    list: () => ipcRenderer.invoke('queries:list'),
    get: (id: string) => ipcRenderer.invoke('queries:get', id),
    save: (query: any) => ipcRenderer.invoke('queries:save', query),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('queries:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('queries:delete', id),
    search: (term: string) => ipcRenderer.invoke('queries:search', term)
  }
})
```

### Step 3: IPC Handlers

Create `src/main/ipc/bigquery.ts`:

```typescript
import { ipcMain } from 'electron'
import { BigQuery } from '@google-cloud/bigquery'

let bigqueryClient: BigQuery | null = null

ipcMain.handle('bigquery:execute', async (event, queryText: string, projectId: string) => {
  if (!bigqueryClient) {
    bigqueryClient = new BigQuery({ projectId })
  }

  const [job] = await bigqueryClient.createQueryJob({ query: queryText })
  const [rows] = await job.getQueryResults()
  
  // Transform to QueryResult format
  return {
    columns: job.metadata.schema.fields.map(f => ({
      name: f.name,
      type: f.type,
      mode: f.mode
    })),
    rows: rows.map(row => ({ values: Object.values(row) })),
    totalRows: parseInt(job.metadata.statistics.totalRowsProcessed || '0'),
    rowsReturned: rows.length,
    executionTimeMs: parseInt(job.metadata.statistics.totalSlotMs || '0'),
    jobId: job.id,
    hasMore: false
  }
})
```

### Step 4: React App Structure

Create `src/renderer/App.tsx`:

```typescript
import React from 'react'
import { QueryEditor } from './components/QueryEditor'
import { QueryResults } from './components/QueryResults'
import { TabBar } from './components/TabBar'

export function App() {
  return (
    <div className="app">
      <TabBar />
      <div className="main-content">
        <QueryEditor />
        <QueryResults />
      </div>
    </div>
  )
}
```

### Step 5: Connection Configuration

Create connection dialog component to collect:
- Project ID
- Authentication method (service account or application default)
- Service account key file path (if applicable)

### Step 6: Query Execution

Implement query execution flow:
1. User enters SQL in Monaco Editor
2. User clicks "Execute"
3. Renderer calls IPC `bigquery:execute`
4. Main process executes query via BigQuery client
5. Results displayed in table component

### Step 7: Tab Management

Implement tab state management:
- Create new tab button
- Tab switching
- Tab closing with unsaved changes warning
- Tab state persistence (in-memory)

### Step 8: Saved Queries

Implement saved queries storage:
- Save query dialog (name, description, tags)
- Load saved queries list
- Load query into tab
- Update/delete saved queries

## Development Workflow

### Running in Development

```bash
# Build TypeScript
npm run build

# Start Electron app
npm start

# Or use Electron Forge for hot reload
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### Building for Production

```bash
# Package for current platform
npm run package

# Build for all platforms
npm run package -- --mac --win --linux
```

## Key Implementation Files

### Main Process
- `src/main/main.ts`: Electron app entry point
- `src/main/preload.ts`: Preload script for IPC bridge
- `src/main/ipc/bigquery.ts`: BigQuery IPC handlers
- `src/main/ipc/connection.ts`: Connection IPC handlers
- `src/main/ipc/queries.ts`: Saved queries IPC handlers
- `src/main/storage/query-store.ts`: Query persistence

### Renderer Process
- `src/renderer/App.tsx`: Root React component
- `src/renderer/components/QueryEditor/`: SQL editor component
- `src/renderer/components/QueryResults/`: Results table component
- `src/renderer/components/TabBar/`: Tab management component
- `src/renderer/components/ConnectionDialog/`: Connection setup dialog
- `src/renderer/components/SavedQueries/`: Saved queries list component
- `src/renderer/hooks/useBigQuery.ts`: BigQuery operations hook
- `src/renderer/hooks/useTabs.ts`: Tab management hook
- `src/renderer/stores/`: Zustand stores for state management

## Next Steps

1. **Implement Core Features** (User Story 1 - P1):
   - Connection configuration UI
   - Query editor with Monaco
   - Query execution
   - Results display

2. **Add Tab Management** (User Story 2 - P2):
   - Tab bar component
   - Tab state management
   - Tab switching logic

3. **Implement Query Persistence** (User Story 3 - P3):
   - Save query dialog
   - Query storage implementation
   - Load saved queries UI

4. **Polish & Testing**:
   - Error handling
   - Loading states
   - Performance optimization
   - End-to-end testing

## Troubleshooting

### Common Issues

**BigQuery Authentication Errors**:
- Verify service account key file path is correct
- Check service account has BigQuery permissions
- Ensure project ID matches the project in key file

**IPC Communication Errors**:
- Verify preload script is loaded correctly
- Check contextIsolation is enabled
- Ensure IPC channel names match between main and renderer

**TypeScript Compilation Errors**:
- Run `npm run build` to check for type errors
- Ensure all type definitions are imported correctly
- Check tsconfig.json includes all necessary files

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [BigQuery Node.js Client](https://cloud.google.com/nodejs/docs/reference/bigquery/latest)
- [React Documentation](https://react.dev)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
````

## File: specs/001-bigquery-browser/research.md
````markdown
# Research: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 0 - Outline & Research

## Technology Decisions

### Decision: Electron Framework

**Rationale**: 
- User requirement explicitly specifies Electron for desktop application
- Cross-platform support (Windows, macOS, Linux) out of the box
- Mature ecosystem with extensive documentation and community support
- Allows use of web technologies (React, TypeScript) for UI development
- Native Node.js integration enables direct BigQuery API access from main process

**Alternatives Considered**:
- **Tauri**: Lighter weight but less mature ecosystem, Rust requirement adds complexity
- **Native frameworks (Swift/Objective-C, C#/.NET, Qt)**: Platform-specific, requires separate codebases
- **Web application**: Doesn't meet "desktop application" requirement, local file access limitations

**Decision**: Use Electron 28+ (latest stable)

---

### Decision: React for UI Framework

**Rationale**:
- Industry standard for component-based UI development
- Excellent ecosystem for tab management, code editors, and data tables
- Strong TypeScript support
- Large community and extensive component libraries
- Works seamlessly with Electron's renderer process

**Alternatives Considered**:
- **Vue.js**: Similar capabilities but smaller ecosystem for desktop apps
- **Svelte**: Modern but less mature Electron integration patterns
- **Vanilla JS**: Too low-level, would require significant custom framework code

**Decision**: Use React 18+ with TypeScript

---

### Decision: @google-cloud/bigquery Client Library

**Rationale**:
- Official Google Cloud client library for Node.js
- Handles authentication, connection management, and query execution
- Supports both service account and user credentials
- Built-in retry logic and error handling
- Well-maintained and documented

**Alternatives Considered**:
- **REST API directly**: More work, need to handle auth/retries manually
- **Other BigQuery libraries**: Less official support, potential compatibility issues

**Decision**: Use @google-cloud/bigquery (latest version)

---

### Decision: electron-store for Local Storage

**Rationale**:
- Purpose-built for Electron applications
- Handles JSON serialization automatically
- Provides safe storage location (app user data directory)
- Simple API for CRUD operations
- Handles file locking and corruption recovery

**Alternatives Considered**:
- **Direct fs module**: More manual work, need to handle paths, locking, errors
- **SQLite**: Overkill for simple query storage, adds complexity
- **localStorage**: Renderer-only, not secure for credentials

**Decision**: Use electron-store for saved queries, Electron safeStorage API for credentials

---

### Decision: Monaco Editor for SQL Editing

**Rationale**:
- Industry-standard code editor (powers VS Code)
- Excellent SQL syntax highlighting
- Built-in features: auto-indentation, bracket matching, line numbers
- Extensible for future features (autocomplete, error highlighting)
- React integration available via @monaco-editor/react

**Alternatives Considered**:
- **CodeMirror**: Good but less feature-rich, smaller community
- **Ace Editor**: Older, less maintained
- **Plain textarea**: Insufficient for SQL editing experience

**Decision**: Use Monaco Editor (@monaco-editor/react)

---

### Decision: IPC Communication Pattern

**Rationale**:
- Electron security best practice: separate main and renderer processes
- Main process handles Node.js APIs (file system, BigQuery client)
- Renderer process handles UI (React)
- IPC bridge enables secure communication between processes
- Preload script provides controlled API surface

**Pattern**:
- Main process: Handles BigQuery operations, file storage, window management
- Renderer process: UI components, user interactions
- IPC channels: `bigquery:execute`, `bigquery:cancel`, `connection:configure`, `queries:save`, `queries:load`, etc.

**Decision**: Use Electron IPC with preload script pattern

---

### Decision: State Management - Zustand

**Rationale**:
- Lightweight state management library
- Simple API, minimal boilerplate
- Good TypeScript support
- Works well with React hooks
- Sufficient for application scope (tabs, connection state, query state)

**Alternatives Considered**:
- **Redux**: Overkill for this application size, too much boilerplate
- **Context API**: Can cause performance issues with frequent updates
- **Jotai/Recoil**: More complex, unnecessary for this use case

**Decision**: Use Zustand for global state management

---

### Decision: Testing Strategy

**Rationale**:
- **Jest**: Standard for Node.js/React testing, excellent TypeScript support
- **React Testing Library**: Best practices for React component testing
- **Electron Test Utils**: For testing Electron-specific features (IPC, windows)
- Unit tests for business logic, integration tests for BigQuery operations, E2E for user flows

**Decision**: Jest + React Testing Library + Electron Test Utils

---

## Architecture Patterns

### Main Process Responsibilities
- Window lifecycle management
- BigQuery client initialization and query execution
- IPC handlers for renderer requests
- Local file storage (saved queries)
- Credential management (secure storage)

### Renderer Process Responsibilities
- UI rendering (React components)
- User interaction handling
- State management (Zustand stores)
- IPC communication to main process

### IPC Communication Flow
1. User action in renderer (e.g., execute query)
2. Renderer calls IPC method via preload API
3. Main process receives IPC message
4. Main process executes operation (BigQuery API call)
5. Main process sends response back via IPC
6. Renderer updates UI based on response

---

## Security Considerations

### Credential Storage
- Use Electron's `safeStorage` API for encrypting credentials
- Store service account keys encrypted at rest
- Never expose credentials to renderer process
- Clear credentials from memory when not in use

### Input Validation
- Validate SQL queries before execution (basic syntax checks)
- Sanitize saved query names to prevent path traversal
- Validate project IDs and dataset names

### Network Security
- Use HTTPS for all BigQuery API calls
- Handle certificate validation properly
- Implement timeout handling for long-running queries

---

## Performance Considerations

### Query Execution
- Implement query cancellation support
- Stream large result sets (paginate results)
- Show progress indicators for long-running queries
- Cache connection state to avoid re-authentication

### UI Performance
- Virtualize large result tables (react-window or similar)
- Lazy load tabs (only render active tab)
- Debounce search/filter operations
- Optimize re-renders with React.memo where appropriate

### Memory Management
- Limit in-memory result sets (implement pagination)
- Clear old tab data when tabs are closed
- Implement result set size limits (warn user for very large results)

---

## Integration Points

### BigQuery API Integration
- Authentication: Service account JSON file or Application Default Credentials
- Query execution: `bigquery.createQueryJob()` for async execution
- Result retrieval: Stream results to handle large datasets
- Error handling: Parse BigQuery error messages for user-friendly display

### Local Storage Integration
- Saved queries: JSON files in app user data directory
- Query metadata: Name, timestamp, SQL text, optional description
- File format: Single JSON file with array of query objects
- Backup: Consider export/import functionality for user data portability

---

## Dependencies Summary

### Core Dependencies
- `electron`: ^28.0.0
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `typescript`: ^5.3.0
- `@google-cloud/bigquery`: ^7.0.0

### UI Dependencies
- `@monaco-editor/react`: ^4.6.0
- `zustand`: ^4.4.0
- `react-window`: ^1.8.10 (for virtualized tables)

### Storage Dependencies
- `electron-store`: ^10.0.0

### Development Dependencies
- `@types/react`: ^18.2.0
- `@types/node`: ^20.0.0
- `jest`: ^29.7.0
- `@testing-library/react`: ^14.1.0
- `electron-builder`: ^24.9.0 (for packaging)

---

## Open Questions Resolved

1. **Q**: How to handle multiple GCP projects?  
   **A**: Support one active connection at a time. Users can switch projects by reconfiguring connection.

2. **Q**: How to handle very large result sets?  
   **A**: Implement pagination/virtualization. Show first N rows, allow user to load more or export.

3. **Q**: Should queries auto-save?  
   **A**: No auto-save for unsaved queries (out of scope). Users explicitly save queries they want to persist.

4. **Q**: How to handle query cancellation?  
   **A**: Use BigQuery job cancellation API. Store job IDs and allow cancellation via IPC.

5. **Q**: Should we support query history?  
   **A**: No, only saved queries are persisted (per spec - query history is out of scope).

---

## Next Steps

Phase 1 will focus on:
1. Detailed data model design
2. IPC API contracts
3. Component architecture
4. Quickstart guide
````

## File: specs/001-bigquery-browser/spec.md
````markdown
# Feature Specification: BigQuery Browser Application

**Feature Branch**: `001-bigquery-browser`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "We want to build a app that can browse big query in gcp, have multiple tabs and save queries locally"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect and Execute Queries (Priority: P1)

A user needs to connect to their BigQuery instance in GCP and execute SQL queries to retrieve and analyze data. This is the core functionality that enables all other features.

**Why this priority**: Without the ability to connect and execute queries, the application provides no value. This is the foundational capability that all other features depend on.

**Independent Test**: Can be fully tested by connecting to a BigQuery project, executing a simple SELECT query, and verifying that results are displayed correctly. This delivers immediate value as users can query their data.

**Acceptance Scenarios**:

1. **Given** a user has valid GCP credentials, **When** they configure the connection with project ID and credentials, **Then** the system establishes a connection to BigQuery and displays available datasets
2. **Given** a user is connected to BigQuery, **When** they write and execute a SQL query, **Then** the system executes the query and displays results in a tabular format
3. **Given** a user executes a query, **When** the query returns results, **Then** the system displays column headers and data rows with appropriate formatting
4. **Given** a user executes a query with errors, **When** the query fails, **Then** the system displays a clear error message explaining what went wrong
5. **Given** a user executes a long-running query, **When** the query takes time to complete, **Then** the system shows progress indication and allows cancellation

---

### User Story 2 - Multiple Tabs for Concurrent Queries (Priority: P2)

A user needs to work with multiple queries simultaneously, switching between different queries and their results without losing context.

**Why this priority**: Users frequently need to compare results, work on multiple related queries, or maintain separate query contexts. This significantly improves productivity and workflow efficiency.

**Independent Test**: Can be fully tested by opening multiple tabs, executing different queries in each tab, and verifying that each tab maintains its own query state and results independently. This delivers value by enabling parallel query work.

**Acceptance Scenarios**:

1. **Given** a user has an active query tab, **When** they create a new tab, **Then** the system opens a new empty query editor tab
2. **Given** a user has multiple tabs with different queries, **When** they switch between tabs, **Then** the system displays the correct query and results for each tab
3. **Given** a user has multiple tabs, **When** they execute queries in different tabs, **Then** each tab shows its own results independently
4. **Given** a user has multiple tabs, **When** they close a tab, **Then** the system removes that tab and switches to another open tab if available
5. **Given** a user has multiple tabs with unsaved queries, **When** they close a tab, **Then** the system prompts to save if the query has been modified

---

### User Story 3 - Save and Load Queries Locally (Priority: P3)

A user needs to save frequently used queries locally so they can reuse them without retyping, and organize queries for future reference.

**Why this priority**: While not essential for basic functionality, saving queries significantly improves user productivity and enables query reuse. Users can build a library of useful queries over time.

**Independent Test**: Can be fully tested by saving a query with a name, closing and reopening the application, and verifying that the saved query can be loaded and executed. This delivers value by enabling query reuse and organization.

**Acceptance Scenarios**:

1. **Given** a user has written a query in a tab, **When** they save the query with a name, **Then** the system stores the query locally with metadata (name, timestamp, SQL text)
2. **Given** a user has saved queries, **When** they open the saved queries list, **Then** the system displays all saved queries with their names and metadata
3. **Given** a user has saved queries, **When** they select a saved query, **Then** the system loads the query into the current or new tab
4. **Given** a user has a saved query, **When** they modify and save it again, **Then** the system updates the existing saved query
5. **Given** a user has saved queries, **When** they delete a saved query, **Then** the system removes it from local storage
6. **Given** a user has saved queries, **When** they search for queries by name or content, **Then** the system filters and displays matching queries

---

### Edge Cases

- What happens when a user loses internet connection while executing a query?
- How does the system handle queries that return extremely large result sets (millions of rows)?
- What happens when a user tries to save a query with a duplicate name?
- How does the system handle corrupted or invalid saved query files?
- What happens when a user's GCP credentials expire during a session?
- How does the system handle queries that take longer than expected (timeout scenarios)?
- What happens when a user tries to open more tabs than the system can reasonably handle?
- How does the system handle special characters or SQL injection attempts in saved query names?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to configure connection to BigQuery using GCP credentials
- **FR-002**: System MUST authenticate users with GCP using standard authentication methods (service account or user credentials)
- **FR-003**: System MUST provide a query editor interface where users can write and edit SQL queries
- **FR-004**: System MUST execute SQL queries against BigQuery and retrieve results
- **FR-005**: System MUST display query results in a tabular format with column headers
- **FR-006**: System MUST display error messages when queries fail to execute
- **FR-007**: System MUST support multiple concurrent query tabs
- **FR-008**: System MUST allow users to create new query tabs
- **FR-009**: System MUST allow users to close query tabs
- **FR-010**: System MUST maintain independent state (query text, results) for each tab
- **FR-011**: System MUST allow users to switch between tabs without losing data
- **FR-012**: System MUST allow users to save queries locally with a user-defined name
- **FR-013**: System MUST store saved queries with metadata (name, creation/modification timestamp, SQL text)
- **FR-014**: System MUST allow users to view a list of all saved queries
- **FR-015**: System MUST allow users to load a saved query into a tab
- **FR-016**: System MUST allow users to update existing saved queries
- **FR-017**: System MUST allow users to delete saved queries
- **FR-018**: System MUST persist saved queries across application sessions
- **FR-019**: System MUST handle query execution cancellation requests
- **FR-020**: System MUST provide progress indication for long-running queries

### Key Entities *(include if feature involves data)*

- **Connection Configuration**: Represents GCP project connection settings including project ID, authentication method, and credentials. Key attributes: project ID, authentication type, credential information
- **Query Tab**: Represents an individual query workspace with its own editor and results. Key attributes: tab identifier, query text, execution status, results data, last execution timestamp
- **Saved Query**: Represents a query that has been saved for reuse. Key attributes: unique identifier, name, SQL text, creation timestamp, modification timestamp, optional description or tags
- **Query Result**: Represents the data returned from executing a query. Key attributes: column metadata, row data, total row count, execution time, query cost (if available)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can establish a connection to BigQuery and view available datasets within 30 seconds of launching the application
- **SC-002**: Users can execute a simple SELECT query and view results within 5 seconds for queries returning up to 1000 rows
- **SC-003**: Users can successfully open and work with at least 10 concurrent query tabs without performance degradation
- **SC-004**: Users can save a query and reload it in a new session with 100% accuracy (query text preserved exactly)
- **SC-005**: 95% of users can complete their first query execution within 3 minutes of first launch
- **SC-006**: System handles queries returning up to 100,000 rows without crashing or becoming unresponsive
- **SC-007**: Users can switch between tabs without any data loss or corruption
- **SC-008**: Saved queries persist correctly across application restarts for 100% of save operations

## Assumptions

- Users have valid GCP credentials (service account key file or user credentials) with appropriate BigQuery permissions
- Users have basic SQL knowledge and understand BigQuery SQL syntax
- Application runs on a single machine (local storage means files stored on the user's device)
- Users have sufficient local storage space for saved queries (queries are typically small text files)
- Network connectivity is available when executing queries (BigQuery requires internet access)
- Users may work with multiple GCP projects but typically focus on one at a time per session
- Query results are displayed in a paginated or scrollable format for large result sets
- The application supports standard BigQuery SQL features and functions

## Dependencies

- Access to Google Cloud Platform BigQuery service
- Valid GCP project with BigQuery API enabled
- User credentials or service account with BigQuery read permissions (at minimum)
- Local file system access for storing saved queries

## Out of Scope

- Query result export functionality (CSV, JSON, etc.)
- Query result visualization or charting
- Query history tracking (beyond saved queries)
- Collaborative features (sharing queries with other users)
- Query performance optimization suggestions
- Database schema browsing or auto-completion in query editor
- Query templates or snippets library
- Cloud-based query storage (queries are stored locally only)
- Multi-user authentication or user management
- Query scheduling or automation
````

## File: specs/001-bigquery-browser/tasks.md
````markdown
# Tasks: BigQuery Browser Application

**Input**: Design documents from `/specs/001-bigquery-browser/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not explicitly requested in the feature specification. Only foundational test infrastructure setup is included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Desktop application**: `src/main/`, `src/renderer/`, `src/shared/` at repository root
- Paths follow Electron application structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan in src/
- [X] T002 Initialize npm project with package.json and install core dependencies (electron, react, react-dom, typescript, @google-cloud/bigquery, electron-store, zustand, @monaco-editor/react)
- [X] T003 [P] Configure TypeScript with tsconfig.json at repository root
- [X] T004 [P] Configure Electron build and packaging scripts in package.json
- [X] T005 [P] Setup ESLint and Prettier configuration files
- [X] T006 Create basic HTML entry point at src/renderer/index.html

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create shared TypeScript type definitions in src/shared/types/connection.ts for ConnectionConfiguration and ConnectionConfig interfaces
- [X] T008 [P] Create shared TypeScript type definitions in src/shared/types/query.ts for QueryTab, SavedQuery, QueryResult, ColumnMetadata, and Row interfaces
- [X] T009 [P] Create shared TypeScript type definitions in src/shared/types/bigquery.ts for BigQuery-related types and error interfaces
- [X] T010 Create Electron main process entry point in src/main/main.ts with window creation and basic setup
- [X] T011 Create Electron preload script in src/main/preload.ts exposing electronAPI to renderer process
- [X] T012 Setup IPC handler structure in src/main/ipc/ directory with placeholder files for bigquery.ts, connection.ts, and queries.ts
- [X] T013 Create storage module structure in src/main/storage/ with query-store.ts placeholder using electron-store
- [X] T014 Setup React application structure in src/renderer/ with App.tsx root component
- [X] T015 Configure Electron context isolation and security settings in src/main/main.ts
- [X] T016 Create basic CSS/styling setup for the application

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Connect and Execute Queries (Priority: P1) 🎯 MVP

**Goal**: Enable users to connect to BigQuery and execute SQL queries with results display

**Independent Test**: Connect to a BigQuery project, execute a simple SELECT query, and verify results are displayed correctly. This delivers immediate value as users can query their data.

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement ConnectionConfiguration type validation utilities in src/shared/utils/connection-validation.ts
- [X] T018 [P] [US1] Create connection store using Zustand in src/renderer/stores/connection-store.ts with state and actions for connection management
- [X] T019 [US1] Implement IPC handler for connection:configure in src/main/ipc/connection.ts to handle BigQuery client initialization
- [X] T020 [US1] Implement IPC handler for connection:getActive in src/main/ipc/connection.ts to return active connection configuration
- [X] T021 [US1] Implement IPC handler for connection:test in src/main/ipc/connection.ts to validate connection without making it active
- [X] T022 [US1] Implement IPC handler for connection:disconnect in src/main/ipc/connection.ts to clear active connection
- [X] T023 [US1] Implement secure credential storage using Electron safeStorage API in src/main/ipc/connection.ts
- [X] T024 [P] [US1] Create ConnectionDialog component in src/renderer/components/ConnectionDialog/ConnectionDialog.tsx for connection configuration UI
- [X] T025 [US1] Implement connection form validation and error handling in src/renderer/components/ConnectionDialog/ConnectionDialog.tsx
- [X] T026 [US1] Create useBigQuery hook in src/renderer/hooks/useBigQuery.ts for executing queries via IPC
- [X] T027 [US1] Implement IPC handler for bigquery:execute in src/main/ipc/bigquery.ts to execute queries using @google-cloud/bigquery client
- [X] T028 [US1] Implement query result transformation from BigQuery response to QueryResult format in src/main/ipc/bigquery.ts
- [X] T029 [US1] Implement error handling and error code mapping in src/main/ipc/bigquery.ts for BigQuery API errors
- [X] T030 [US1] Implement IPC handler for bigquery:cancel in src/main/ipc/bigquery.ts to cancel running queries
- [X] T031 [P] [US1] Create QueryEditor component in src/renderer/components/QueryEditor/QueryEditor.tsx using Monaco Editor for SQL editing
- [X] T032 [US1] Integrate Monaco Editor with SQL syntax highlighting in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T033 [P] [US1] Create QueryResults component in src/renderer/components/QueryResults/QueryResults.tsx for displaying query results in table format
- [X] T034 [US1] Implement table rendering with column headers and row data in src/renderer/components/QueryResults/QueryResults.tsx
- [X] T035 [US1] Implement query execution flow: connect useBigQuery hook to QueryEditor execute button in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T036 [US1] Implement loading state and progress indication during query execution in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T037 [US1] Implement error message display for failed queries in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T038 [US1] Implement query cancellation UI and handler in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T039 [US1] Update App.tsx to integrate ConnectionDialog, QueryEditor, and QueryResults components
- [X] T040 [US1] Implement connection status display in UI showing active project ID

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can connect to BigQuery, execute queries, and view results.

---

## Phase 4: User Story 2 - Multiple Tabs for Concurrent Queries (Priority: P2)

**Goal**: Enable users to work with multiple queries simultaneously in separate tabs

**Independent Test**: Open multiple tabs, execute different queries in each tab, and verify each tab maintains its own query state and results independently. This delivers value by enabling parallel query work.

### Implementation for User Story 2

- [X] T041 [P] [US2] Create tabs store using Zustand in src/renderer/stores/tabs-store.ts with state and actions for tab management
- [X] T042 [US2] Implement createTab action in src/renderer/stores/tabs-store.ts to generate new tabs with unique IDs
- [X] T043 [US2] Implement closeTab action in src/renderer/stores/tabs-store.ts with logic to switch to another tab if available
- [X] T044 [US2] Implement setActiveTab action in src/renderer/stores/tabs-store.ts to switch between tabs
- [X] T045 [US2] Implement updateTab action in src/renderer/stores/tabs-store.ts to update tab properties
- [X] T046 [US2] Implement tab state management for query text, results, and execution status in src/renderer/stores/tabs-store.ts
- [X] T047 [P] [US2] Create TabBar component in src/renderer/components/TabBar/TabBar.tsx to display and manage tabs
- [X] T048 [US2] Implement tab rendering with titles and close buttons in src/renderer/components/TabBar/TabBar.tsx
- [X] T049 [US2] Implement tab switching on click in src/renderer/components/TabBar/TabBar.tsx
- [X] T050 [US2] Implement tab closing with confirmation dialog for unsaved changes in src/renderer/components/TabBar/TabBar.tsx
- [X] T051 [US2] Update QueryEditor component to work with active tab from tabs store in src/renderer/components/QueryEditor/QueryEditor.tsx
- [X] T052 [US2] Update QueryResults component to display results for active tab in src/renderer/components/QueryResults/QueryResults.tsx
- [X] T053 [US2] Implement tab state persistence: save query text and results per tab in src/renderer/stores/tabs-store.ts
- [X] T054 [US2] Implement isModified tracking for tabs to detect unsaved changes in src/renderer/stores/tabs-store.ts
- [X] T055 [US2] Update App.tsx to integrate TabBar component and manage tab-based layout
- [X] T056 [US2] Implement "New Tab" button functionality to create new query tabs
- [X] T057 [US2] Ensure each tab maintains independent query execution state and results

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create multiple tabs, switch between them, and execute queries in each tab independently.

---

## Phase 5: User Story 3 - Save and Load Queries Locally (Priority: P3)

**Goal**: Enable users to save queries locally and reload them for reuse

**Independent Test**: Save a query with a name, close and reopen the application, and verify the saved query can be loaded and executed. This delivers value by enabling query reuse and organization.

### Implementation for User Story 3

- [X] T058 [P] [US3] Implement query store module using electron-store in src/main/storage/query-store.ts for persisted query storage
- [X] T059 [US3] Implement saveQuery function in src/main/storage/query-store.ts to persist queries with metadata (id, name, sqlText, timestamps)
- [X] T060 [US3] Implement loadQueries function in src/main/storage/query-store.ts to retrieve all saved queries
- [X] T061 [US3] Implement updateQuery function in src/main/storage/query-store.ts to update existing saved queries
- [X] T062 [US3] Implement deleteQuery function in src/main/storage/query-store.ts to remove saved queries
- [X] T063 [US3] Implement searchQueries function in src/main/storage/query-store.ts to filter queries by name or SQL text
- [X] T064 [US3] Implement duplicate name validation in src/main/storage/query-store.ts
- [X] T065 [US3] Implement IPC handler for queries:list in src/main/ipc/queries.ts to return all saved queries
- [X] T066 [US3] Implement IPC handler for queries:get in src/main/ipc/queries.ts to return a specific saved query by ID
- [X] T067 [US3] Implement IPC handler for queries:save in src/main/ipc/queries.ts to save a new query
- [X] T068 [US3] Implement IPC handler for queries:update in src/main/ipc/queries.ts to update an existing query
- [X] T069 [US3] Implement IPC handler for queries:delete in src/main/ipc/queries.ts to delete a saved query
- [X] T070 [US3] Implement IPC handler for queries:search in src/main/ipc/queries.ts to search saved queries
- [X] T071 [P] [US3] Create saved queries store using Zustand in src/renderer/stores/queries-store.ts with state and actions
- [X] T072 [US3] Implement loadQueries action in src/renderer/stores/queries-store.ts to fetch queries via IPC
- [X] T073 [US3] Implement saveQuery action in src/renderer/stores/queries-store.ts to save queries via IPC
- [X] T074 [US3] Implement updateQuery action in src/renderer/stores/queries-store.ts to update queries via IPC
- [X] T075 [US3] Implement deleteQuery action in src/renderer/stores/queries-store.ts to delete queries via IPC
- [X] T076 [US3] Implement search functionality with searchTerm state in src/renderer/stores/queries-store.ts
- [X] T077 [P] [US3] Create SavedQueries component in src/renderer/components/SavedQueries/SavedQueries.tsx to display saved queries list
- [X] T078 [US3] Implement saved queries list rendering with name, description, and metadata in src/renderer/components/SavedQueries/SavedQueries.tsx
- [X] T079 [US3] Implement search input and filtering in src/renderer/components/SavedQueries/SavedQueries.tsx
- [X] T080 [US3] Implement load query into tab functionality in src/renderer/components/SavedQueries/SavedQueries.tsx
- [X] T081 [US3] Implement save query dialog/modal in QueryEditor component for saving current query
- [X] T082 [US3] Implement update saved query functionality when saving a query that already exists
- [X] T083 [US3] Implement delete saved query functionality with confirmation dialog in src/renderer/components/SavedQueries/SavedQueries.tsx
- [X] T084 [US3] Update tabs store to track savedQueryId when a query is loaded from saved queries
- [X] T085 [US3] Implement query persistence across application restarts: load saved queries on app startup
- [X] T086 [US3] Update QueryEditor to show save status and handle saving queries with names and descriptions

**Checkpoint**: All user stories should now be independently functional. Users can save queries, load them, and manage their saved query library.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T087 [P] Add error boundary components for React error handling in src/renderer/components/ErrorBoundary/ErrorBoundary.tsx
- [X] T088 [P] Implement comprehensive error handling and user-friendly error messages across all IPC handlers
- [X] T089 Implement loading states and progress indicators for all async operations
- [X] T090 [P] Add keyboard shortcuts for common actions (Execute query, New tab, Save query)
- [ ] T091 Implement query result pagination/virtualization for large result sets using react-window in src/renderer/components/QueryResults/QueryResults.tsx
- [ ] T092 Optimize memory usage for large result sets (limit in-memory rows, implement pagination)
- [X] T093 [P] Add application menu with File, Edit, View options using Electron Menu API in src/main/main.ts
- [X] T094 Implement application state persistence: save window size and position
- [X] T095 Add connection status indicator in UI showing connection health
- [ ] T096 Implement query timeout handling with configurable timeout values
- [ ] T097 [P] Add application icon and branding assets in src/assets/
- [ ] T098 Implement proper cleanup on application shutdown (cancel running queries, save state)
- [ ] T099 Run quickstart.md validation: verify all setup steps work correctly
- [X] T100 Code cleanup and refactoring: ensure consistent code style and patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
  - User Story 2 depends on User Story 1 (tabs need query execution functionality)
  - User Story 3 can be implemented independently but integrates with User Story 2 (saving queries from tabs)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 - Requires query execution functionality from US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US2 but core functionality is independent

### Within Each User Story

- Type definitions before implementation
- Stores/hooks before components
- IPC handlers before renderer usage
- Core functionality before UI integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Type definitions (T007, T008, T009) can be created in parallel
- Component creation tasks marked [P] within a story can run in parallel
- Store creation tasks marked [P] can run in parallel
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all type definition tasks together:
Task: "Create shared TypeScript type definitions in src/shared/types/connection.ts"
Task: "Create shared TypeScript type definitions in src/shared/types/query.ts"
Task: "Create shared TypeScript type definitions in src/shared/types/bigquery.ts"

# Launch all component creation tasks together:
Task: "Create ConnectionDialog component in src/renderer/components/ConnectionDialog/ConnectionDialog.tsx"
Task: "Create QueryEditor component in src/renderer/components/QueryEditor/QueryEditor.tsx"
Task: "Create QueryResults component in src/renderer/components/QueryResults/QueryResults.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Connect to BigQuery
   - Execute a simple SELECT query
   - Verify results display correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish phase → Final release

### Sequential Implementation (Recommended)

With a single developer or small team:

1. Complete Setup + Foundational together
2. Implement User Story 1 completely (all tasks)
3. Test and validate User Story 1
4. Implement User Story 2 completely (all tasks)
5. Test and validate User Story 2
6. Implement User Story 3 completely (all tasks)
7. Test and validate User Story 3
8. Complete Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Story 2 builds on User Story 1 (tabs need query execution), but can be tested independently once US1 is complete
- User Story 3 is largely independent but integrates with tabs from US2 for saving queries

---

## Task Summary

- **Total Tasks**: 100
- **Phase 1 (Setup)**: 6 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (User Story 1)**: 24 tasks
- **Phase 4 (User Story 2)**: 17 tasks
- **Phase 5 (User Story 3)**: 29 tasks
- **Phase 6 (Polish)**: 14 tasks

**Parallel Opportunities**: 35 tasks marked with [P] can be executed in parallel

**MVP Scope**: Phases 1, 2, and 3 (40 tasks total) deliver a working MVP where users can connect to BigQuery and execute queries.
````

## File: src/main/ipc/queries.ts
````typescript
import { ipcMain } from 'electron';
import {
  getQueries,
  getQuery,
  saveQuery,
  updateQuery,
  deleteQuery,
  searchQueries,
} from '../storage/query-store';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerQueriesHandlers(): void {
  ipcMain.handle('queries:list', async (): Promise<SavedQuery[]> => {
    try {
      return getQueries();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to load queries',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:get', async (_event, id: string): Promise<SavedQuery> => {
    try {
      const query = getQuery(id);
      if (!query) {
        throw {
          code: BigQueryErrorCode.QUERY_NOT_FOUND,
          message: `Query with id "${id}" not found`,
        };
      }
      return query;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get query',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:save', async (_event, input: SaveQueryInput): Promise<SavedQuery> => {
    try {
      return saveQuery(input);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw {
          code: BigQueryErrorCode.DUPLICATE_NAME,
          message: error.message,
        };
      }
      if (error.message.includes('required') || error.message.includes('empty')) {
        throw {
          code: BigQueryErrorCode.INVALID_NAME,
          message: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to save query',
        details: error.message,
      };
    }
  });

  ipcMain.handle(
    'queries:update',
    async (_event, id: string, updates: UpdateQueryInput): Promise<SavedQuery> => {
      try {
        return updateQuery(id, updates);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          throw {
            code: BigQueryErrorCode.QUERY_NOT_FOUND,
            message: error.message,
          };
        }
        if (error.message.includes('already exists')) {
          throw {
            code: BigQueryErrorCode.DUPLICATE_NAME,
            message: error.message,
          };
        }
        if (error.message.includes('empty') || error.message.includes('required')) {
          throw {
            code: BigQueryErrorCode.INVALID_NAME,
            message: error.message,
          };
        }
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to update query',
          details: error.message,
        };
      }
    }
  );

  ipcMain.handle('queries:delete', async (_event, id: string): Promise<void> => {
    try {
      deleteQuery(id);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw {
          code: BigQueryErrorCode.QUERY_NOT_FOUND,
          message: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete query',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:search', async (_event, term: string): Promise<SavedQuery[]> => {
    try {
      return searchQueries(term);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to search queries',
        details: error.message,
      };
    }
  });
}
````

## File: src/main/ipc/results-cache.ts
````typescript
import { ipcMain } from 'electron';
import {
  saveResults,
  getResults,
  getResultsMetadata,
  getResultsPage,
  deleteResults,
  clearAllResults,
} from '../storage/results-cache-store';
import type { QueryResult, Row } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerResultsCacheHandlers(): void {
  ipcMain.handle('results-cache:save', async (_event, tabId: string, results: QueryResult): Promise<void> => {
    try {
      saveResults(tabId, results);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to save results to cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:get', async (_event, tabId: string): Promise<QueryResult | null> => {
    try {
      const results = getResults(tabId);
      return results || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:getMetadata', async (_event, tabId: string) => {
    try {
      const metadata = getResultsMetadata(tabId);
      return metadata || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results metadata from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:getPage', async (_event, tabId: string, pageNumber: number): Promise<Row[] | null> => {
    try {
      const page = getResultsPage(tabId, pageNumber);
      return page || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results page from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:delete', async (_event, tabId: string): Promise<void> => {
    try {
      deleteResults(tabId);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete results from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:clear', async (): Promise<void> => {
    try {
      clearAllResults();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to clear results cache',
        details: error.message,
      };
    }
  });
}
````

## File: src/main/ipc/tabs.ts
````typescript
import { ipcMain } from 'electron';
import { getTabs, getActiveTabId, saveTabs } from '../storage/tabs-store';
import type { QueryTab } from '../../shared/types/query';

export function registerTabsHandlers(): void {
  ipcMain.handle('tabs:getTabs', async () => {
    return getTabs();
  });

  ipcMain.handle('tabs:getActiveTabId', async () => {
    return getActiveTabId();
  });

  ipcMain.handle('tabs:saveTabs', async (_event, tabs: QueryTab[], activeTabId: string | null) => {
    saveTabs(tabs, activeTabId);
  });
}
````

## File: src/main/ipc/ui-settings.ts
````typescript
import { ipcMain } from 'electron';
import {
  getLeftSidebarWidth,
  setLeftSidebarWidth,
  getRightSidebarWidth,
  setRightSidebarWidth,
} from '../storage/ui-settings-store';

export function registerUISettingsHandlers(): void {
  ipcMain.handle('ui-settings:getLeftSidebarWidth', async () => {
    return getLeftSidebarWidth();
  });

  ipcMain.handle('ui-settings:setLeftSidebarWidth', async (_event, width: number) => {
    setLeftSidebarWidth(width);
  });

  ipcMain.handle('ui-settings:getRightSidebarWidth', async () => {
    return getRightSidebarWidth();
  });

  ipcMain.handle('ui-settings:setRightSidebarWidth', async (_event, width: number) => {
    setRightSidebarWidth(width);
  });
}
````

## File: src/main/storage/connection-store.ts
````typescript
import Store from 'electron-store';
import { safeStorage } from 'electron';
import type { ConnectionConfiguration, ConnectionConfig } from '../../shared/types/connection';

interface ConnectionStoreData {
  connection: ConnectionConfiguration | null;
  encryptedServiceAccountKey?: string; // Base64 encoded encrypted service account key
}

const store = new Store<ConnectionStoreData>({
  name: 'connection',
  defaults: {
    connection: null,
  },
}) as Store<ConnectionStoreData> & {
  get(key: 'connection'): ConnectionConfiguration | null;
  set(key: 'connection', value: ConnectionConfiguration | null): void;
  get(key: 'encryptedServiceAccountKey'): string | undefined;
  set(key: 'encryptedServiceAccountKey', value: string | undefined): void;
  delete(key: string): void;
};

export function getSavedConnection(): ConnectionConfiguration | null {
  return store.get('connection') || null;
}

export function saveConnection(
  config: ConnectionConfig,
  connectionConfig: ConnectionConfiguration
): ConnectionConfiguration {
  // If service account key content is provided, encrypt and store it
  if (config.serviceAccountKey && safeStorage.isEncryptionAvailable()) {
    try {
      const encryptedKey = safeStorage.encryptString(config.serviceAccountKey);
      // Convert Buffer to base64 string for storage
      const base64Key = encryptedKey.toString('base64');
      store.set('encryptedServiceAccountKey', base64Key);
    } catch (error) {
      console.error('Failed to encrypt service account key:', error);
      // Continue without storing the key - user will need to re-enter it
      store.delete('encryptedServiceAccountKey');
    }
  } else {
    // Clear encrypted key if not provided
    store.delete('encryptedServiceAccountKey');
  }

  // Store connection configuration (without sensitive key content)
  store.set('connection', connectionConfig);

  return connectionConfig;
}

export function getDecryptedServiceAccountKey(): string | null {
  const base64Key = store.get('encryptedServiceAccountKey');
  if (!base64Key) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available, cannot decrypt service account key');
    return null;
  }

  try {
    // Convert base64 string back to Buffer
    const encryptedKey = Buffer.from(base64Key, 'base64');
    return safeStorage.decryptString(encryptedKey);
  } catch (error) {
    console.error('Failed to decrypt service account key:', error);
    // If decryption fails (e.g., due to app name change), clear the old encrypted data
    // This can happen when the app name changes and the encryption key changes
    console.warn('Clearing old encrypted service account key due to decryption failure');
    store.delete('encryptedServiceAccountKey');
    return null;
  }
}

export function clearConnection(): void {
  store.set('connection', null);
  store.delete('encryptedServiceAccountKey');
}
````

## File: src/main/storage/query-store.ts
````typescript
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';

interface QueryStoreData {
  queries: SavedQuery[];
}

const store = new Store<QueryStoreData>({
  name: 'queries',
  defaults: {
    queries: [],
  },
}) as Store<QueryStoreData> & {
  get(key: 'queries'): SavedQuery[];
  set(key: 'queries', value: SavedQuery[]): void;
};

export function getQueries(): SavedQuery[] {
  return store.get('queries') || [];
}

export function getQuery(id: string): SavedQuery | undefined {
  const queries = getQueries();
  return queries.find((q) => q.id === id);
}

export function saveQuery(input: SaveQueryInput): SavedQuery {
  const queries = getQueries();

  // Validate name
  if (!input.name || input.name.trim() === '') {
    throw new Error('Query name is required');
  }

  if (input.name.length > 255) {
    throw new Error('Query name must be 255 characters or less');
  }

  // Check for duplicate name
  const duplicate = queries.find((q) => q.name === input.name.trim());
  if (duplicate) {
    throw new Error(`A query with the name "${input.name}" already exists`);
  }

  const now = new Date().toISOString();
  const newQuery: SavedQuery = {
    id: randomUUID(),
    name: input.name.trim(),
    sqlText: input.sqlText,
    description: input.description,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };

  queries.push(newQuery);
  store.set('queries', queries);

  return newQuery;
}

export function updateQuery(id: string, updates: UpdateQueryInput): SavedQuery {
  const queries = getQueries();
  const index = queries.findIndex((q) => q.id === id);

  if (index === -1) {
    throw new Error(`Query with id "${id}" not found`);
  }

  const existingQuery = queries[index];

  // Validate name if provided
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim() === '') {
      throw new Error('Query name cannot be empty');
    }

    if (updates.name.length > 255) {
      throw new Error('Query name must be 255 characters or less');
    }

    // Check for duplicate name (excluding current query)
    const nameToCheck = updates.name.trim();
    const duplicate = queries.find((q) => q.id !== id && q.name === nameToCheck);
    if (duplicate) {
      throw new Error(`A query with the name "${nameToCheck}" already exists`);
    }
  }

  const updatedQuery: SavedQuery = {
    ...existingQuery,
    name: updates.name !== undefined ? updates.name.trim() : existingQuery.name,
    sqlText: updates.sqlText !== undefined ? updates.sqlText : existingQuery.sqlText,
    description: updates.description !== undefined ? updates.description : existingQuery.description,
    tags: updates.tags !== undefined ? updates.tags : existingQuery.tags,
    updatedAt: new Date().toISOString(),
  };

  queries[index] = updatedQuery;
  store.set('queries', queries);

  return updatedQuery;
}

export function deleteQuery(id: string): void {
  const queries = getQueries();
  const filtered = queries.filter((q) => q.id !== id);

  if (filtered.length === queries.length) {
    throw new Error(`Query with id "${id}" not found`);
  }

  store.set('queries', filtered);
}

export function searchQueries(term: string): SavedQuery[] {
  const queries = getQueries();
  const lowerTerm = term.toLowerCase().trim();

  if (!lowerTerm) {
    return queries;
  }

  return queries.filter(
    (q) =>
      q.name.toLowerCase().includes(lowerTerm) ||
      q.sqlText.toLowerCase().includes(lowerTerm) ||
      (q.description && q.description.toLowerCase().includes(lowerTerm)) ||
      (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)))
  );
}
````

## File: src/main/storage/results-cache-store.ts
````typescript
import Store from 'electron-store';
import type { QueryResult, Row, ColumnMetadata } from '../../shared/types/query';

const ROWS_PER_PAGE = 200;

interface ResultsMetadata {
  columns: ColumnMetadata[];
  totalRows: number;
  rowsReturned: number;
  executionTimeMs: number;
  bytesProcessed?: number;
  jobId: string;
  hasMore: boolean;
}

interface ResultsCacheStoreData {
  metadata: { [tabId: string]: ResultsMetadata };
  pages: { [tabId: string]: { [pageNumber: number]: Row[] } };
}

const store = new Store<ResultsCacheStoreData>({
  name: 'results-cache',
  defaults: {
    metadata: {},
    pages: {},
  },
}) as Store<ResultsCacheStoreData> & {
  get(key: 'metadata'): { [tabId: string]: ResultsMetadata };
  get(key: 'pages'): { [tabId: string]: { [pageNumber: number]: Row[] } };
  set(key: 'metadata', value: { [tabId: string]: ResultsMetadata }): void;
  set(key: 'pages', value: { [tabId: string]: { [pageNumber: number]: Row[] } }): void;
};

/**
 * Save query results for a specific tab
 * This overwrites any existing results for that tab
 * Results are stored in pages for efficient access
 * Uses asynchronous chunked saving to prevent blocking the main process
 */
export function saveResults(tabId: string, results: QueryResult): void {
  const metadata: ResultsMetadata = {
    columns: results.columns,
    totalRows: results.totalRows,
    rowsReturned: results.rowsReturned,
    executionTimeMs: results.executionTimeMs,
    bytesProcessed: results.bytesProcessed,
    jobId: results.jobId,
    hasMore: results.hasMore,
  };

  // Save metadata immediately for instant access
  const allMetadata = store.get('metadata') || {};
  allMetadata[tabId] = metadata;
  store.set('metadata', allMetadata);

  // Initialize pages object
  const allPages = store.get('pages') || {};
  allPages[tabId] = {};
  
  const totalPages = Math.ceil(results.rows.length / ROWS_PER_PAGE);
  
  // Save first page immediately for instant display
  if (results.rows.length > 0) {
    const firstPage = results.rows.slice(0, ROWS_PER_PAGE);
    allPages[tabId][1] = firstPage;
    store.set('pages', allPages);
  }

  // Save remaining pages asynchronously in chunks to avoid blocking
  if (totalPages > 1) {
    let currentPage = 2;
    const CHUNK_SIZE = 5; // Save 5 pages at a time
    
    const saveNextChunk = () => {
      const endPage = Math.min(currentPage + CHUNK_SIZE - 1, totalPages);
      
      // Save chunk of pages
      for (let page = currentPage; page <= endPage; page++) {
        const startIndex = (page - 1) * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, results.rows.length);
        allPages[tabId][page] = results.rows.slice(startIndex, endIndex);
      }
      
      // Update store with this chunk
      store.set('pages', allPages);
      currentPage = endPage + 1;
      
      // Continue with next chunk if there are more pages
      if (currentPage <= totalPages) {
        // Use setImmediate to yield to event loop between chunks
        setImmediate(saveNextChunk);
      }
    };
    
    // Start async saving
    setImmediate(saveNextChunk);
  }
}

/**
 * Get results metadata for a specific tab (without rows)
 */
export function getResultsMetadata(tabId: string): ResultsMetadata | undefined {
  const allMetadata = store.get('metadata') || {};
  return allMetadata[tabId];
}

/**
 * Get a specific page of results for a tab
 */
export function getResultsPage(tabId: string, pageNumber: number): Row[] | undefined {
  const allPages = store.get('pages') || {};
  const tabPages = allPages[tabId];
  if (!tabPages) return undefined;
  return tabPages[pageNumber];
}

/**
 * Get all results for a tab (for backward compatibility)
 * This loads all pages - use getResultsPage for better performance
 */
export function getResults(tabId: string): QueryResult | undefined {
  const metadata = getResultsMetadata(tabId);
  if (!metadata) return undefined;

  const allPages = store.get('pages') || {};
  const tabPages = allPages[tabId];
  if (!tabPages) return undefined;

  // Combine all pages
  const rows: Row[] = [];
  const pageNumbers = Object.keys(tabPages)
    .map(Number)
    .sort((a, b) => a - b);
  
  for (const pageNum of pageNumbers) {
    rows.push(...tabPages[pageNum]);
  }

  return {
    columns: metadata.columns,
    rows,
    totalRows: metadata.totalRows,
    rowsReturned: metadata.rowsReturned,
    executionTimeMs: metadata.executionTimeMs,
    bytesProcessed: metadata.bytesProcessed,
    jobId: metadata.jobId,
    hasMore: metadata.hasMore,
  };
}

/**
 * Delete results for a specific tab
 */
export function deleteResults(tabId: string): void {
  const allMetadata = store.get('metadata') || {};
  const allPages = store.get('pages') || {};
  
  delete allMetadata[tabId];
  delete allPages[tabId];
  
  store.set('metadata', allMetadata);
  store.set('pages', allPages);
}

/**
 * Clear all cached results
 * Called when application closes
 */
export function clearAllResults(): void {
  store.set('metadata', {});
  store.set('pages', {});
}
````

## File: src/main/storage/tabs-store.ts
````typescript
import Store from 'electron-store';
import type { QueryTab } from '../../shared/types/query';

interface TabsStoreData {
  tabs: QueryTab[];
  activeTabId: string | null;
}

// For persistence, we'll exclude large result data but keep everything else
type PersistedTab = Omit<QueryTab, 'results'> & {
  results?: never; // Explicitly exclude results from persisted data
};

interface PersistedTabsStoreData {
  tabs: PersistedTab[];
  activeTabId: string | null;
}

const store = new Store<PersistedTabsStoreData>({
  name: 'tabs',
  defaults: {
    tabs: [],
    activeTabId: null,
  },
}) as Store<PersistedTabsStoreData> & {
  get(key: 'tabs'): PersistedTab[];
  set(key: 'tabs', value: PersistedTab[]): void;
  get(key: 'activeTabId'): string | null;
  set(key: 'activeTabId', value: string | null): void;
};

export function getTabs(): QueryTab[] {
  const persistedTabs = store.get('tabs') || [];
  // Convert persisted tabs back to QueryTab (results will be undefined)
  return persistedTabs.map((tab) => ({
    ...tab,
    results: undefined,
  }));
}

export function getActiveTabId(): string | null {
  return store.get('activeTabId') || null;
}

export function saveTabs(tabs: QueryTab[], activeTabId: string | null): void {
  // Remove results before persisting (they can be very large)
  const persistedTabs: PersistedTab[] = tabs.map(({ results, ...tab }) => tab);
  store.set('tabs', persistedTabs);
  store.set('activeTabId', activeTabId);
}
````

## File: src/main/storage/ui-settings-store.ts
````typescript
import Store from 'electron-store';

interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface UISettingsData {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  windowBounds?: WindowBounds;
}

const store = new Store<UISettingsData>({
  name: 'ui-settings',
  defaults: {
    leftSidebarWidth: 250,
    rightSidebarWidth: 300,
    windowBounds: {
      width: 1200,
      height: 800,
    },
  },
}) as Store<UISettingsData> & {
  get(key: 'leftSidebarWidth'): number;
  set(key: 'leftSidebarWidth', value: number): void;
  get(key: 'rightSidebarWidth'): number;
  set(key: 'rightSidebarWidth', value: number): void;
  get(key: 'windowBounds'): WindowBounds | undefined;
  set(key: 'windowBounds', value: WindowBounds): void;
};

export function getLeftSidebarWidth(): number {
  return store.get('leftSidebarWidth') || 250;
}

export function setLeftSidebarWidth(width: number): void {
  store.set('leftSidebarWidth', width);
}

export function getRightSidebarWidth(): number {
  return store.get('rightSidebarWidth') || 300;
}

export function setRightSidebarWidth(width: number): void {
  store.set('rightSidebarWidth', width);
}

export function getWindowBounds(): WindowBounds | undefined {
  return store.get('windowBounds');
}

export function setWindowBounds(bounds: WindowBounds): void {
  store.set('windowBounds', bounds);
}
````

## File: src/renderer/components/AboutDialog/AboutDialog.css
````css
.about-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.about-dialog {
  background: #252526;
  border-radius: 4px;
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 1px solid #3e3e42;
  color: #cccccc;
  display: flex;
  flex-direction: column;
}

.about-dialog h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 400;
  color: #ffffff;
}

.about-content {
  flex: 1;
  padding-right: 0.5rem;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.app-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.app-description {
  font-size: 0.9375rem;
  color: #cccccc;
  line-height: 1.5;
  margin: 0;
}

.app-version {
  font-size: 0.875rem;
  color: #858585;
  margin: 0;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #3e3e42;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  background-color: #0e639c;
  color: #ffffff;
}

.dialog-actions button:hover {
  background-color: #1177bb;
}

.donation-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  background-color: #0070f3;
  color: #ffffff;
  text-decoration: none;
  display: inline-block;
  font-family: inherit;
}

.donation-button:hover {
  background-color: #0051cc;
}
````

## File: src/renderer/components/AboutDialog/AboutDialog.tsx
````typescript
import React, { useEffect, useState } from 'react';
import './AboutDialog.css';

interface AboutDialogProps {
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Get version from main process via IPC
    if (window.electronAPI?.app) {
      window.electronAPI.app.getVersion()
        .then(ver => setVersion(ver))
        .catch(() => {
          setVersion('1.0.2'); // Fallback version
        });
    } else {
      setVersion('1.0.2'); // Fallback version
    }
  }, []);

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent closing when clicking inside the dialog
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="about-dialog-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={handleDialogClick}>
        <h2>About QueryForge</h2>
        <div className="about-content">
          <div className="about-info">
            <p className="app-name">QueryForge</p>
            <p className="app-description">
              A desktop application for browsing and querying Google Cloud Platform BigQuery data.
            </p>
            {version && (
              <p className="app-version">Version {version}</p>
            )}
          </div>
        </div>
        <div className="dialog-actions">
          <a
            href="https://www.paypal.com/donate/?business=3MKGEKEWEHWPS&no_recurring=0&item_name=Inspire+development+of+BigQuery+Desktop+app&currency_code=SEK"
            target="_blank"
            rel="noopener noreferrer"
            className="donation-button"
            onClick={(e) => e.stopPropagation()}
          >
            Donate
          </a>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/components/ErrorBoundary/ErrorBoundary.css
````css
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  height: 100vh;
  text-align: center;
  background-color: #1e1e1e;
  color: #cccccc;
}

.error-boundary h2 {
  color: #f48771;
  margin-bottom: 1rem;
  font-weight: 400;
}

.error-boundary details {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 800px;
  text-align: left;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.8125rem;
  color: #cccccc;
}

.error-boundary button {
  padding: 0.75rem 1.5rem;
  background-color: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  margin-top: 1rem;
  transition: background-color 0.15s ease;
}

.error-boundary button:hover {
  background-color: #1177bb;
}
````

## File: src/renderer/components/ErrorBoundary/ErrorBoundary.tsx
````typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error?.stack}
          </details>
          <button onClick={() => window.location.reload()}>Reload Application</button>
        </div>
      );
    }

    return this.props.children;
  }
}
````

## File: src/renderer/components/QueryResults/ColumnSortMenu.css
````css
.column-sort-menu {
  position: fixed;
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 150px;
  padding: 4px 0;
  font-size: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.sort-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  color: #cccccc;
  text-align: left;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.15s ease;
}

.sort-menu-item:hover {
  background-color: #2a2d2e;
}

.sort-menu-item.active {
  background-color: #094771;
  color: #ffffff;
}

.sort-menu-item.active:hover {
  background-color: #0e639c;
}

.sort-icon {
  font-size: 0.875rem;
  width: 16px;
  display: inline-block;
  text-align: center;
}
````

## File: src/renderer/components/QueryResults/ColumnSortMenu.tsx
````typescript
import React, { useEffect, useRef } from 'react';
import './ColumnSortMenu.css';

interface ColumnSortMenuProps {
  x: number;
  y: number;
  columnIndex: number;
  currentSortColumn: number | null;
  currentSortDirection: 'asc' | 'desc' | null;
  onClose: () => void;
  onSort: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

export const ColumnSortMenu: React.FC<ColumnSortMenuProps> = ({
  x,
  y,
  columnIndex,
  currentSortColumn,
  currentSortDirection,
  onClose,
  onSort,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Position menu to stay within viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleSort = (direction: 'asc' | 'desc') => {
    onSort(columnIndex, direction);
    onClose();
  };

  const isAscActive = currentSortColumn === columnIndex && currentSortDirection === 'asc';
  const isDescActive = currentSortColumn === columnIndex && currentSortDirection === 'desc';

  return (
    <div
      ref={menuRef}
      className="column-sort-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <button
        className={`sort-menu-item ${isAscActive ? 'active' : ''}`}
        onClick={() => handleSort('asc')}
      >
        <span className="sort-icon">↑</span>
        Ascending
      </button>
      <button
        className={`sort-menu-item ${isDescActive ? 'active' : ''}`}
        onClick={() => handleSort('desc')}
      >
        <span className="sort-icon">↓</span>
        Descending
      </button>
    </div>
  );
};
````

## File: src/renderer/components/QueryResults/RowContextMenu.css
````css
.row-context-menu {
  position: fixed;
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 200px;
  padding: 0.25rem 0;
}

.context-menu-item {
  width: 100%;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: #cccccc;
  text-align: left;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.context-menu-item:hover {
  background-color: #2a2d2e;
}

.context-menu-item:active {
  background-color: #007acc;
}
````

## File: src/renderer/components/QueryResults/RowContextMenu.tsx
````typescript
import React, { useEffect, useRef } from 'react';
import './RowContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopyValues: () => void;
  menuLabel?: string;
}

export const RowContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onCopyValues,
  menuLabel = 'Copy values (with headers)',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Position menu to stay within viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="row-context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <button
        className="context-menu-item"
        onClick={() => {
          onCopyValues();
          onClose();
        }}
      >
        {menuLabel}
      </button>
    </div>
  );
};
````

## File: src/renderer/components/SavedQueries/SavedQueries.css
````css
.saved-queries-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.saved-queries-dialog {
  background: #252526;
  border-radius: 4px;
  padding: 2rem;
  min-width: 600px;
  max-width: 800px;
  max-height: 80vh;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  border: 1px solid #3e3e42;
  color: #cccccc;
}

.saved-queries-dialog h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 400;
  color: #ffffff;
}

.search-container {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  font-size: 0.8125rem;
  background-color: #3c3c3c;
  color: #cccccc;
}

.search-input:focus {
  outline: 1px solid #007acc;
  outline-offset: -1px;
}

.loading,
.no-queries {
  padding: 2rem;
  text-align: center;
  color: #858585;
}

.queries-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.query-item {
  border: 1px solid #3e3e42;
  border-radius: 3px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #2d2d30;
  transition: background-color 0.15s ease;
}

.query-item:hover {
  background-color: #323233;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.query-name {
  margin: 0;
  font-size: 0.9375rem;
  color: #ffffff;
  font-weight: 400;
}

.query-actions {
  display: flex;
  gap: 0.5rem;
}

.load-button,
.delete-button {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.load-button {
  background-color: #0e639c;
  color: #ffffff;
}

.load-button:hover {
  background-color: #1177bb;
}

.delete-button {
  background-color: #a1260d;
  color: #ffffff;
}

.delete-button:hover {
  background-color: #c72e0f;
}

.query-description {
  margin: 0.5rem 0;
  color: #858585;
  font-size: 0.8125rem;
}

.query-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #858585;
  margin-bottom: 0.5rem;
}

.query-tags {
  color: #4ec9b0;
}

.query-preview {
  background-color: #1e1e1e;
  padding: 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #cccccc;
  overflow-x: auto;
  margin: 0;
  border: 1px solid #3e3e42;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #3e3e42;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  background-color: #3e3e42;
  color: #cccccc;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.dialog-actions button:hover {
  background-color: #4a4a4a;
}
````

## File: src/renderer/components/SavedQueries/SavedQueries.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { useQueriesStore } from '../../stores/queries-store';
import { useTabsStore } from '../../stores/tabs-store';
import './SavedQueries.css';

interface SavedQueriesProps {
  onClose: () => void;
}

export const SavedQueries: React.FC<SavedQueriesProps> = ({ onClose }) => {
  const { queries, isLoading, loadQueries, deleteQuery, setSearchTerm, getFilteredQueries } =
    useQueriesStore();
  const { createTab, setTabQuery, updateTab } = useTabsStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue, setSearchTerm]);

  const handleLoadQuery = (queryId: string) => {
    const query = queries.find((q) => q.id === queryId);
    if (!query) return;

    const newTabId = createTab();
    setTabQuery(newTabId, query.sqlText);
    updateTab(newTabId, {
      title: query.name,
      savedQueryId: query.id,
      isModified: false,
    });
    onClose();
  };

  const handleDeleteQuery = async (queryId: string, queryName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${queryName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteQuery(queryId);
    } catch (error: any) {
      alert(`Failed to delete query: ${error.message}`);
    }
  };

  const filteredQueries = getFilteredQueries();

  return (
    <div className="saved-queries-overlay" onClick={onClose}>
      <div className="saved-queries-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Saved Queries</h2>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search queries..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div className="loading">Loading queries...</div>
        ) : filteredQueries.length === 0 ? (
          <div className="no-queries">
            {searchValue ? 'No queries match your search.' : 'No saved queries yet.'}
          </div>
        ) : (
          <div className="queries-list">
            {filteredQueries.map((query) => (
              <div key={query.id} className="query-item">
                <div className="query-header">
                  <h3 className="query-name">{query.name}</h3>
                  <div className="query-actions">
                    <button onClick={() => handleLoadQuery(query.id)} className="load-button">
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(query.id, query.name)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {query.description && (
                  <p className="query-description">{query.description}</p>
                )}
                <div className="query-meta">
                  <span>Created: {new Date(query.createdAt).toLocaleDateString()}</span>
                  {query.tags && query.tags.length > 0 && (
                    <span className="query-tags">
                      Tags: {query.tags.map((tag) => `#${tag}`).join(', ')}
                    </span>
                  )}
                </div>
                <pre className="query-preview">{query.sqlText.substring(0, 200)}...</pre>
              </div>
            ))}
          </div>
        )}

        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/components/SchemaSidebar/SchemaSidebar.css
````css
.schema-sidebar {
  width: 100%;
  height: 100%;
  background-color: #252526;
  border-left: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  color: #cccccc;
}

.schema-sidebar-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  height: 35px;
  gap: 0.5rem;
}

.schema-sidebar-title {
  flex: 1;
  min-width: 0;
}

.schema-sidebar-title-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.schema-sidebar-table-name {
  font-size: 0.8125rem;
  color: #cccccc;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schema-sidebar-table-path {
  font-size: 0.625rem;
  color: #858585;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.125rem;
}

.schema-sidebar-close {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.schema-sidebar-close:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.schema-sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.25rem 0;
}

.schema-metadata {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #3e3e42;
  background-color: #1e1e1e;
}

.schema-metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  font-size: 0.75rem;
  gap: 0.5rem;
}

.schema-metadata-item:first-child {
  padding-top: 0;
}

.schema-metadata-item:last-child {
  padding-bottom: 0;
}

.schema-metadata-label {
  color: #858585;
  font-weight: 500;
  flex-shrink: 0;
}

.schema-metadata-value {
  color: #cccccc;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.schema-sidebar-loading,
.schema-sidebar-error,
.schema-sidebar-empty {
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #858585;
}

.schema-sidebar-error {
  color: #f48771;
}

.schema-fields {
  display: flex;
  flex-direction: column;
}

.schema-field-item {
  user-select: none;
}

.schema-field-row {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  cursor: default;
  color: #cccccc;
  font-size: 0.75rem;
  transition: background-color 0.15s ease;
  gap: 0.375rem;
}

.schema-field-row:hover {
  background-color: #2a2d2e;
}

.schema-field-icon {
  font-size: 0.625rem;
  color: #858585;
  width: 12px;
  display: inline-block;
  text-align: center;
  flex-shrink: 0;
}

.schema-field-icon-spacer {
  width: 12px;
  display: inline-block;
  flex-shrink: 0;
}

.schema-field-name {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #cccccc;
  min-width: 0;
}

.schema-field-type {
  flex-shrink: 0;
  color: #569cd6;
  font-size: 0.75rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  margin-left: auto;
}

.schema-field-mode {
  flex-shrink: 0;
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.schema-field-mode-required {
  background-color: rgba(244, 135, 113, 0.15);
  color: #f48771;
}

.schema-field-mode-repeated {
  background-color: rgba(197, 134, 192, 0.15);
  color: #c586c0;
}

.schema-field-nested {
  padding-left: 0;
}
````

## File: src/renderer/components/SchemaSidebar/SchemaSidebar.tsx
````typescript
import React, { useState, useEffect } from 'react';
import type { ColumnMetadata } from '../../../shared/types/query';
import './SchemaSidebar.css';

interface SchemaField extends ColumnMetadata {
  fields?: SchemaField[];
}

interface TableMetadata {
  creationTime?: number;
  lastModifiedTime?: number;
  numRows?: number;
  numBytes?: number;
}

interface SchemaSidebarProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

export const SchemaSidebar: React.FC<SchemaSidebarProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [metadata, setMetadata] = useState<TableMetadata | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      if (!window.electronAPI) {
        setError('Electron API not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        setSchema(result.fields as SchemaField[]);
        setMetadata(result.metadata);
      } catch (err: any) {
        setError(err.message || 'Failed to load table schema');
        console.error('Failed to load table schema:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchema();
  }, [datasetId, tableId]);

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  const renderField = (field: SchemaField, depth: number = 0): React.ReactNode => {
    const isNested = field.fields && field.fields.length > 0;
    const indent = `${depth}rem`;

    return (
      <div key={field.name} className="schema-field-item">
        <div 
          className="schema-field-row" 
          style={{ paddingLeft: indent }}
        >
          {isNested && <span className="schema-field-icon">▼</span>}
          {!isNested && <span className="schema-field-icon-spacer"></span>}
          <span className="schema-field-name">{field.name}</span>
          <span className="schema-field-type">{field.type}</span>
          {field.mode && field.mode !== 'NULLABLE' && (
            <span className={`schema-field-mode schema-field-mode-${field.mode.toLowerCase()}`}>
              {field.mode}
            </span>
          )}
        </div>
        {isNested && (
          <div className="schema-field-nested">
            {field.fields!.map((nestedField) => renderField(nestedField, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="schema-sidebar">
      <div className="schema-sidebar-header">
        <div className="schema-sidebar-title">
          <div className="schema-sidebar-title-content">
            <span className="schema-sidebar-table-name">{tableId}</span>
            <span className="schema-sidebar-table-path">{projectId}.{datasetId}</span>
          </div>
        </div>
        <button className="schema-sidebar-close" onClick={onClose} title="Close">
          ×
        </button>
      </div>
      <div className="schema-sidebar-content">
        {isLoading && (
          <div className="schema-sidebar-loading">Loading schema...</div>
        )}
        {error && (
          <div className="schema-sidebar-error">{error}</div>
        )}
        {!isLoading && !error && (
          <>
            {metadata && (
              <div className="schema-metadata">
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Created:</span>
                  <span className="schema-metadata-value">{formatDate(metadata.creationTime)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Modified:</span>
                  <span className="schema-metadata-value">{formatDate(metadata.lastModifiedTime)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Rows:</span>
                  <span className="schema-metadata-value">{formatNumber(metadata.numRows)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Size:</span>
                  <span className="schema-metadata-value">{formatBytes(metadata.numBytes)}</span>
                </div>
              </div>
            )}
            {schema.length === 0 ? (
              <div className="schema-sidebar-empty">No schema available</div>
            ) : (
              <div className="schema-fields">
                {schema.map((field) => renderField(field))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
````

## File: src/renderer/components/SidebarHeader/SidebarHeader.css
````css
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.5rem;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  gap: 0.5rem;
  height: 35px;
}

.sidebar-header-collapsed {
  justify-content: center;
}

.collapse-button {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.collapse-button:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.refresh-button {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.refresh-button:hover:not(:disabled) {
  background-color: #2a2d2e;
  color: #cccccc;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
````

## File: src/renderer/components/SidebarHeader/SidebarHeader.tsx
````typescript
import React from 'react';
import './SidebarHeader.css';

interface SidebarHeaderProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed = false,
  onToggleCollapse,
  onRefresh,
  isLoading = false,
}) => {
  if (collapsed) {
    return (
      <div className="sidebar-header sidebar-header-collapsed">
        <button
          className="collapse-button"
          onClick={onToggleCollapse}
          title="Expand"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-header">
      <button
        className="collapse-button"
        onClick={onToggleCollapse}
        title="Collapse"
      >
        ◀
      </button>
      {onRefresh && (
        <button
          className="refresh-button"
          onClick={onRefresh}
          title="Refresh"
          disabled={isLoading}
        >
          ↻
        </button>
      )}
    </div>
  );
};
````

## File: src/renderer/components/SidebarSwitcher/SidebarSwitcher.css
````css
.sidebar-switcher {
  display: flex;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 0.25rem;
  gap: 0.25rem;
}

.sidebar-switcher-button {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 400;
  padding: 0.5rem 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sidebar-switcher-button:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.sidebar-switcher-button.active {
  background-color: #1e1e1e;
  color: #ffffff;
}
````

## File: src/renderer/components/SidebarSwitcher/SidebarSwitcher.tsx
````typescript
import React from 'react';
import './SidebarSwitcher.css';

export type SidebarView = 'explorer' | 'saved-queries';

interface SidebarSwitcherProps {
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  collapsed?: boolean;
}

export const SidebarSwitcher: React.FC<SidebarSwitcherProps> = ({
  currentView,
  onViewChange,
  collapsed = false,
}) => {
  if (collapsed) {
    return null;
  }

  return (
    <div className="sidebar-switcher">
      <button
        className={`sidebar-switcher-button ${currentView === 'explorer' ? 'active' : ''}`}
        onClick={() => onViewChange('explorer')}
        title="Explorer"
      >
        EXPLORER
      </button>
      <button
        className={`sidebar-switcher-button ${currentView === 'saved-queries' ? 'active' : ''}`}
        onClick={() => onViewChange('saved-queries')}
        title="Saved Queries"
      >
        SAVED QUERIES
      </button>
    </div>
  );
};
````

## File: src/renderer/hooks/useBigQuery.ts
````typescript
import { useCallback } from 'react';
import { useConnectionStore } from '../stores/connection-store';
import type { QueryResult } from '../../shared/types/query';

export function useBigQuery() {
  const connection = useConnectionStore((state) => state.connection);

  const executeQuery = useCallback(
    async (queryText: string): Promise<QueryResult> => {
      if (!connection) {
        throw new Error('No active connection');
      }

      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      return await window.electronAPI.bigquery.execute(queryText, connection.projectId);
    },
    [connection]
  );

  const cancelQuery = useCallback(
    async (jobId: string): Promise<void> => {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      return await window.electronAPI.bigquery.cancel(jobId);
    },
    []
  );

  return {
    executeQuery,
    cancelQuery,
    isConnected: !!connection,
  };
}
````

## File: src/renderer/stores/bigquery-metadata-store.ts
````typescript
import { create } from 'zustand';
import type { Dataset, Table } from '../../shared/types/dataset';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  tablesLoaded?: boolean;
}

interface BigQueryMetadataState {
  datasets: DatasetWithTables[];
  isLoading: boolean;
  error: string | null;
  setDatasets: (datasets: DatasetWithTables[]) => void;
  setDatasetTables: (datasetId: string, tables: Table[]) => void;
  getDatasetTables: (datasetId: string) => Table[] | undefined;
  getAllTables: () => Array<{ dataset: string; table: Table }>;
  clear: () => void;
}

export const useBigQueryMetadataStore = create<BigQueryMetadataState>((set, get) => ({
  datasets: [],
  isLoading: false,
  error: null,
  
  setDatasets: (datasets) => set({ datasets }),
  
  setDatasetTables: (datasetId: string, tables: Table[]) =>
    set((state) => ({
      datasets: state.datasets.map((ds) =>
        ds.id === datasetId ? { ...ds, tables, tablesLoaded: true } : ds
      ),
    })),
  
  getDatasetTables: (datasetId: string) => {
    const state = get();
    const dataset = state.datasets.find((ds) => ds.id === datasetId);
    return dataset?.tables;
  },
  
  getAllTables: () => {
    const state = get();
    const allTables: Array<{ dataset: string; table: Table }> = [];
    state.datasets.forEach((dataset) => {
      if (dataset.tables) {
        dataset.tables.forEach((table) => {
          allTables.push({ dataset: dataset.id, table });
        });
      }
    });
    return allTables;
  },
  
  clear: () => set({ datasets: [], isLoading: false, error: null }),
}));
````

## File: src/renderer/stores/connection-store.ts
````typescript
import { create } from 'zustand';
import type { ConnectionConfiguration } from '../../shared/types/connection';

interface ConnectionState {
  connection: ConnectionConfiguration | null;
  isConnecting: boolean;
  connectionError: string | null;
  setConnection: (config: ConnectionConfiguration) => void;
  clearConnection: () => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connection: null,
  isConnecting: false,
  connectionError: null,
  setConnection: (config) =>
    set({ connection: config, connectionError: null, isConnecting: false }),
  clearConnection: () =>
    set({ connection: null, connectionError: null, isConnecting: false }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setConnectionError: (error) => set({ connectionError: error, isConnecting: false }),
}));
````

## File: src/renderer/stores/queries-store.ts
````typescript
import { create } from 'zustand';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';

interface QueriesState {
  queries: SavedQuery[];
  isLoading: boolean;
  searchTerm: string;
  loadQueries: () => Promise<void>;
  saveQuery: (input: SaveQueryInput) => Promise<SavedQuery>;
  updateQuery: (id: string, updates: UpdateQueryInput) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  getFilteredQueries: () => SavedQuery[];
}

export const useQueriesStore = create<QueriesState>((set, get) => ({
  queries: [],
  isLoading: false,
  searchTerm: '',

  loadQueries: async () => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    set({ isLoading: true });
    try {
      const queries = await window.electronAPI.queries.list();
      set({ queries, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  saveQuery: async (input: SaveQueryInput) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const saved = await window.electronAPI.queries.save(input);
    set((state) => ({
      queries: [...state.queries, saved],
    }));
    return saved;
  },

  updateQuery: async (id: string, updates: UpdateQueryInput) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const updated = await window.electronAPI.queries.update(id, updates);
    set((state) => ({
      queries: state.queries.map((q) => (q.id === id ? updated : q)),
    }));
  },

  deleteQuery: async (id: string) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.queries.delete(id);
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  getFilteredQueries: () => {
    const { queries, searchTerm } = get();
    if (!searchTerm.trim()) {
      return queries;
    }

    if (!window.electronAPI) {
      return queries;
    }

    // Use IPC search for server-side filtering
    // For now, do client-side filtering
    const lowerTerm = searchTerm.toLowerCase();
    return queries.filter(
      (q) =>
        q.name.toLowerCase().includes(lowerTerm) ||
        q.sqlText.toLowerCase().includes(lowerTerm) ||
        (q.description && q.description.toLowerCase().includes(lowerTerm)) ||
        (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)))
    );
  },
}));
````

## File: src/renderer/App.css
````css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* Global scrollbar styling to match Monaco Editor */
* {
  scrollbar-width: thin;
  scrollbar-color: #424242 #1e1e1e;
}

*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  background: #1e1e1e;
}

*::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

*::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}

*::-webkit-scrollbar-corner {
  background: #1e1e1e;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #1e1e1e;
  color: #cccccc;
}

.app-header {
  background-color: #2d2d30;
  color: #cccccc;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #3e3e42;
  height: 35px;
}

.app-header h1 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 400;
  color: #cccccc;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #858585;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #6c757d;
}

.status-indicator.connected {
  background-color: #4ec9b0;
}

.header-actions button {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 3px;
  background-color: transparent;
  color: #cccccc;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.header-actions button:hover {
  background-color: #2a2d2e;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: #1e1e1e;
}

.app-editor-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  position: relative;
}

.query-section {
  flex: 0 0 auto;
  min-height: 200px;
  max-height: 800px;
  border-bottom: 1px solid #3e3e42;
  overflow: hidden;
}

.resize-handle-horizontal {
  height: 4px;
  background-color: #3e3e42;
  cursor: row-resize;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.15s ease;
}

.resize-handle-horizontal:hover {
  background-color: #007acc;
}

.resize-handle-horizontal::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  bottom: -2px;
  cursor: row-resize;
}

.resize-handle-vertical {
  width: 4px;
  background-color: #3e3e42;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.15s ease;
}

.resize-handle-vertical:hover {
  background-color: #007acc;
}

.resize-handle-vertical::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  right: -2px;
  bottom: 0;
  cursor: col-resize;
}

.results-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-color: #1e1e1e;
}
````

## File: src/renderer/index.html
````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QueryForge</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      height: 100vh;
      overflow: hidden;
      background-color: #1e1e1e;
      color: #cccccc;
    }
    #root {
      height: 100vh;
      width: 100vw;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>
````

## File: src/shared/types/bigquery.ts
````typescript
/**
 * BigQuery-related types and error interfaces
 */

export interface IPCError {
  code: string; // Error code (e.g., 'BIGQUERY_ERROR', 'QUERY_NOT_FOUND')
  message: string; // Human-readable error message
  details?: any; // Additional error details
}

// BigQuery error codes
export enum BigQueryErrorCode {
  BIGQUERY_ERROR = 'BIGQUERY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  CANCEL_FAILED = 'CANCEL_FAILED',
  QUERY_NOT_FOUND = 'QUERY_NOT_FOUND',
  INVALID_NAME = 'INVALID_NAME',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  STORAGE_ERROR = 'STORAGE_ERROR',
}
````

## File: src/shared/types/dataset.ts
````typescript
/**
 * Dataset and Table types for BigQuery
 */

export interface Dataset {
  id: string;
  name: string;
  location: string;
}

export interface Table {
  id: string;
  name: string;
  type: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL';
}
````

## File: src/shared/utils/connection-validation.ts
````typescript
import type { ConnectionConfig } from '../types/connection';

/**
 * Validates GCP project ID format
 */
export function isValidProjectId(projectId: string): boolean {
  // GCP project IDs: 6-30 characters, lowercase letters, numbers, hyphens
  // Must start with a lowercase letter
  const projectIdRegex = /^[a-z][a-z0-9-]{5,29}$/;
  return projectIdRegex.test(projectId);
}

/**
 * Validates connection configuration
 */
export function validateConnectionConfig(config: ConnectionConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.projectId || config.projectId.trim() === '') {
    return { valid: false, error: 'Project ID is required' };
  }

  if (!isValidProjectId(config.projectId)) {
    return {
      valid: false,
      error: 'Invalid project ID format. Project IDs must be 6-30 characters, start with a lowercase letter, and contain only lowercase letters, numbers, and hyphens.',
    };
  }

  if (config.authType === 'service-account') {
    if (!config.serviceAccountKeyPath && !config.serviceAccountKey) {
      return {
        valid: false,
        error: 'Service account key path or key content is required for service account authentication',
      };
    }

    if (config.serviceAccountKey) {
      try {
        JSON.parse(config.serviceAccountKey);
      } catch (e) {
        return {
          valid: false,
          error: 'Service account key must be valid JSON',
        };
      }
    }
  }

  return { valid: true };
}
````

## File: tests/integration/connection-integration.test.tsx
````typescript
/**
 * Integration tests for connection flow
 * Tests the interaction between ConnectionDialog, connection store, and electronAPI
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { useConnectionStore } from '../../src/renderer/stores/connection-store';
import { validateConnectionConfig } from '../../src/shared/utils/connection-validation';

describe('Connection Flow Integration', () => {
  beforeEach(() => {
    // Reset connection store
    act(() => {
      useConnectionStore.getState().clearConnection();
    });

    // Reset mocks
    jest.clearAllMocks();
    (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.connection.configure as jest.Mock).mockResolvedValue(undefined);
    (window.electronAPI.connection.getActive as jest.Mock).mockResolvedValue({
      projectId: 'test-project',
      authType: 'application-default',
      location: 'EU',
      isActive: true,
    });
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(null);
  });

  describe('Connection Validation', () => {
    it('should validate project ID format', () => {
      // Valid project IDs
      expect(validateConnectionConfig({
        projectId: 'my-project-123',
        authType: 'application-default',
      }).valid).toBe(true);

      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'application-default',
      }).valid).toBe(true);

      // Invalid project IDs
      expect(validateConnectionConfig({
        projectId: 'InvalidProject',
        authType: 'application-default',
      }).valid).toBe(false);

      expect(validateConnectionConfig({
        projectId: '123-invalid',
        authType: 'application-default',
      }).valid).toBe(false);

      expect(validateConnectionConfig({
        projectId: '',
        authType: 'application-default',
      }).valid).toBe(false);
    });

    it('should validate service account configuration', () => {
      // Missing key path and key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
      }).valid).toBe(false);

      // With key path
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKeyPath: '/path/to/key.json',
      }).valid).toBe(true);

      // With valid key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKey: JSON.stringify({ type: 'service_account' }),
      }).valid).toBe(true);

      // With invalid key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKey: 'not-json',
      }).valid).toBe(false);
    });
  });

  describe('Connection Store State Management', () => {
    it('should update store state when connection is set', () => {
      const connection = {
        projectId: 'test-project',
        authType: 'application-default' as const,
        location: 'EU',
        isActive: true,
      };

      act(() => {
        useConnectionStore.getState().setConnection(connection);
      });

      expect(useConnectionStore.getState().connection).toEqual(connection);
      expect(useConnectionStore.getState().connectionError).toBeNull();
      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should clear error when connection is successful', () => {
      // Set an error first
      act(() => {
        useConnectionStore.getState().setConnectionError('Previous error');
      });

      expect(useConnectionStore.getState().connectionError).toBe('Previous error');

      // Set a successful connection
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      expect(useConnectionStore.getState().connectionError).toBeNull();
    });

    it('should set isConnecting to false when error occurs', () => {
      // Start connecting
      act(() => {
        useConnectionStore.getState().setConnecting(true);
      });

      expect(useConnectionStore.getState().isConnecting).toBe(true);

      // Set error
      act(() => {
        useConnectionStore.getState().setConnectionError('Connection failed');
      });

      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should clear all state when clearConnection is called', () => {
      // Set up some state
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
        useConnectionStore.getState().setConnecting(true);
        useConnectionStore.getState().setConnectionError('Some error');
      });

      // Clear connection
      act(() => {
        useConnectionStore.getState().clearConnection();
      });

      const state = useConnectionStore.getState();
      expect(state.connection).toBeNull();
      expect(state.connectionError).toBeNull();
      expect(state.isConnecting).toBe(false);
    });
  });

  describe('IPC Communication', () => {
    it('should call electronAPI.connection.test for connection validation', async () => {
      const config = {
        projectId: 'test-project',
        authType: 'application-default' as const,
      };

      await window.electronAPI.connection.test(config);

      expect(window.electronAPI.connection.test).toHaveBeenCalledWith(config);
    });

    it('should call electronAPI.connection.configure for establishing connection', async () => {
      const config = {
        projectId: 'test-project',
        authType: 'application-default' as const,
      };

      await window.electronAPI.connection.configure(config);

      expect(window.electronAPI.connection.configure).toHaveBeenCalledWith(config);
    });

    it('should retrieve active connection after configuring', async () => {
      await window.electronAPI.connection.getActive();

      expect(window.electronAPI.connection.getActive).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(false);

      const result = await window.electronAPI.connection.test({
        projectId: 'invalid-project',
        authType: 'application-default',
      });

      expect(result).toBe(false);
    });
  });

  describe('Saved Connection Restoration', () => {
    it('should restore saved connection on startup', async () => {
      const savedConnection = {
        projectId: 'saved-project',
        authType: 'application-default' as const,
        location: 'US',
        isActive: true,
      };

      (window.electronAPI.connection.restore as jest.Mock).mockResolvedValue(savedConnection);

      const restored = await window.electronAPI.connection.restore();

      expect(restored).toEqual(savedConnection);
    });

    it('should return null when no saved connection exists', async () => {
      (window.electronAPI.connection.restore as jest.Mock).mockResolvedValue(null);

      const restored = await window.electronAPI.connection.restore();

      expect(restored).toBeNull();
    });
  });
});
````

## File: tests/integration/tabs-integration.test.tsx
````typescript
/**
 * Integration tests for TabBar and tabs store interaction
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TabBar } from '../../src/renderer/components/TabBar/TabBar';
import { useTabsStore } from '../../src/renderer/stores/tabs-store';

describe('TabBar integration with tabs-store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    act(() => {
      useTabsStore.setState({
        tabs: [
          {
            id: 'tab-1',
            title: 'Query 1',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
        ],
        activeTabId: 'tab-1',
      });
    });
    
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  it('should create a new tab and update the store', () => {
    render(<TabBar />);

    const initialTabCount = useTabsStore.getState().tabs.length;

    // Click new tab button
    const newTabButton = screen.getByTitle('New Tab');
    fireEvent.click(newTabButton);

    // Check store was updated
    const newTabCount = useTabsStore.getState().tabs.length;
    expect(newTabCount).toBe(initialTabCount + 1);
  });

  it('should close a tab and update the store', () => {
    // Add a second tab first
    act(() => {
      useTabsStore.getState().createTab();
    });

    render(<TabBar />);

    const initialTabCount = useTabsStore.getState().tabs.length;
    expect(initialTabCount).toBe(2);

    // Close the first tab
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);

    // Check store was updated
    const newTabCount = useTabsStore.getState().tabs.length;
    expect(newTabCount).toBe(initialTabCount - 1);
  });

  it('should switch active tab when clicking', () => {
    // Add a second tab
    act(() => {
      useTabsStore.getState().createTab();
    });

    render(<TabBar />);

    // Get the tabs
    const tabs = useTabsStore.getState().tabs;
    const secondTabId = tabs[1].id;

    // Click the second tab
    const secondTab = screen.getByText(tabs[1].title);
    fireEvent.click(secondTab);

    // Check active tab was updated
    expect(useTabsStore.getState().activeTabId).toBe(secondTabId);
  });

  it('should reflect store changes in the UI', () => {
    render(<TabBar />);

    // Initially should show Query 1
    expect(screen.getByText('Query 1')).toBeInTheDocument();

    // Update the tab title through the store
    act(() => {
      const tabs = useTabsStore.getState().tabs;
      useTabsStore.getState().updateTab(tabs[0].id, { title: 'Updated Query' });
    });

    // Re-render to see updates (in real app this happens automatically)
    // For this test, we need to check the store state
    expect(useTabsStore.getState().tabs[0].title).toBe('Updated Query');
  });

  it('should show modified indicator when tab is modified', () => {
    render(<TabBar />);

    // Mark tab as modified through store
    act(() => {
      const tabs = useTabsStore.getState().tabs;
      useTabsStore.getState().updateTab(tabs[0].id, { isModified: true });
    });

    // The modified indicator should be visible
    // We need to re-render or the component needs to re-render on store change
    // In the actual app with Zustand, this happens automatically
    const state = useTabsStore.getState();
    expect(state.tabs[0].isModified).toBe(true);
  });

  it('should handle creating multiple tabs in sequence', () => {
    render(<TabBar />);

    const newTabButton = screen.getByTitle('New Tab');

    // Create multiple tabs
    fireEvent.click(newTabButton);
    fireEvent.click(newTabButton);
    fireEvent.click(newTabButton);

    // Should have 4 tabs total (1 initial + 3 new)
    expect(useTabsStore.getState().tabs.length).toBe(4);
  });

  it('should handle closing all but one tab', () => {
    // Start with 3 tabs
    act(() => {
      useTabsStore.setState({
        tabs: [
          { id: 'tab-1', title: 'Query 1', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-2', title: 'Query 2', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-3', title: 'Query 3', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
        ],
        activeTabId: 'tab-1',
      });
    });

    render(<TabBar />);

    // Close tabs one by one
    let closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]); // Close first tab

    closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]); // Close next first tab

    // Should have 1 tab left
    expect(useTabsStore.getState().tabs.length).toBe(1);
  });

  it('should maintain active tab state across tab operations', () => {
    act(() => {
      useTabsStore.setState({
        tabs: [
          { id: 'tab-1', title: 'Query 1', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-2', title: 'Query 2', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
        ],
        activeTabId: 'tab-2',
      });
    });

    render(<TabBar />);

    // Initial active tab should be tab-2
    expect(useTabsStore.getState().activeTabId).toBe('tab-2');

    // Close the active tab
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]); // Close tab-2

    // Active tab should switch to tab-1
    expect(useTabsStore.getState().activeTabId).toBe('tab-1');
  });
});
````

## File: tests/unit/main/query-store.test.ts
````typescript
// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../../src/shared/types/query';

// Import after mocks are set up
let getQueries: () => SavedQuery[];
let getQuery: (id: string) => SavedQuery | undefined;
let saveQuery: (input: SaveQueryInput) => SavedQuery;
let updateQuery: (id: string, updates: UpdateQueryInput) => SavedQuery;
let deleteQuery: (id: string) => void;
let searchQueries: (term: string) => SavedQuery[];

describe('query-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-import the module to reset state
    const queryStore = require('../../../src/main/storage/query-store');
    getQueries = queryStore.getQueries;
    getQuery = queryStore.getQuery;
    saveQuery = queryStore.saveQuery;
    updateQuery = queryStore.updateQuery;
    deleteQuery = queryStore.deleteQuery;
    searchQueries = queryStore.searchQueries;
  });

  describe('getQueries', () => {
    it('should return empty array when no queries exist', () => {
      mockStore.get.mockReturnValue([]);
      const result = getQueries();
      expect(result).toEqual([]);
    });

    it('should return stored queries', () => {
      const mockQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT * FROM test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(mockQueries);
      
      const result = getQueries();
      expect(result).toEqual(mockQueries);
    });

    it('should return empty array when store returns null', () => {
      mockStore.get.mockReturnValue(null);
      const result = getQueries();
      expect(result).toEqual([]);
    });
  });

  describe('getQuery', () => {
    it('should return query by id', () => {
      const mockQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT * FROM test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(mockQueries);
      
      const result = getQuery('1');
      expect(result).toEqual(mockQueries[0]);
    });

    it('should return undefined for non-existent query', () => {
      mockStore.get.mockReturnValue([]);
      
      const result = getQuery('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('saveQuery', () => {
    beforeEach(() => {
      mockStore.get.mockReturnValue([]);
    });

    it('should save a new query', () => {
      const input: SaveQueryInput = {
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        description: 'A test query',
        tags: ['test'],
      };

      const result = saveQuery(input);

      expect(result).toMatchObject({
        id: 'test-uuid-1234',
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        description: 'A test query',
        tags: ['test'],
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should trim query name', () => {
      const input: SaveQueryInput = {
        name: '  Test Query  ',
        sqlText: 'SELECT * FROM test',
      };

      const result = saveQuery(input);
      expect(result.name).toBe('Test Query');
    });

    it('should throw error for empty name', () => {
      const input: SaveQueryInput = {
        name: '',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name is required');
    });

    it('should throw error for whitespace-only name', () => {
      const input: SaveQueryInput = {
        name: '   ',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name is required');
    });

    it('should throw error for name exceeding 255 characters', () => {
      const input: SaveQueryInput = {
        name: 'a'.repeat(256),
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name must be 255 characters or less');
    });

    it('should throw error for duplicate name', () => {
      const existingQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT 1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(existingQueries);

      const input: SaveQueryInput = {
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('A query with the name "Test Query" already exists');
    });
  });

  describe('updateQuery', () => {
    const existingQuery: SavedQuery = {
      id: '1',
      name: 'Test Query',
      sqlText: 'SELECT * FROM test',
      description: 'Original description',
      tags: ['original'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockStore.get.mockReturnValue([existingQuery]);
    });

    it('should update query name', () => {
      const updates: UpdateQueryInput = {
        name: 'Updated Query',
      };

      const result = updateQuery('1', updates);

      expect(result.name).toBe('Updated Query');
      expect(result.sqlText).toBe('SELECT * FROM test');
    });

    it('should update query SQL', () => {
      const updates: UpdateQueryInput = {
        sqlText: 'SELECT 1',
      };

      const result = updateQuery('1', updates);

      expect(result.sqlText).toBe('SELECT 1');
      expect(result.name).toBe('Test Query');
    });

    it('should update multiple fields', () => {
      const updates: UpdateQueryInput = {
        name: 'Updated Query',
        sqlText: 'SELECT 1',
        description: 'Updated description',
        tags: ['updated'],
      };

      const result = updateQuery('1', updates);

      expect(result.name).toBe('Updated Query');
      expect(result.sqlText).toBe('SELECT 1');
      expect(result.description).toBe('Updated description');
      expect(result.tags).toEqual(['updated']);
    });

    it('should throw error for non-existent query', () => {
      expect(() => updateQuery('non-existent', { name: 'Test' })).toThrow(
        'Query with id "non-existent" not found'
      );
    });

    it('should throw error for empty name update', () => {
      expect(() => updateQuery('1', { name: '' })).toThrow('Query name cannot be empty');
    });

    it('should throw error for name exceeding 255 characters', () => {
      expect(() => updateQuery('1', { name: 'a'.repeat(256) })).toThrow(
        'Query name must be 255 characters or less'
      );
    });

    it('should throw error for duplicate name', () => {
      const anotherQuery: SavedQuery = {
        id: '2',
        name: 'Another Query',
        sqlText: 'SELECT 2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockStore.get.mockReturnValue([existingQuery, anotherQuery]);

      expect(() => updateQuery('1', { name: 'Another Query' })).toThrow(
        'A query with the name "Another Query" already exists'
      );
    });

    it('should update updatedAt timestamp', () => {
      const result = updateQuery('1', { description: 'New description' });

      expect(result.updatedAt).not.toBe(existingQuery.updatedAt);
    });
  });

  describe('deleteQuery', () => {
    it('should delete an existing query', () => {
      const existingQuery: SavedQuery = {
        id: '1',
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockStore.get.mockReturnValue([existingQuery]);

      deleteQuery('1');

      expect(mockStore.set).toHaveBeenCalledWith('queries', []);
    });

    it('should throw error for non-existent query', () => {
      mockStore.get.mockReturnValue([]);

      expect(() => deleteQuery('non-existent')).toThrow('Query with id "non-existent" not found');
    });
  });

  describe('searchQueries', () => {
    const queries: SavedQuery[] = [
      {
        id: '1',
        name: 'Sales Report',
        sqlText: 'SELECT * FROM sales',
        description: 'Monthly sales data',
        tags: ['report', 'monthly'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'User Analytics',
        sqlText: 'SELECT * FROM users WHERE active = true',
        description: 'Active user metrics',
        tags: ['analytics', 'users'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    beforeEach(() => {
      mockStore.get.mockReturnValue(queries);
    });

    it('should return all queries for empty search term', () => {
      const result = searchQueries('');
      expect(result).toEqual(queries);
    });

    it('should return all queries for whitespace search term', () => {
      const result = searchQueries('   ');
      expect(result).toEqual(queries);
    });

    it('should search by query name', () => {
      const result = searchQueries('sales');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should search by SQL text', () => {
      const result = searchQueries('active');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User Analytics');
    });

    it('should search by description', () => {
      const result = searchQueries('metrics');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User Analytics');
    });

    it('should search by tags', () => {
      const result = searchQueries('report');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should be case-insensitive', () => {
      const result = searchQueries('SALES');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should return empty array for no matches', () => {
      const result = searchQueries('nonexistent');
      expect(result).toEqual([]);
    });
  });
});
````

## File: tests/unit/main/tabs-store.test.ts
````typescript
// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

import type { QueryTab } from '../../../src/shared/types/query';

// Import after mocks are set up
let getTabs: () => QueryTab[];
let getActiveTabId: () => string | null;
let saveTabs: (tabs: QueryTab[], activeTabId: string | null) => void;

describe('tabs-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset state
    const tabsStore = require('../../../src/main/storage/tabs-store');
    getTabs = tabsStore.getTabs;
    getActiveTabId = tabsStore.getActiveTabId;
    saveTabs = tabsStore.saveTabs;
  });

  describe('getTabs', () => {
    it('should return empty array when no tabs exist', () => {
      mockStore.get.mockReturnValue([]);
      const result = getTabs();
      expect(result).toEqual([]);
    });

    it('should return empty array when store returns null', () => {
      mockStore.get.mockReturnValue(null);
      const result = getTabs();
      expect(result).toEqual([]);
    });

    it('should return tabs with undefined results', () => {
      const persistedTabs = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'idle',
        },
      ];
      mockStore.get.mockReturnValue(persistedTabs);

      const result = getTabs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tab-1');
      expect(result[0].results).toBeUndefined();
    });

    it('should preserve all tab properties except results', () => {
      const persistedTabs = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT * FROM test',
          isModified: true,
          executionStatus: 'completed',
          jobId: 'job-123',
          error: undefined,
          lastExecuted: '2024-01-01T00:00:00Z',
          savedQueryId: 'saved-1',
        },
      ];
      mockStore.get.mockReturnValue(persistedTabs);

      const result = getTabs();

      expect(result[0]).toMatchObject({
        id: 'tab-1',
        title: 'Query 1',
        type: 'query',
        queryText: 'SELECT * FROM test',
        isModified: true,
        executionStatus: 'completed',
        jobId: 'job-123',
        lastExecuted: '2024-01-01T00:00:00Z',
        savedQueryId: 'saved-1',
      });
    });
  });

  describe('getActiveTabId', () => {
    it('should return null when no active tab', () => {
      mockStore.get.mockReturnValue(null);
      const result = getActiveTabId();
      expect(result).toBeNull();
    });

    it('should return active tab id', () => {
      mockStore.get.mockReturnValue('tab-1');
      const result = getActiveTabId();
      expect(result).toBe('tab-1');
    });
  });

  describe('saveTabs', () => {
    it('should save tabs without results', () => {
      const tabs: QueryTab[] = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'completed',
          results: {
            columns: [{ name: 'col', type: 'INTEGER' }],
            rows: [{ values: [1] }],
            totalRows: 1,
            rowsReturned: 1,
            executionTimeMs: 100,
            jobId: 'job-1',
            hasMore: false,
          },
        },
      ];

      saveTabs(tabs, 'tab-1');

      expect(mockStore.set).toHaveBeenCalledWith('tabs', [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'completed',
        },
      ]);
    });

    it('should save active tab id', () => {
      saveTabs([], 'tab-1');

      expect(mockStore.set).toHaveBeenCalledWith('activeTabId', 'tab-1');
    });

    it('should save null active tab id', () => {
      saveTabs([], null);

      expect(mockStore.set).toHaveBeenCalledWith('activeTabId', null);
    });

    it('should save multiple tabs', () => {
      const tabs: QueryTab[] = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'idle',
        },
        {
          id: 'tab-2',
          title: 'Query 2',
          type: 'query',
          queryText: 'SELECT 2',
          isModified: true,
          executionStatus: 'idle',
        },
      ];

      saveTabs(tabs, 'tab-2');

      const savedTabs = mockStore.set.mock.calls.find((call) => call[0] === 'tabs')?.[1];
      expect(savedTabs).toHaveLength(2);
      expect(savedTabs[0].id).toBe('tab-1');
      expect(savedTabs[1].id).toBe('tab-2');
    });
  });
});
````

## File: tests/unit/main/ui-settings-store.test.ts
````typescript
// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

// Import after mocks are set up
let getLeftSidebarWidth: () => number;
let setLeftSidebarWidth: (width: number) => void;
let getRightSidebarWidth: () => number;
let setRightSidebarWidth: (width: number) => void;
let getWindowBounds: () => { width: number; height: number; x?: number; y?: number } | undefined;
let setWindowBounds: (bounds: { width: number; height: number; x?: number; y?: number }) => void;

describe('ui-settings-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset state
    const uiSettingsStore = require('../../../src/main/storage/ui-settings-store');
    getLeftSidebarWidth = uiSettingsStore.getLeftSidebarWidth;
    setLeftSidebarWidth = uiSettingsStore.setLeftSidebarWidth;
    getRightSidebarWidth = uiSettingsStore.getRightSidebarWidth;
    setRightSidebarWidth = uiSettingsStore.setRightSidebarWidth;
    getWindowBounds = uiSettingsStore.getWindowBounds;
    setWindowBounds = uiSettingsStore.setWindowBounds;
  });

  describe('getLeftSidebarWidth', () => {
    it('should return stored width', () => {
      mockStore.get.mockReturnValue(300);
      const result = getLeftSidebarWidth();
      expect(result).toBe(300);
    });

    it('should return default width when no value is stored', () => {
      mockStore.get.mockReturnValue(null);
      const result = getLeftSidebarWidth();
      expect(result).toBe(250);
    });

    it('should return default width when store returns 0', () => {
      mockStore.get.mockReturnValue(0);
      const result = getLeftSidebarWidth();
      expect(result).toBe(250);
    });
  });

  describe('setLeftSidebarWidth', () => {
    it('should save width to store', () => {
      setLeftSidebarWidth(350);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 350);
    });

    it('should save minimum width', () => {
      setLeftSidebarWidth(100);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 100);
    });

    it('should save large width', () => {
      setLeftSidebarWidth(500);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 500);
    });
  });

  describe('getRightSidebarWidth', () => {
    it('should return stored width', () => {
      mockStore.get.mockReturnValue(400);
      const result = getRightSidebarWidth();
      expect(result).toBe(400);
    });

    it('should return default width when no value is stored', () => {
      mockStore.get.mockReturnValue(null);
      const result = getRightSidebarWidth();
      expect(result).toBe(300);
    });

    it('should return default width when store returns 0', () => {
      mockStore.get.mockReturnValue(0);
      const result = getRightSidebarWidth();
      expect(result).toBe(300);
    });
  });

  describe('setRightSidebarWidth', () => {
    it('should save width to store', () => {
      setRightSidebarWidth(450);
      expect(mockStore.set).toHaveBeenCalledWith('rightSidebarWidth', 450);
    });
  });

  describe('getWindowBounds', () => {
    it('should return stored window bounds', () => {
      const bounds = { width: 1400, height: 900, x: 100, y: 50 };
      mockStore.get.mockReturnValue(bounds);
      
      const result = getWindowBounds();
      expect(result).toEqual(bounds);
    });

    it('should return undefined when no bounds are stored', () => {
      mockStore.get.mockReturnValue(undefined);
      
      const result = getWindowBounds();
      expect(result).toBeUndefined();
    });

    it('should return bounds without position', () => {
      const bounds = { width: 1400, height: 900 };
      mockStore.get.mockReturnValue(bounds);
      
      const result = getWindowBounds();
      expect(result).toEqual(bounds);
    });
  });

  describe('setWindowBounds', () => {
    it('should save window bounds with position', () => {
      const bounds = { width: 1400, height: 900, x: 100, y: 50 };
      setWindowBounds(bounds);
      
      expect(mockStore.set).toHaveBeenCalledWith('windowBounds', bounds);
    });

    it('should save window bounds without position', () => {
      const bounds = { width: 1400, height: 900 };
      setWindowBounds(bounds);
      
      expect(mockStore.set).toHaveBeenCalledWith('windowBounds', bounds);
    });
  });
});
````

## File: tests/unit/renderer/components/ConnectionDialog.test.tsx
````typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionDialog } from '../../../../src/renderer/components/ConnectionDialog/ConnectionDialog';

// Mock the stores
jest.mock('../../../../src/renderer/stores/connection-store', () => ({
  useConnectionStore: () => ({
    setConnection: jest.fn(),
    setConnecting: jest.fn(),
    setConnectionError: jest.fn(),
  }),
}));

// Mock validateConnectionConfig
jest.mock('../../../../src/shared/utils/connection-validation', () => ({
  validateConnectionConfig: jest.fn(() => ({ valid: true })),
}));

describe('ConnectionDialog', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset electronAPI mocks
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(null);
    (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.connection.configure as jest.Mock).mockResolvedValue(undefined);
    (window.electronAPI.connection.getActive as jest.Mock).mockResolvedValue({
      projectId: 'test-project',
      authType: 'application-default',
      location: 'EU',
      isActive: true,
    });
  });

  it('should render the dialog', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByText('Connect to BigQuery')).toBeInTheDocument();
  });

  it('should render project ID input', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/project id/i)).toBeInTheDocument();
  });

  it('should render location dropdown', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it('should render authentication method dropdown', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/authentication method/i)).toBeInTheDocument();
  });

  it('should show service account fields when service-account auth is selected', async () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    // Service account is the default, so the fields should be visible
    expect(screen.getByLabelText(/service account key file path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste service account key json/i)).toBeInTheDocument();
  });

  it('should hide service account fields when application-default is selected', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    expect(screen.queryByLabelText(/service account key file path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/paste service account key json/i)).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const overlay = document.querySelector('.connection-dialog-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call onClose when clicking dialog content', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const dialog = document.querySelector('.connection-dialog');
    fireEvent.click(dialog!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable connect button when project ID is empty', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).toBeDisabled();
  });

  it('should enable connect button when project ID is provided', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'my-test-project');

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).not.toBeDisabled();
  });

  it('should load saved connection on mount', async () => {
    const savedConnection = {
      projectId: 'saved-project',
      authType: 'service-account' as const,
      serviceAccountKeyPath: '/path/to/key.json',
      location: 'US',
      enableDbtSupport: true,
    };
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(savedConnection);

    render(<ConnectionDialog onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/project id/i)).toHaveValue('saved-project');
    });
  });

  it('should show dbt support checkbox', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/enable dbt syntax support/i)).toBeInTheDocument();
  });

  it('should toggle dbt support checkbox', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const dbtCheckbox = screen.getByLabelText(/enable dbt syntax support/i);
    expect(dbtCheckbox).not.toBeChecked();

    await user.click(dbtCheckbox);
    expect(dbtCheckbox).toBeChecked();
  });

  it('should attempt connection when connect button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    // Select application-default auth to avoid service account validation
    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    // Enter project ID
    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'my-test-project');

    // Click connect
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    await waitFor(() => {
      expect(window.electronAPI.connection.test).toHaveBeenCalled();
    });
  });

  it('should show error message when connection fails', async () => {
    const user = userEvent.setup();
    const { validateConnectionConfig } = require('../../../../src/shared/utils/connection-validation');
    validateConnectionConfig.mockReturnValue({ valid: false, error: 'Invalid project ID' });

    render(<ConnectionDialog onClose={mockOnClose} />);

    // Select application-default auth
    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    // Enter project ID
    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'invalid');

    // Click connect
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid project ID')).toBeInTheDocument();
    });
  });
});
````

## File: tests/unit/renderer/components/ErrorBoundary.test.tsx
````typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../../src/renderer/components/ErrorBoundary/ErrorBoundary';

// A component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('should display error message in details', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // The error message should be in the details element
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should have a reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload application/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it('should not catch errors from event handlers', () => {
    // ErrorBoundary only catches errors during rendering, not event handlers
    const ClickError: React.FC = () => {
      const handleClick = () => {
        throw new Error('Click error');
      };
      return <button onClick={handleClick}>Click me</button>;
    };

    render(
      <ErrorBoundary>
        <ClickError />
      </ErrorBoundary>
    );

    // The component should render normally
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should render multiple children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});
````

## File: tests/unit/renderer/components/SidebarHeader.test.tsx
````typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarHeader } from '../../../../src/renderer/components/SidebarHeader/SidebarHeader';

describe('SidebarHeader', () => {
  const mockOnToggleCollapse = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('expanded state', () => {
    it('should render collapse button when expanded', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.getByTitle('Collapse')).toBeInTheDocument();
    });

    it('should call onToggleCollapse when collapse button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      fireEvent.click(screen.getByTitle('Collapse'));
      expect(mockOnToggleCollapse).toHaveBeenCalled();
    });

    it('should render refresh button when onRefresh is provided', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByTitle('Refresh')).toBeInTheDocument();
    });

    it('should not render refresh button when onRefresh is not provided', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      fireEvent.click(screen.getByTitle('Refresh'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should disable refresh button when isLoading is true', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
          isLoading={true}
        />
      );

      expect(screen.getByTitle('Refresh')).toBeDisabled();
    });

    it('should enable refresh button when isLoading is false', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
          isLoading={false}
        />
      );

      expect(screen.getByTitle('Refresh')).not.toBeDisabled();
    });
  });

  describe('collapsed state', () => {
    it('should render expand button when collapsed', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.getByTitle('Expand')).toBeInTheDocument();
    });

    it('should call onToggleCollapse when expand button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      fireEvent.click(screen.getByTitle('Expand'));
      expect(mockOnToggleCollapse).toHaveBeenCalled();
    });

    it('should not render refresh button when collapsed', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument();
    });

    it('should have collapsed class', () => {
      const { container } = render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(container.querySelector('.sidebar-header-collapsed')).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('should default collapsed to false', () => {
      render(<SidebarHeader onToggleCollapse={mockOnToggleCollapse} />);

      expect(screen.getByTitle('Collapse')).toBeInTheDocument();
    });

    it('should default isLoading to false', () => {
      render(
        <SidebarHeader
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByTitle('Refresh')).not.toBeDisabled();
    });
  });
});
````

## File: tests/unit/renderer/components/SidebarSwitcher.test.tsx
````typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarSwitcher, SidebarView } from '../../../../src/renderer/components/SidebarSwitcher/SidebarSwitcher';

describe('SidebarSwitcher', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both buttons', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved queries/i })).toBeInTheDocument();
  });

  it('should highlight explorer button when current view is explorer', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });

    expect(explorerButton).toHaveClass('active');
    expect(savedQueriesButton).not.toHaveClass('active');
  });

  it('should highlight saved queries button when current view is saved-queries', () => {
    render(
      <SidebarSwitcher currentView="saved-queries" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });

    expect(explorerButton).not.toHaveClass('active');
    expect(savedQueriesButton).toHaveClass('active');
  });

  it('should call onViewChange with "explorer" when explorer button is clicked', () => {
    render(
      <SidebarSwitcher currentView="saved-queries" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    fireEvent.click(explorerButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('explorer');
  });

  it('should call onViewChange with "saved-queries" when saved queries button is clicked', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });
    fireEvent.click(savedQueriesButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('saved-queries');
  });

  it('should not render when collapsed is true', () => {
    render(
      <SidebarSwitcher
        currentView="explorer"
        onViewChange={mockOnViewChange}
        collapsed={true}
      />
    );

    expect(screen.queryByRole('button', { name: /explorer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /saved queries/i })).not.toBeInTheDocument();
  });

  it('should render when collapsed is false', () => {
    render(
      <SidebarSwitcher
        currentView="explorer"
        onViewChange={mockOnViewChange}
        collapsed={false}
      />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved queries/i })).toBeInTheDocument();
  });

  it('should render when collapsed is not provided', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
  });

  it('should have correct title attributes', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByTitle('Explorer')).toBeInTheDocument();
    expect(screen.getByTitle('Saved Queries')).toBeInTheDocument();
  });
});
````

## File: tests/unit/renderer/components/TabBar.test.tsx
````typescript
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TabBar } from '../../../../src/renderer/components/TabBar/TabBar';
import { useTabsStore } from '../../../../src/renderer/stores/tabs-store';

// Mock the tabs store
jest.mock('../../../../src/renderer/stores/tabs-store', () => ({
  useTabsStore: jest.fn(),
}));

const mockUseTabsStore = useTabsStore as jest.MockedFunction<typeof useTabsStore>;

describe('TabBar', () => {
  const mockTabs = [
    { id: 'tab-1', title: 'Query 1', type: 'query' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
    { id: 'tab-2', title: 'Query 2', type: 'query' as const, queryText: '', isModified: true, executionStatus: 'idle' as const },
    { id: 'tab-3', title: 'Query 3', type: 'query' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
  ];

  const mockSetActiveTab = jest.fn();
  const mockCloseTab = jest.fn();
  const mockCreateTab = jest.fn();
  const mockReorderTabs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTabsStore.mockReturnValue({
      tabs: mockTabs,
      activeTabId: 'tab-1',
      setActiveTab: mockSetActiveTab,
      closeTab: mockCloseTab,
      createTab: mockCreateTab,
      reorderTabs: mockReorderTabs,
      updateTab: jest.fn(),
      setTabQuery: jest.fn(),
      setTabResults: jest.fn(),
      setTabError: jest.fn(),
      setTabStatus: jest.fn(),
      loadTabs: jest.fn(),
      saveTabs: jest.fn(),
    });
  });

  it('should render all query tabs', () => {
    render(<TabBar />);

    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Query 2')).toBeInTheDocument();
    expect(screen.getByText('Query 3')).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<TabBar />);

    const activeTab = screen.getByText('Query 1').closest('.tab');
    expect(activeTab).toHaveClass('active');
  });

  it('should show modified indicator for modified tabs', () => {
    render(<TabBar />);

    // The modified tab should have a modified indicator
    const modifiedTab = screen.getByText('Query 2').closest('.tab');
    expect(modifiedTab).toHaveClass('modified');
    
    // Check for the modified indicator
    const modifiedIndicator = screen.getByText('●');
    expect(modifiedIndicator).toBeInTheDocument();
  });

  it('should call setActiveTab when clicking a tab', () => {
    render(<TabBar />);

    fireEvent.click(screen.getByText('Query 2'));

    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-2');
  });

  it('should call createTab when clicking new tab button', () => {
    render(<TabBar />);

    const newTabButton = screen.getByTitle('New Tab');
    fireEvent.click(newTabButton);

    expect(mockCreateTab).toHaveBeenCalled();
  });

  it('should call closeTab when clicking close button', () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    render(<TabBar />);

    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);

    expect(mockCloseTab).toHaveBeenCalledWith('tab-1');
  });

  it('should prompt confirmation when closing a modified tab', () => {
    window.confirm = jest.fn().mockReturnValue(true);

    render(<TabBar />);

    // Click close on the modified tab (tab-2)
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]); // Second close button for tab-2

    expect(window.confirm).toHaveBeenCalledWith(
      'This tab has unsaved changes. Are you sure you want to close it?'
    );
    expect(mockCloseTab).toHaveBeenCalledWith('tab-2');
  });

  it('should not close modified tab when confirmation is cancelled', () => {
    window.confirm = jest.fn().mockReturnValue(false);

    render(<TabBar />);

    // Click close on the modified tab (tab-2)
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockCloseTab).not.toHaveBeenCalled();
  });

  it('should not show explorer or saved-queries tabs', () => {
    mockUseTabsStore.mockReturnValue({
      tabs: [
        ...mockTabs,
        { id: 'explorer', title: 'Explorer', type: 'explorer' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
        { id: 'saved', title: 'Saved Queries', type: 'saved-queries' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
      ],
      activeTabId: 'tab-1',
      setActiveTab: mockSetActiveTab,
      closeTab: mockCloseTab,
      createTab: mockCreateTab,
      reorderTabs: mockReorderTabs,
      updateTab: jest.fn(),
      setTabQuery: jest.fn(),
      setTabResults: jest.fn(),
      setTabError: jest.fn(),
      setTabStatus: jest.fn(),
      loadTabs: jest.fn(),
      saveTabs: jest.fn(),
    });

    render(<TabBar />);

    expect(screen.queryByText('Explorer')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();
  });

  describe('drag and drop', () => {
    it('should set dragging class on drag start', () => {
      render(<TabBar />);

      const tab = screen.getByText('Query 1').closest('.tab');
      
      fireEvent.dragStart(tab!, {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
          setDragImage: jest.fn(),
        },
      });

      expect(tab).toHaveClass('dragging');
    });

    it('should clear dragging class on drag end', () => {
      render(<TabBar />);

      const tab = screen.getByText('Query 1').closest('.tab');
      
      fireEvent.dragStart(tab!, {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
          setDragImage: jest.fn(),
        },
      });

      fireEvent.dragEnd(tab!);

      expect(tab).not.toHaveClass('dragging');
    });
  });
});
````

## File: tests/unit/renderer/hooks/useBigQuery.test.ts
````typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBigQuery } from '../../../../src/renderer/hooks/useBigQuery';
import { useConnectionStore } from '../../../../src/renderer/stores/connection-store';

describe('useBigQuery', () => {
  beforeEach(() => {
    // Reset connection store
    act(() => {
      useConnectionStore.getState().clearConnection();
    });

    // Reset mocks
    jest.clearAllMocks();
    (window.electronAPI.bigquery.execute as jest.Mock).mockResolvedValue({
      columns: [{ name: 'col1', type: 'STRING' }],
      rows: [{ values: ['value1'] }],
      totalRows: 1,
      rowsReturned: 1,
      executionTimeMs: 100,
      jobId: 'job-123',
      hasMore: false,
    });
    (window.electronAPI.bigquery.cancel as jest.Mock).mockResolvedValue(undefined);
  });

  describe('isConnected', () => {
    it('should return false when no connection', () => {
      const { result } = renderHook(() => useBigQuery());
      expect(result.current.isConnected).toBe(false);
    });

    it('should return true when connected', () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('executeQuery', () => {
    it('should throw error when no connection', async () => {
      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.executeQuery('SELECT 1')).rejects.toThrow('No active connection');
    });

    it('should execute query when connected', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      const queryResult = await result.current.executeQuery('SELECT 1');

      expect(window.electronAPI.bigquery.execute).toHaveBeenCalledWith('SELECT 1', 'test-project');
      expect(queryResult.jobId).toBe('job-123');
    });

    it('should pass query text to API', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      await result.current.executeQuery('SELECT * FROM `dataset.table`');

      expect(window.electronAPI.bigquery.execute).toHaveBeenCalledWith(
        'SELECT * FROM `dataset.table`',
        'test-project'
      );
    });

    it('should return query result', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      const queryResult = await result.current.executeQuery('SELECT 1');

      expect(queryResult).toEqual({
        columns: [{ name: 'col1', type: 'STRING' }],
        rows: [{ values: ['value1'] }],
        totalRows: 1,
        rowsReturned: 1,
        executionTimeMs: 100,
        jobId: 'job-123',
        hasMore: false,
      });
    });

    it('should propagate API errors', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      (window.electronAPI.bigquery.execute as jest.Mock).mockRejectedValue(
        new Error('Query syntax error')
      );

      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.executeQuery('INVALID SQL')).rejects.toThrow('Query syntax error');
    });
  });

  describe('cancelQuery', () => {
    it('should cancel a running query', async () => {
      const { result } = renderHook(() => useBigQuery());

      await result.current.cancelQuery('job-123');

      expect(window.electronAPI.bigquery.cancel).toHaveBeenCalledWith('job-123');
    });

    it('should propagate cancel errors', async () => {
      (window.electronAPI.bigquery.cancel as jest.Mock).mockRejectedValue(
        new Error('Job not found')
      );

      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.cancelQuery('invalid-job')).rejects.toThrow('Job not found');
    });
  });

  describe('connection state changes', () => {
    it('should update isConnected when connection changes', () => {
      const { result, rerender } = renderHook(() => useBigQuery());

      expect(result.current.isConnected).toBe(false);

      // Set connection
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      rerender();
      expect(result.current.isConnected).toBe(true);

      // Clear connection
      act(() => {
        useConnectionStore.getState().clearConnection();
      });

      rerender();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
````

## File: tests/unit/renderer/stores/bigquery-metadata-store.test.ts
````typescript
import { act, renderHook } from '@testing-library/react';
import { useBigQueryMetadataStore } from '../../../../src/renderer/stores/bigquery-metadata-store';
import type { Dataset, Table } from '../../../../src/shared/types/dataset';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  tablesLoaded?: boolean;
}

describe('bigquery-metadata-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useBigQueryMetadataStore.getState().clear();
    });
  });

  describe('initial state', () => {
    it('should have empty datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.datasets).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have no error', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.error).toBeNull();
    });
  });

  describe('setDatasets', () => {
    it('should set datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      expect(result.current.datasets).toEqual(datasets);
    });

    it('should replace existing datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const initialDatasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(initialDatasets);
      });

      const newDatasets: DatasetWithTables[] = [
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      act(() => {
        result.current.setDatasets(newDatasets);
      });

      expect(result.current.datasets).toEqual(newDatasets);
    });
  });

  describe('setDatasetTables', () => {
    it('should set tables for a dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
        { id: 'table2', name: 'Table 2', type: 'VIEW' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.setDatasetTables('dataset1', tables);
      });

      expect(result.current.datasets[0].tables).toEqual(tables);
      expect(result.current.datasets[0].tablesLoaded).toBe(true);
    });

    it('should not affect other datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.setDatasetTables('dataset1', tables);
      });

      expect(result.current.datasets[1].tables).toBeUndefined();
      expect(result.current.datasets[1].tablesLoaded).toBeUndefined();
    });
  });

  describe('getDatasetTables', () => {
    it('should return tables for a dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
      ];

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU', tables },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const result2 = result.current.getDatasetTables('dataset1');
      expect(result2).toEqual(tables);
    });

    it('should return undefined for non-existent dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const tables = result.current.getDatasetTables('non-existent');
      expect(tables).toBeUndefined();
    });

    it('should return undefined when tables not loaded', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const tables = result.current.getDatasetTables('dataset1');
      expect(tables).toBeUndefined();
    });
  });

  describe('getAllTables', () => {
    it('should return all tables from all datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const table1: Table = { id: 'table1', name: 'Table 1', type: 'TABLE' };
      const table2: Table = { id: 'table2', name: 'Table 2', type: 'VIEW' };
      const table3: Table = { id: 'table3', name: 'Table 3', type: 'TABLE' };

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU', tables: [table1, table2] },
        { id: 'dataset2', name: 'Dataset 2', location: 'US', tables: [table3] },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const allTables = result.current.getAllTables();
      
      expect(allTables).toHaveLength(3);
      expect(allTables).toContainEqual({ dataset: 'dataset1', table: table1 });
      expect(allTables).toContainEqual({ dataset: 'dataset1', table: table2 });
      expect(allTables).toContainEqual({ dataset: 'dataset2', table: table3 });
    });

    it('should return empty array when no tables loaded', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const allTables = result.current.getAllTables();
      expect(allTables).toEqual([]);
    });

    it('should return empty array when no datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const allTables = result.current.getAllTables();
      expect(allTables).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.datasets).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('state persistence across hooks', () => {
    it('should share state between multiple hooks', () => {
      const { result: hook1 } = renderHook(() => useBigQueryMetadataStore());
      const { result: hook2 } = renderHook(() => useBigQueryMetadataStore());

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        hook1.current.setDatasets(datasets);
      });

      expect(hook2.current.datasets).toEqual(datasets);
    });
  });
});
````

## File: tests/unit/renderer/stores/connection-store.test.ts
````typescript
import { act, renderHook } from '@testing-library/react';
import { useConnectionStore } from '../../../../src/renderer/stores/connection-store';
import type { ConnectionConfiguration } from '../../../../src/shared/types/connection';

describe('connection-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useConnectionStore.getState().clearConnection();
    });
  });

  describe('initial state', () => {
    it('should have null connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.connection).toBeNull();
    });

    it('should not be connecting', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.isConnecting).toBe(false);
    });

    it('should have no connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('setConnection', () => {
    it('should set the connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
        lastConnected: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.connection).toEqual(connection);
    });

    it('should clear connection error when setting connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Previous error');
      });

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.connectionError).toBeNull();
    });

    it('should set isConnecting to false when setting connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('clearConnection', () => {
    it('should clear the connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.connection).toBeNull();
    });

    it('should clear connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Some error');
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.connectionError).toBeNull();
    });

    it('should set isConnecting to false', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('setConnecting', () => {
    it('should set isConnecting to true', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      expect(result.current.isConnecting).toBe(true);
    });

    it('should set isConnecting to false', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.setConnecting(false);
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('setConnectionError', () => {
    it('should set connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Connection failed');
      });

      expect(result.current.connectionError).toBe('Connection failed');
    });

    it('should set isConnecting to false when error is set', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.setConnectionError('Connection failed');
      });

      expect(result.current.isConnecting).toBe(false);
    });

    it('should clear connection error when null is passed', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Some error');
      });

      act(() => {
        result.current.setConnectionError(null);
      });

      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('state persistence across hooks', () => {
    it('should share state between multiple hooks', () => {
      const { result: hook1 } = renderHook(() => useConnectionStore());
      const { result: hook2 } = renderHook(() => useConnectionStore());

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        hook1.current.setConnection(connection);
      });

      expect(hook2.current.connection).toEqual(connection);
    });
  });
});
````

## File: tests/unit/renderer/stores/queries-store.test.ts
````typescript
import { act, renderHook, waitFor } from '@testing-library/react';
import { useQueriesStore } from '../../../../src/renderer/stores/queries-store';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../../../src/shared/types/query';

describe('queries-store', () => {
  const mockQueries: SavedQuery[] = [
    {
      id: '1',
      name: 'Sales Report',
      sqlText: 'SELECT * FROM sales',
      description: 'Monthly sales data',
      tags: ['report', 'monthly'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'User Analytics',
      sqlText: 'SELECT * FROM users WHERE active = true',
      description: 'Active user metrics',
      tags: ['analytics', 'users'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset store state before each test
    useQueriesStore.setState({
      queries: [],
      isLoading: false,
      searchTerm: '',
    });
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Setup default mock responses
    (window.electronAPI.queries.list as jest.Mock).mockResolvedValue(mockQueries);
    (window.electronAPI.queries.save as jest.Mock).mockImplementation(async (input: SaveQueryInput) => ({
      id: 'new-id',
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    (window.electronAPI.queries.update as jest.Mock).mockImplementation(
      async (id: string, updates: UpdateQueryInput) => ({
        ...mockQueries.find((q) => q.id === id),
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    );
    (window.electronAPI.queries.delete as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty queries', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.queries).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have empty search term', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.searchTerm).toBe('');
    });
  });

  describe('loadQueries', () => {
    it('should load queries from API', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.loadQueries();
      });

      expect(result.current.queries).toEqual(mockQueries);
      expect(window.electronAPI.queries.list).toHaveBeenCalled();
    });

    it('should set isLoading during load', async () => {
      const { result } = renderHook(() => useQueriesStore());

      // Start the load
      let loadPromise: Promise<void>;
      act(() => {
        loadPromise = result.current.loadQueries();
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when electronAPI is not available', async () => {
      const { result } = renderHook(() => useQueriesStore());
      
      // Temporarily remove electronAPI
      const originalElectronAPI = window.electronAPI;
      delete (window as any).electronAPI;

      await expect(
        act(async () => {
          await result.current.loadQueries();
        })
      ).rejects.toThrow('Electron API not available');

      // Restore electronAPI
      (window as any).electronAPI = originalElectronAPI;
    });

    it('should set isLoading to false on error', async () => {
      const { result } = renderHook(() => useQueriesStore());
      
      (window.electronAPI.queries.list as jest.Mock).mockRejectedValue(new Error('Load failed'));

      try {
        await act(async () => {
          await result.current.loadQueries();
        });
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('saveQuery', () => {
    it('should save a new query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const input: SaveQueryInput = {
        name: 'New Query',
        sqlText: 'SELECT 1',
        description: 'A new query',
        tags: ['new'],
      };

      let savedQuery: SavedQuery;
      await act(async () => {
        savedQuery = await result.current.saveQuery(input);
      });

      expect(savedQuery!).toMatchObject({
        id: 'new-id',
        name: 'New Query',
        sqlText: 'SELECT 1',
      });
      expect(result.current.queries).toContainEqual(expect.objectContaining({ id: 'new-id' }));
    });

    it('should call API to save query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const input: SaveQueryInput = {
        name: 'New Query',
        sqlText: 'SELECT 1',
      };

      await act(async () => {
        await result.current.saveQuery(input);
      });

      expect(window.electronAPI.queries.save).toHaveBeenCalledWith(input);
    });
  });

  describe('updateQuery', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should update an existing query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const updates: UpdateQueryInput = {
        name: 'Updated Sales Report',
      };

      await act(async () => {
        await result.current.updateQuery('1', updates);
      });

      expect(result.current.queries.find((q) => q.id === '1')?.name).toBe('Updated Sales Report');
    });

    it('should call API to update query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const updates: UpdateQueryInput = {
        sqlText: 'SELECT * FROM new_table',
      };

      await act(async () => {
        await result.current.updateQuery('1', updates);
      });

      expect(window.electronAPI.queries.update).toHaveBeenCalledWith('1', updates);
    });
  });

  describe('deleteQuery', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should delete a query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.deleteQuery('1');
      });

      expect(result.current.queries.find((q) => q.id === '1')).toBeUndefined();
      expect(result.current.queries).toHaveLength(1);
    });

    it('should call API to delete query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.deleteQuery('1');
      });

      expect(window.electronAPI.queries.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('setSearchTerm', () => {
    it('should set search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('sales');
      });

      expect(result.current.searchTerm).toBe('sales');
    });
  });

  describe('getFilteredQueries', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should return all queries for empty search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toEqual(mockQueries);
    });

    it('should filter queries by name', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('sales');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Sales Report');
    });

    it('should filter queries by SQL text', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('active');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('User Analytics');
    });

    it('should filter queries by description', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('metrics');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('User Analytics');
    });

    it('should filter queries by tags', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('monthly');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Sales Report');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('SALES');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
    });

    it('should return all queries for whitespace search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('   ');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toEqual(mockQueries);
    });
  });
});
````

## File: tests/unit/renderer/stores/tabs-store.test.ts
````typescript
/**
 * Additional unit tests for tabs-store
 */
import { act, renderHook } from '@testing-library/react';
import { useTabsStore } from '../../../../src/renderer/stores/tabs-store';
import type { QueryTab } from '../../../../src/shared/types/query';

describe('tabs-store additional tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useTabsStore.setState({
        tabs: [
          {
            id: 'tab-1',
            title: 'Query 1',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
          {
            id: 'tab-2',
            title: 'Query 2',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
        ],
        activeTabId: 'tab-1',
      });
    });
  });

  describe('updateTab', () => {
    it('should update tab title', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { title: 'Updated Title' });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.title).toBe('Updated Title');
    });

    it('should update tab query text', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { queryText: 'SELECT * FROM test' });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.queryText).toBe('SELECT * FROM test');
    });

    it('should update tab isModified', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { isModified: true });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.isModified).toBe(true);
    });

    it('should not affect other tabs', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { title: 'Updated' });
      });

      const otherTab = result.current.tabs.find((t) => t.id === 'tab-2');
      expect(otherTab?.title).toBe('Query 2');
    });
  });

  describe('setTabQuery', () => {
    it('should set query text', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabQuery('tab-1', 'SELECT 1');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.queryText).toBe('SELECT 1');
    });

    it('should mark tab as modified when query changes', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabQuery('tab-1', 'SELECT 1');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.isModified).toBe(true);
    });
  });

  describe('setTabResults', () => {
    it('should set results and update status to completed', () => {
      const { result } = renderHook(() => useTabsStore());

      const mockResults = {
        columns: [{ name: 'col1', type: 'STRING' }],
        rows: [{ values: ['value1'] }],
        totalRows: 1,
        rowsReturned: 1,
        executionTimeMs: 100,
        jobId: 'job-123',
        hasMore: false,
      };

      act(() => {
        result.current.setTabResults('tab-1', mockResults);
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.results).toEqual(mockResults);
      expect(tab?.executionStatus).toBe('completed');
    });
  });

  describe('setTabError', () => {
    it('should set error and update status', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabError('tab-1', 'Query failed');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.error).toBe('Query failed');
      expect(tab?.executionStatus).toBe('error');
    });
  });

  describe('setTabStatus', () => {
    it('should set execution status', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabStatus('tab-1', 'running');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.executionStatus).toBe('running');
    });
  });

  describe('reorderTabs', () => {
    it('should reorder tabs', () => {
      const { result } = renderHook(() => useTabsStore());

      const initialFirstTabId = result.current.tabs[0].id;
      const initialSecondTabId = result.current.tabs[1].id;

      act(() => {
        result.current.reorderTabs(0, 1);
      });

      expect(result.current.tabs[0].id).toBe(initialSecondTabId);
      expect(result.current.tabs[1].id).toBe(initialFirstTabId);
    });

    it('should not reorder if indices are the same', () => {
      const { result } = renderHook(() => useTabsStore());

      const tabsBefore = [...result.current.tabs];

      act(() => {
        result.current.reorderTabs(0, 0);
      });

      expect(result.current.tabs).toEqual(tabsBefore);
    });

    it('should not reorder if indices are out of bounds', () => {
      const { result } = renderHook(() => useTabsStore());

      const tabsBefore = [...result.current.tabs];

      act(() => {
        result.current.reorderTabs(-1, 0);
      });

      expect(result.current.tabs).toEqual(tabsBefore);
    });
  });

  describe('createTab', () => {
    it('should create a new tab', () => {
      const { result } = renderHook(() => useTabsStore());

      const initialCount = result.current.tabs.length;

      act(() => {
        result.current.createTab();
      });

      expect(result.current.tabs.length).toBe(initialCount + 1);
    });

    it('should set new tab as active', () => {
      const { result } = renderHook(() => useTabsStore());

      let newTabId: string;
      act(() => {
        newTabId = result.current.createTab();
      });

      expect(result.current.activeTabId).toBe(newTabId!);
    });

    it('should return the new tab id', () => {
      const { result } = renderHook(() => useTabsStore());

      let newTabId: string;
      act(() => {
        newTabId = result.current.createTab();
      });

      expect(newTabId!).toBeTruthy();
      expect(result.current.tabs.find((t) => t.id === newTabId!)).toBeTruthy();
    });
  });

  describe('closeTab', () => {
    it('should close the specified tab', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.closeTab('tab-1');
      });

      expect(result.current.tabs.find((t) => t.id === 'tab-1')).toBeUndefined();
    });

    it('should switch active tab when closing active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      // tab-1 is active
      expect(result.current.activeTabId).toBe('tab-1');

      act(() => {
        result.current.closeTab('tab-1');
      });

      // Should switch to tab-2
      expect(result.current.activeTabId).toBe('tab-2');
    });

    it('should not affect active tab when closing non-active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      expect(result.current.activeTabId).toBe('tab-1');

      act(() => {
        result.current.closeTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-1');
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setActiveTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-2');
    });
  });
});
````

## File: tests/unit/renderer/bigquery-formatter-additional.test.ts
````typescript
/**
 * Additional tests for bigquery-formatter covering more edge cases
 */
import { formatBigQueryValue } from '../../../src/renderer/utils/bigquery-formatter';

describe('bigquery-formatter - additional coverage', () => {
  describe('BOOL handling - string values', () => {
    it('should handle "1" and "0" strings for BOOL', () => {
      expect(formatBigQueryValue('1', 'BOOL')).toBe('TRUE');
      expect(formatBigQueryValue('0', 'BOOL')).toBe('FALSE');
    });
  });

  describe('BYTES handling', () => {
    it('should decode valid base64 to hex', () => {
      // "Hello" encoded in base64 is "SGVsbG8="
      const result = formatBigQueryValue('SGVsbG8=', 'BYTES');
      expect(result).toMatch(/^0x[0-9a-f]+$/);
    });

    it('should handle Uint8Array', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = formatBigQueryValue(bytes, 'BYTES');
      expect(result).toBe('0x48656c6c6f');
    });

    it('should handle number array', () => {
      const bytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
      const result = formatBigQueryValue(bytes, 'BYTES');
      expect(result).toBe('0x48656c6c6f');
    });

    it('should return invalid base64 as-is', () => {
      const result = formatBigQueryValue('not-valid-base64!!!', 'BYTES');
      expect(result).toBe('not-valid-base64!!!');
    });
  });

  describe('DATE handling', () => {
    it('should handle numeric date values', () => {
      // Days since epoch - 0 should be 1970-01-01
      const result = formatBigQueryValue(0, 'DATE');
      expect(result).toBe('1970-01-01');
    });

    it('should handle objects with year/month/day properties', () => {
      const dateObj = { year: 2024, month: 6, day: 15 };
      const result = formatBigQueryValue(dateObj, 'DATE');
      expect(result).toBe('2024-06-15');
    });

    it('should handle objects with wrapped value', () => {
      const wrapped = { value: '2024-06-15' };
      const result = formatBigQueryValue(wrapped, 'DATE');
      expect(result).toBe('2024-06-15');
    });
  });

  describe('TIME handling', () => {
    it('should format time strings', () => {
      expect(formatBigQueryValue('12:30:45', 'TIME')).toBe('12:30:45');
    });

    it('should handle time with milliseconds', () => {
      expect(formatBigQueryValue('12:30:45.123', 'TIME')).toBe('12:30:45.123');
    });
  });

  describe('TIMESTAMP handling', () => {
    it('should handle ISO timestamp strings', () => {
      const result = formatBigQueryValue('2024-06-15T12:30:45Z', 'TIMESTAMP');
      expect(result).toBe('2024-06-15T12:30:45Z');
    });

    it('should handle timestamp with timezone offset', () => {
      const result = formatBigQueryValue('2024-06-15T12:30:45+02:00', 'TIMESTAMP');
      expect(result).toBe('2024-06-15T12:30:45+02:00');
    });
  });

  describe('DATETIME handling', () => {
    it('should handle datetime strings', () => {
      const result = formatBigQueryValue('2024-06-15 12:30:45', 'DATETIME');
      expect(result).toBe('2024-06-15 12:30:45');
    });
  });

  describe('GEOGRAPHY handling', () => {
    it('should handle WKT strings', () => {
      const wkt = 'POINT(-122.4194 37.7749)';
      expect(formatBigQueryValue(wkt, 'GEOGRAPHY')).toBe(wkt);
    });

    it('should handle POLYGON', () => {
      const wkt = 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))';
      expect(formatBigQueryValue(wkt, 'GEOGRAPHY')).toBe(wkt);
    });
  });

  describe('JSON handling', () => {
    it('should handle JSON strings', () => {
      const jsonStr = '{"name": "John", "age": 30}';
      // JSON gets pretty-printed
      const result = formatBigQueryValue(jsonStr, 'JSON');
      expect(JSON.parse(result)).toEqual({ name: 'John', age: 30 });
    });

    it('should handle JSON objects', () => {
      const jsonObj = { name: 'John', age: 30 };
      const result = formatBigQueryValue(jsonObj, 'JSON');
      expect(JSON.parse(result)).toEqual(jsonObj);
    });
  });

  describe('ARRAY handling', () => {
    it('should format arrays of numbers', () => {
      const result = formatBigQueryValue([1, 2, 3], 'ARRAY');
      expect(result).toBe('[1, 2, 3]');
    });

    it('should format arrays of strings', () => {
      const result = formatBigQueryValue(['a', 'b', 'c'], 'ARRAY');
      // Formatter joins without quoting string elements
      expect(result).toBe('[a, b, c]');
    });

    it('should format nested arrays', () => {
      const result = formatBigQueryValue([[1, 2], [3, 4]], 'ARRAY');
      expect(result).toBe('[[1, 2], [3, 4]]');
    });

    it('should format empty arrays', () => {
      expect(formatBigQueryValue([], 'ARRAY')).toBe('[]');
    });
  });

  describe('STRUCT/RECORD handling', () => {
    it('should format simple structs', () => {
      const struct = { name: 'John', age: 30 };
      const result = formatBigQueryValue(struct, 'STRUCT');
      expect(JSON.parse(result)).toEqual(struct);
    });

    it('should format nested structs', () => {
      const struct = { user: { name: 'John', address: { city: 'NYC' } } };
      const result = formatBigQueryValue(struct, 'RECORD');
      expect(JSON.parse(result)).toEqual(struct);
    });
  });

  describe('INTEGER/INT64 handling', () => {
    it('should format positive integers', () => {
      expect(formatBigQueryValue(42, 'INT64')).toBe('42');
    });

    it('should format negative integers', () => {
      expect(formatBigQueryValue(-42, 'INT64')).toBe('-42');
    });

    it('should format zero', () => {
      expect(formatBigQueryValue(0, 'INT64')).toBe('0');
    });

    it('should format string integers', () => {
      expect(formatBigQueryValue('12345', 'INT64')).toBe('12345');
    });
  });

  describe('FLOAT64 handling', () => {
    it('should format floats with decimals', () => {
      expect(formatBigQueryValue(3.14159, 'FLOAT64')).toBe('3.14159');
    });

    it('should format negative floats', () => {
      expect(formatBigQueryValue(-2.718, 'FLOAT64')).toBe('-2.718');
    });

    it('should format very small numbers', () => {
      expect(formatBigQueryValue(0.000001, 'FLOAT64')).toBe('0.000001');
    });
  });

  describe('NUMERIC/BIGNUMERIC handling', () => {
    it('should format NUMERIC values', () => {
      expect(formatBigQueryValue('123.456789', 'NUMERIC')).toBe('123.456789');
    });

    it('should format BIGNUMERIC values', () => {
      // BIGNUMERIC strings are formatted with locale settings (grouping)
      const result = formatBigQueryValue('123456789.123456789', 'BIGNUMERIC');
      // Result includes thousand separators and may round
      expect(result).toContain('123');
    });

    it('should format DECIMAL values', () => {
      expect(formatBigQueryValue('999.99', 'DECIMAL')).toBe('999.99');
    });
  });

  describe('STRING handling', () => {
    it('should return strings as-is', () => {
      expect(formatBigQueryValue('hello', 'STRING')).toBe('hello');
    });

    it('should handle special characters', () => {
      expect(formatBigQueryValue('hello\nworld', 'STRING')).toBe('hello\nworld');
    });

    it('should handle unicode', () => {
      expect(formatBigQueryValue('こんにちは', 'STRING')).toBe('こんにちは');
    });
  });

  describe('Type inference without column type', () => {
    it('should infer string type', () => {
      expect(formatBigQueryValue('hello')).toBe('hello');
    });

    it('should infer number type', () => {
      expect(formatBigQueryValue(42)).toBe('42');
    });

    it('should infer boolean type', () => {
      expect(formatBigQueryValue(true)).toBe('true');
      expect(formatBigQueryValue(false)).toBe('false');
    });

    it('should infer Date type', () => {
      const date = new Date('2024-06-15T12:30:45Z');
      const result = formatBigQueryValue(date);
      expect(result).toMatch(/2024-06-15/);
    });
  });
});
````

## File: tests/unit/renderer/bigquery-formatter.test.ts
````typescript
import { formatBigQueryValue } from '../../../src/renderer/utils/bigquery-formatter';

describe('bigquery-formatter', () => {
  describe('formatBigQueryValue', () => {
    describe('NULL handling', () => {
      it('should return "NULL" for null values', () => {
        expect(formatBigQueryValue(null)).toBe('NULL');
        expect(formatBigQueryValue(null, 'STRING')).toBe('NULL');
        expect(formatBigQueryValue(null, 'INTEGER')).toBe('NULL');
      });

      it('should return "NULL" for undefined values', () => {
        expect(formatBigQueryValue(undefined)).toBe('NULL');
        expect(formatBigQueryValue(undefined, 'STRING')).toBe('NULL');
      });
    });

    describe('BOOLEAN formatting', () => {
      it('should format boolean true as "TRUE"', () => {
        expect(formatBigQueryValue(true, 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue(true, 'BOOLEAN')).toBe('TRUE');
      });

      it('should format boolean false as "FALSE"', () => {
        expect(formatBigQueryValue(false, 'BOOL')).toBe('FALSE');
        expect(formatBigQueryValue(false, 'BOOLEAN')).toBe('FALSE');
      });

      it('should handle string boolean values', () => {
        expect(formatBigQueryValue('true', 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue('false', 'BOOL')).toBe('FALSE');
        expect(formatBigQueryValue('TRUE', 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue('FALSE', 'BOOL')).toBe('FALSE');
      });
    });

    describe('STRING formatting', () => {
      it('should return strings as-is', () => {
        expect(formatBigQueryValue('hello', 'STRING')).toBe('hello');
        expect(formatBigQueryValue('hello world', 'STRING')).toBe('hello world');
      });

      it('should handle empty strings', () => {
        expect(formatBigQueryValue('', 'STRING')).toBe('');
      });
    });

    describe('INTEGER/INT64 formatting', () => {
      it('should format integers', () => {
        expect(formatBigQueryValue(123, 'INTEGER')).toBe('123');
        expect(formatBigQueryValue(123, 'INT64')).toBe('123');
        expect(formatBigQueryValue(-456, 'INT64')).toBe('-456');
      });

      it('should format large integers', () => {
        expect(formatBigQueryValue(9007199254740991, 'INT64')).toBe('9007199254740991');
      });

      it('should format zero', () => {
        expect(formatBigQueryValue(0, 'INTEGER')).toBe('0');
      });
    });

    describe('FLOAT64/FLOAT formatting', () => {
      it('should format floats', () => {
        expect(formatBigQueryValue(3.14159, 'FLOAT64')).toBe('3.14159');
        expect(formatBigQueryValue(3.14159, 'FLOAT')).toBe('3.14159');
      });

      it('should format negative floats', () => {
        expect(formatBigQueryValue(-2.5, 'FLOAT64')).toBe('-2.5');
      });
    });

    describe('DATE formatting', () => {
      it('should format date strings', () => {
        expect(formatBigQueryValue('2024-01-15', 'DATE')).toBe('2024-01-15');
      });

      it('should format Date objects for DATE type', () => {
        const date = new Date('2024-01-15T00:00:00Z');
        const result = formatBigQueryValue(date, 'DATE');
        expect(result).toBe('2024-01-15');
      });
    });

    describe('TIMESTAMP formatting', () => {
      it('should format timestamp strings', () => {
        expect(formatBigQueryValue('2024-01-15T10:30:00Z', 'TIMESTAMP')).toBe('2024-01-15T10:30:00Z');
      });

      it('should format Date objects for TIMESTAMP type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'TIMESTAMP');
        expect(result).toMatch(/2024-01-15T10:30:00/);
      });
    });

    describe('DATETIME formatting', () => {
      it('should format datetime strings', () => {
        expect(formatBigQueryValue('2024-01-15 10:30:00', 'DATETIME')).toBe('2024-01-15 10:30:00');
      });

      it('should format Date objects for DATETIME type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'DATETIME');
        expect(result).toBe('2024-01-15 10:30:00');
      });
    });

    describe('TIME formatting', () => {
      it('should format time strings', () => {
        expect(formatBigQueryValue('10:30:00', 'TIME')).toBe('10:30:00');
      });

      it('should format Date objects for TIME type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'TIME');
        expect(result).toBe('10:30:00');
      });
    });

    describe('ARRAY formatting', () => {
      it('should format arrays as JSON', () => {
        const result = formatBigQueryValue([1, 2, 3], 'ARRAY');
        expect(result).toBe('[1, 2, 3]');
      });

      it('should format arrays of strings', () => {
        const result = formatBigQueryValue(['a', 'b', 'c'], 'ARRAY');
        // The formatter joins elements without quoting individual strings
        expect(result).toBe('[a, b, c]');
      });

      it('should format empty arrays', () => {
        const result = formatBigQueryValue([], 'ARRAY');
        expect(result).toBe('[]');
      });
    });

    describe('STRUCT/RECORD formatting', () => {
      it('should format objects as JSON', () => {
        const result = formatBigQueryValue({ name: 'John', age: 30 }, 'STRUCT');
        expect(JSON.parse(result)).toEqual({ name: 'John', age: 30 });
      });

      it('should format nested objects', () => {
        const value = { user: { name: 'John', address: { city: 'NYC' } } };
        const result = formatBigQueryValue(value, 'RECORD');
        expect(JSON.parse(result)).toEqual(value);
      });
    });

    describe('BYTES formatting', () => {
      it('should format byte arrays', () => {
        // BYTES are formatted as hex strings (0x...)
        const result = formatBigQueryValue('SGVsbG8=', 'BYTES');
        // Base64 'SGVsbG8=' decodes to 'Hello' which is 0x48656c6c6f
        expect(result).toBe('0x48656c6c6f');
      });
    });

    describe('GEOGRAPHY formatting', () => {
      it('should format geography strings', () => {
        const geoJson = 'POINT(-122.4194 37.7749)';
        expect(formatBigQueryValue(geoJson, 'GEOGRAPHY')).toBe(geoJson);
      });
    });

    describe('JSON formatting', () => {
      it('should format JSON strings', () => {
        const jsonStr = '{"key": "value"}';
        // JSON is pretty-printed with 2-space indentation
        const expected = '{\n  "key": "value"\n}';
        expect(formatBigQueryValue(jsonStr, 'JSON')).toBe(expected);
      });

      it('should format JSON objects', () => {
        const value = { key: 'value' };
        const result = formatBigQueryValue(value, 'JSON');
        expect(JSON.parse(result)).toEqual(value);
      });
    });

    describe('NUMERIC/BIGNUMERIC formatting', () => {
      it('should format numeric strings', () => {
        expect(formatBigQueryValue('123.456', 'NUMERIC')).toBe('123.456');
        expect(formatBigQueryValue('123.456', 'BIGNUMERIC')).toBe('123.456');
        expect(formatBigQueryValue('123.456', 'DECIMAL')).toBe('123.456');
      });
    });

    describe('Unknown types', () => {
      it('should handle values without column type', () => {
        expect(formatBigQueryValue('hello')).toBe('hello');
        expect(formatBigQueryValue(123)).toBe('123');
        expect(formatBigQueryValue(true)).toBe('true');
      });
    });

    describe('Edge cases', () => {
      it('should handle [object Object] string for date columns', () => {
        const result = formatBigQueryValue('[object Object]', 'DATE');
        expect(result).toBe('[Invalid Date]');
      });

      it('should handle empty objects for date columns', () => {
        const result = formatBigQueryValue({}, 'DATE');
        expect(result).toBe('[Invalid Date]');
      });

      it('should handle invalid Date objects', () => {
        const invalidDate = new Date('invalid');
        const result = formatBigQueryValue(invalidDate, 'DATE');
        expect(result).toBe('Invalid Date');
      });
    });
  });
});
````

## File: tests/unit/shared/connection-validation.test.ts
````typescript
import {
  isValidProjectId,
  validateConnectionConfig,
} from '../../../src/shared/utils/connection-validation';
import type { ConnectionConfig } from '../../../src/shared/types/connection';

describe('connection-validation', () => {
  describe('isValidProjectId', () => {
    it('should return true for valid project IDs', () => {
      expect(isValidProjectId('my-project')).toBe(true);
      expect(isValidProjectId('my-project-123')).toBe(true);
      expect(isValidProjectId('project123')).toBe(true);
      expect(isValidProjectId('a12345')).toBe(true); // minimum 6 chars
      expect(isValidProjectId('abcdef012345678901234567890')).toBe(true); // 27 chars
      expect(isValidProjectId('my-gcp-project-id')).toBe(true);
    });

    it('should return false for project IDs starting with numbers', () => {
      expect(isValidProjectId('123project')).toBe(false);
      expect(isValidProjectId('1my-project')).toBe(false);
    });

    it('should return false for project IDs starting with hyphens', () => {
      expect(isValidProjectId('-my-project')).toBe(false);
    });

    it('should return false for project IDs that are too short', () => {
      expect(isValidProjectId('abc')).toBe(false);
      expect(isValidProjectId('abcde')).toBe(false); // 5 chars - too short
    });

    it('should return false for project IDs that are too long', () => {
      expect(isValidProjectId('a'.repeat(31))).toBe(false); // 31 chars - too long
    });

    it('should return false for project IDs with uppercase letters', () => {
      expect(isValidProjectId('My-Project')).toBe(false);
      expect(isValidProjectId('MYPROJECT')).toBe(false);
    });

    it('should return false for project IDs with invalid characters', () => {
      expect(isValidProjectId('my_project')).toBe(false); // underscore
      expect(isValidProjectId('my.project')).toBe(false); // dot
      expect(isValidProjectId('my project')).toBe(false); // space
      expect(isValidProjectId('my@project')).toBe(false); // @
    });

    it('should return false for empty strings', () => {
      expect(isValidProjectId('')).toBe(false);
    });
  });

  describe('validateConnectionConfig', () => {
    describe('Project ID validation', () => {
      it('should return error for missing project ID', () => {
        const config: ConnectionConfig = {
          projectId: '',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Project ID is required');
      });

      it('should return error for whitespace-only project ID', () => {
        const config: ConnectionConfig = {
          projectId: '   ',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Project ID is required');
      });

      it('should return error for invalid project ID format', () => {
        const config: ConnectionConfig = {
          projectId: 'Invalid-Project',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid project ID format');
      });
    });

    describe('Application default authentication', () => {
      it('should validate config with application-default auth', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should validate config with location', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
          location: 'US',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });
    });

    describe('Service account authentication', () => {
      it('should return error when no key path or key content provided', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Service account key path or key content is required');
      });

      it('should validate config with service account key path', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKeyPath: '/path/to/key.json',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should validate config with valid service account key JSON', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: JSON.stringify({
            type: 'service_account',
            project_id: 'test-project',
            private_key_id: 'key-id',
          }),
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should return error for invalid service account key JSON', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: 'invalid-json',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Service account key must be valid JSON');
      });

      it('should return error for malformed JSON in service account key', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: '{ "type": "service_account"', // Missing closing brace
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Service account key must be valid JSON');
      });
    });

    describe('Optional fields', () => {
      it('should validate config with dbt support enabled', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
          enableDbtSupport: true,
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should validate config with all optional fields', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKeyPath: '/path/to/key.json',
          location: 'EU',
          enableDbtSupport: false,
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });
    });
  });
});
````

## File: .eslintignore
````
node_modules/
dist/
build/
out/
coverage/
*.min.js
*.bundle.js
*.config.js
````

## File: .eslintrc.json
````json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
````

## File: .prettierignore
````
node_modules/
dist/
build/
coverage/
package-lock.json
yarn.lock
pnpm-lock.yaml
*.min.js
*.bundle.js
````

## File: .prettierrc.json
````json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
````

## File: eslint.config.js
````javascript
const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
````

## File: jest.config.js
````javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },
};
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.test.tsx"]
}
````

## File: webpack.renderer.config.js
````javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'dist/renderer'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
  ],
};
````

## File: src/main/ipc/connection.ts
````typescript
import { ipcMain, safeStorage } from 'electron';
import { BigQuery } from '@google-cloud/bigquery';
import { validateConnectionConfig } from '../../shared/utils/connection-validation';
import type { ConnectionConfig, ConnectionConfiguration } from '../../shared/types/connection';
import { BigQueryErrorCode } from '../../shared/types/bigquery';
import {
  saveConnection,
  getSavedConnection,
  getDecryptedServiceAccountKey,
  clearConnection,
} from '../storage/connection-store';

let bigqueryClient: BigQuery | null = null;
let activeConnection: ConnectionConfiguration | null = null;

function createBigQueryClient(config: ConnectionConfig): BigQuery {
  const options: { projectId: string; keyFilename?: string; credentials?: any } = {
    projectId: config.projectId,
  };

  if (config.authType === 'service-account') {
    if (config.serviceAccountKeyPath) {
      options.keyFilename = config.serviceAccountKeyPath;
    } else if (config.serviceAccountKey) {
      try {
        options.credentials = JSON.parse(config.serviceAccountKey);
      } catch (e) {
        throw new Error('Invalid service account key JSON');
      }
    }
  }

  return new BigQuery(options);
}

export function registerConnectionHandlers(): void {
  ipcMain.handle('connection:configure', async (_event, config: ConnectionConfig) => {
    try {
      // Validate configuration
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        throw {
          code: BigQueryErrorCode.INVALID_PROJECT_ID,
          message: validation.error || 'Invalid configuration',
        };
      }

      // Create BigQuery client
      bigqueryClient = createBigQueryClient(config);

      // Test connection by listing datasets
      await bigqueryClient.getDatasets({ maxResults: 1 });

      // Store connection configuration (encrypt sensitive data)
      const connectionConfig: ConnectionConfiguration = {
        projectId: config.projectId,
        authType: config.authType,
        serviceAccountKeyPath: config.serviceAccountKeyPath,
        location: config.location || 'EU', // Default to EU if not specified
        lastConnected: new Date().toISOString(),
        isActive: true,
        enableDbtSupport: config.enableDbtSupport || false,
      };

      // Save connection to persistent storage
      saveConnection(config, connectionConfig);

      activeConnection = connectionConfig;

      return;
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw {
          code: BigQueryErrorCode.NETWORK_ERROR,
          message: 'Network error: Unable to connect to BigQuery',
          details: error.message,
        };
      }
      if (error.code === 403 || error.code === 401) {
        throw {
          code: BigQueryErrorCode.AUTH_ERROR,
          message: 'Authentication failed: Invalid credentials',
          details: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'Failed to establish connection',
        details: error.message,
      };
    }
  });

  ipcMain.handle('connection:getActive', async () => {
    return activeConnection;
  });

  ipcMain.handle('connection:test', async (_event, config: ConnectionConfig) => {
    try {
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        return false;
      }

      const testClient = createBigQueryClient(config);
      await testClient.getDatasets({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  });

  ipcMain.handle('connection:disconnect', async () => {
    bigqueryClient = null;
    activeConnection = null;
    // Don't clear saved connection - user can restore it later
  });

  ipcMain.handle('connection:getSaved', async () => {
    return getSavedConnection();
  });

  ipcMain.handle('connection:restore', async () => {
    try {
      const saved = getSavedConnection();
      if (!saved) {
        return null;
      }

      // Reconstruct ConnectionConfig from saved connection
      const config: ConnectionConfig = {
        projectId: saved.projectId,
        authType: saved.authType,
        serviceAccountKeyPath: saved.serviceAccountKeyPath,
        location: saved.location || 'EU',
        enableDbtSupport: saved.enableDbtSupport,
      };

      // If using service account key content (not file path), decrypt it
      if (saved.authType === 'service-account' && !saved.serviceAccountKeyPath) {
        const decryptedKey = getDecryptedServiceAccountKey();
        if (decryptedKey) {
          config.serviceAccountKey = decryptedKey;
        } else {
          // Can't restore - key is missing or can't be decrypted
          // This can happen if the app name changed (which changes the encryption key)
          // Clear the saved connection so user can reconfigure
          clearConnection();
          throw new Error('Saved service account key cannot be decrypted (possibly due to app update). Please reconfigure your connection.');
        }
      }

      // Validate and test the connection
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid saved configuration');
      }

      // Create BigQuery client
      bigqueryClient = createBigQueryClient(config);

      // Test connection
      await bigqueryClient.getDatasets({ maxResults: 1 });

      // Update last connected timestamp
      const connectionConfig: ConnectionConfiguration = {
        ...saved,
        lastConnected: new Date().toISOString(),
        isActive: true,
      };

      // Update storage with new timestamp
      saveConnection(config, connectionConfig);

      activeConnection = connectionConfig;

      return connectionConfig;
    } catch (error: any) {
      // Clear invalid saved connection
      clearConnection();
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: error.message || 'Failed to restore saved connection',
        details: error,
      };
    }
  });
}

export function getBigQueryClient(): BigQuery | null {
  return bigqueryClient;
}

export function getActiveConnection(): ConnectionConfiguration | null {
  return activeConnection;
}
````

## File: src/renderer/components/ConnectionDialog/ConnectionDialog.css
````css
.connection-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.connection-dialog {
  background: #252526;
  border-radius: 4px;
  padding: 2rem;
  min-width: 500px;
  max-width: 600px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 1px solid #3e3e42;
  color: #cccccc;
}

.connection-dialog h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 400;
  color: #ffffff;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 400;
  color: #cccccc;
  font-size: 0.8125rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  font-size: 0.8125rem;
  background-color: #3c3c3c;
  color: #cccccc;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: 1px solid #007acc;
  outline-offset: -1px;
}

.form-group textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

.error-message {
  background-color: #3a1d1d;
  color: #f48771;
  padding: 0.75rem;
  border-radius: 3px;
  margin-bottom: 1rem;
  border: 1px solid #6a1f1f;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.dialog-actions button:first-child {
  background-color: #3e3e42;
  color: #cccccc;
}

.dialog-actions button:first-child:hover {
  background-color: #4a4a4a;
}

.dialog-actions button:last-child {
  background-color: #0e639c;
  color: #ffffff;
}

.dialog-actions button:last-child:hover {
  background-color: #1177bb;
}

.dialog-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-group {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #3e3e42;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
  accent-color: #0e639c;
}

.field-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #8c8c8c;
}
````

## File: src/renderer/components/ConnectionDialog/ConnectionDialog.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { useConnectionStore } from '../../stores/connection-store';
import { validateConnectionConfig } from '../../../shared/utils/connection-validation';
import type { ConnectionConfig } from '../../../shared/types/connection';
import './ConnectionDialog.css';

interface ConnectionDialogProps {
  onClose: () => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ onClose }) => {
  const [projectId, setProjectId] = useState('');
  const [authType, setAuthType] = useState<'service-account' | 'application-default'>(
    'service-account'
  );
  const [serviceAccountKeyPath, setServiceAccountKeyPath] = useState('');
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  const [location, setLocation] = useState('EU');
  const [enableDbtSupport, setEnableDbtSupport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { setConnection, setConnecting, setConnectionError } = useConnectionStore();

  // Load saved connection settings when dialog opens
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.connection.getSaved().then((saved) => {
        if (saved) {
          setProjectId(saved.projectId);
          setAuthType(saved.authType);
          setServiceAccountKeyPath(saved.serviceAccountKeyPath || '');
          setLocation(saved.location || 'EU');
          setEnableDbtSupport(saved.enableDbtSupport || false);
          // Note: We don't load the service account key content for security reasons
          // User needs to re-enter it or use the file path
        }
      }).catch((err) => {
        console.error('Failed to load saved connection:', err);
      });
    }
  }, []);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    setConnecting(true);

    const config: ConnectionConfig = {
      projectId: projectId.trim(),
      authType,
      serviceAccountKeyPath: serviceAccountKeyPath.trim() || undefined,
      serviceAccountKey: serviceAccountKey.trim() || undefined,
      location: location.trim() || 'EU',
      enableDbtSupport,
    };

    // Validate configuration
    const validation = validateConnectionConfig(config);
    if (!validation.valid) {
      setError(validation.error || 'Invalid configuration');
      setIsConnecting(false);
      setConnecting(false);
      return;
    }

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Test connection first
      const isValid = await window.electronAPI.connection.test(config);
      if (!isValid) {
        throw new Error('Connection test failed. Please check your credentials.');
      }

      // Configure connection
      await window.electronAPI.connection.configure(config);

      // Get active connection
      const activeConnection = await window.electronAPI.connection.getActive();
      if (activeConnection) {
        setConnection(activeConnection);
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to BigQuery';
      setError(errorMessage);
      setConnectionError(errorMessage);
    } finally {
      setIsConnecting(false);
      setConnecting(false);
    }
  };

  return (
    <div className="connection-dialog-overlay" onClick={onClose}>
      <div className="connection-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Connect to BigQuery</h2>

        <div className="form-group">
          <label htmlFor="projectId">Project ID *</label>
          <input
            id="projectId"
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="my-project-id"
            disabled={isConnecting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isConnecting}
          >
            <option value="EU">EU</option>
            <option value="US">US</option>
            <option value="asia-northeast1">Asia (Tokyo)</option>
            <option value="asia-south1">Asia (Mumbai)</option>
            <option value="asia-southeast1">Asia (Singapore)</option>
            <option value="australia-southeast1">Australia (Sydney)</option>
            <option value="europe-west1">Europe (Belgium)</option>
            <option value="europe-west2">Europe (London)</option>
            <option value="europe-west3">Europe (Frankfurt)</option>
            <option value="europe-west4">Europe (Netherlands)</option>
            <option value="europe-west6">Europe (Zurich)</option>
            <option value="northamerica-northeast1">North America (Montreal)</option>
            <option value="southamerica-east1">South America (São Paulo)</option>
            <option value="us-central1">US (Iowa)</option>
            <option value="us-east1">US (South Carolina)</option>
            <option value="us-east4">US (Northern Virginia)</option>
            <option value="us-west1">US (Oregon)</option>
            <option value="us-west2">US (Los Angeles)</option>
            <option value="us-west3">US (Salt Lake City)</option>
            <option value="us-west4">US (Las Vegas)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="authType">Authentication Method *</label>
          <select
            id="authType"
            value={authType}
            onChange={(e) =>
              setAuthType(e.target.value as 'service-account' | 'application-default')
            }
            disabled={isConnecting}
          >
            <option value="service-account">Service Account Key</option>
            <option value="application-default">Application Default Credentials</option>
          </select>
        </div>

        {authType === 'service-account' && (
          <>
            <div className="form-group">
              <label htmlFor="keyPath">Service Account Key File Path</label>
              <input
                id="keyPath"
                type="text"
                value={serviceAccountKeyPath}
                onChange={(e) => setServiceAccountKeyPath(e.target.value)}
                placeholder="/path/to/key.json"
                disabled={isConnecting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="keyContent">Or Paste Service Account Key JSON</label>
              <textarea
                id="keyContent"
                value={serviceAccountKey}
                onChange={(e) => setServiceAccountKey(e.target.value)}
                placeholder='{"type": "service_account", ...}'
                rows={5}
                disabled={isConnecting}
              />
            </div>
          </>
        )}

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enableDbtSupport}
              onChange={(e) => setEnableDbtSupport(e.target.checked)}
              disabled={isConnecting}
            />
            Enable dbt syntax support
          </label>
          <span className="field-hint">Adds dbtify/de-dbtify button to convert between BigQuery and dbt syntax</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="dialog-actions">
          <button onClick={onClose} disabled={isConnecting}>
            Cancel
          </button>
          <button onClick={handleConnect} disabled={isConnecting || !projectId.trim()}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/components/DatasetTree/DatasetTree.css
````css
.dataset-tree {
  width: 100%;
  flex: 1;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.dataset-tree.collapsed {
  min-width: 30px;
  max-width: 30px;
}

.dataset-tree-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  height: 35px;
  gap: 0.5rem;
}

.collapse-button {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.collapse-button:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.dataset-tree-title {
  flex: 1;
  font-size: 0.8125rem;
  color: #cccccc;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.refresh-button {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.refresh-button:hover:not(:disabled) {
  background-color: #2a2d2e;
  color: #cccccc;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dataset-tree-search {
  padding: 0.5rem;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dataset-tree-search-input {
  flex: 1;
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  color: #cccccc;
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.dataset-tree-search-input:focus {
  border-color: #007acc;
}

.dataset-tree-search-input::placeholder {
  color: #858585;
}

.dataset-tree-search-clear {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.dataset-tree-search-clear:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.dataset-tree-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.25rem 0;
}

.dataset-tree-loading,
.dataset-tree-error,
.dataset-tree-empty {
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #858585;
}

.dataset-tree-error {
  color: #f48771;
}

.dataset-item {
  user-select: none;
}

.dataset-header {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: #cccccc;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  gap: 0.375rem;
}

.dataset-header:hover {
  background-color: #2a2d2e;
}

.dataset-icon {
  font-size: 0.625rem;
  color: #858585;
  width: 12px;
  display: inline-block;
  text-align: center;
}

.dataset-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-tables {
  padding-left: 1rem;
}

.table-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  padding-left: 1.5rem;
  cursor: pointer;
  color: #cccccc;
  font-size: 0.75rem;
  transition: background-color 0.15s ease;
  gap: 0.375rem;
}

.table-item:hover {
  background-color: #2a2d2e;
}

.table-icon {
  font-size: 0.75rem;
  width: 16px;
  display: inline-block;
  text-align: center;
}

.table-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-loading,
.table-empty {
  padding: 0.5rem 1rem;
  padding-left: 2rem;
  font-size: 0.75rem;
  color: #858585;
  font-style: italic;
}

.context-menu {
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  padding: 0.25rem 0;
  z-index: 1000;
  user-select: none;
}

.context-menu-item {
  padding: 0.5rem 1rem;
  color: #cccccc;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.context-menu-item:hover {
  background-color: #094771;
}

.context-menu-item:first-child {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

.context-menu-item:last-child {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}
````

## File: src/renderer/components/QueryResults/QueryResults.css
````css
.query-results {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
}

.results-header {
  padding: 0.5rem 1rem;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
}

.results-info {
  font-size: 0.75rem;
  color: #858585;
}

.results-info span {
  margin-right: 0.5rem;
}

.results-table-container {
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
  position: relative;
}

.canvas-table-container {
  width: 100%;
  height: 100%;
  overflow-x: scroll;
  overflow-y: scroll;
  background-color: #1e1e1e;
  /* Ensure scrollbars are always visible when content overflows */
  scrollbar-width: thin;
  scrollbar-color: #424242 #1e1e1e;
  /* Force scrollbars to be visible on macOS and Windows */
  -webkit-overflow-scrolling: touch;
  /* Force scrollbars to always be visible (not auto-hide on macOS) */
  overflow: -moz-scrollbars-vertical;
  overflow: -moz-scrollbars-horizontal;
}

.canvas-table-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  -webkit-appearance: none;
  /* Force scrollbars to always be visible on macOS */
  display: block;
}

.canvas-table-container::-webkit-scrollbar-track {
  background: #1e1e1e;
  border: 1px solid #2d2d30;
  /* Ensure track is always visible */
  -webkit-box-shadow: inset 0 0 0 1px rgba(45, 45, 48, 0.5);
}

.canvas-table-container::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 6px;
  border: 2px solid #1e1e1e;
  min-height: 20px;
  min-width: 20px;
  /* Make thumb more visible */
  -webkit-box-shadow: 0 0 1px rgba(0, 0, 0, 0.5);
}

.canvas-table-container::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}

.canvas-table-container::-webkit-scrollbar-thumb:active {
  background: #5e5e5e;
}

.canvas-table-container::-webkit-scrollbar-corner {
  background: #1e1e1e;
}

.no-rows-message {
  padding: 2rem;
  text-align: center;
  color: #858585;
  background-color: #1e1e1e;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  color: #cccccc;
}

.results-table thead {
  position: sticky;
  top: 0;
  background-color: #252526;
  z-index: 1;
}

.results-table th {
  padding: 0;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #3e3e42;
  border-right: 1px solid #3e3e42;
  background-color: #252526;
  font-size: 0.75rem;
  color: #cccccc;
  position: relative;
  min-width: 50px;
}

.results-table th:last-child {
  border-right: none;
}

.results-table th .th-content {
  padding: 0.375rem 0.5rem;
  display: flex;
  align-items: center;
  position: relative;
  height: 100%;
}

.results-table th .resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  z-index: 2;
  transition: background-color 0.15s ease;
}

.results-table th .resize-handle:hover {
  background-color: #007acc;
}

.results-table th:last-child .resize-handle {
  display: none;
}

.results-table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid #3e3e42;
  border-right: 1px solid #3e3e42;
  font-size: 0.75rem;
  color: #cccccc;
}

.results-table td:last-child {
  border-right: none;
}

.results-table tbody tr:nth-child(even) {
  background-color: #252526;
}

.results-table tbody tr:nth-child(odd) {
  background-color: #1e1e1e;
}

.results-table tbody tr:hover {
  background-color: #2a2d2e;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #858585;
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 200px;
}

.query-spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
}

.query-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #3e3e42;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: query-spinner-rotation 0.8s linear infinite;
}

@keyframes query-spinner-rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-results {
  padding: 2rem;
  background-color: #3a1d1d;
  color: #f48771;
  border-radius: 3px;
  margin: 1rem;
  border: 1px solid #6a1f1f;
}

.results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 200px;
  gap: 1rem;
  padding: 2rem;
}

.loading-progress-bar {
  width: 100%;
  max-width: 400px;
  height: 6px;
  background-color: #3e3e42;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.loading-progress-bar-fill {
  height: 100%;
  background-color: #007acc;
  border-radius: 3px;
  width: 0%;
  animation: progress-bar-animation 1.5s ease-in-out infinite;
  display: block;
}

@keyframes progress-bar-animation {
  0% {
    width: 0%;
    transform: translateX(0);
  }
  50% {
    width: 70%;
    transform: translateX(0);
  }
  100% {
    width: 100%;
    transform: translateX(100%);
  }
}

.loading-text {
  color: #858585;
  font-size: 0.8125rem;
}

.results-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: #252526;
  border-top: 1px solid #3e3e42;
  font-size: 0.75rem;
  color: #858585;
}

.pagination-button {
  background: transparent;
  border: 1px solid #3e3e42;
  color: #cccccc;
  cursor: pointer;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  padding: 0;
  line-height: 1;
}

.pagination-button:hover:not(:disabled) {
  background-color: #2a2d2e;
  border-color: #007acc;
  color: #ffffff;
}

.pagination-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: #858585;
  font-size: 0.75rem;
  min-width: 100px;
  text-align: center;
}
````

## File: src/renderer/components/SampleDataModal/SampleDataModal.css
````css
.sample-data-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.sample-data-modal {
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  width: 90%;
  max-width: 1400px;
  height: 85%;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.sample-data-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
  border-radius: 4px 4px 0 0;
}

.sample-data-modal-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #cccccc;
}

.sample-data-modal-close {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
  line-height: 1;
}

.sample-data-modal-close:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}

.sample-data-modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.sample-data-loading,
.sample-data-error,
.sample-data-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #858585;
  gap: 1rem;
}

.sample-data-error {
  color: #f48771;
  flex-direction: column;
  gap: 0.5rem;
}

.sample-data-info {
  font-size: 0.75rem;
  color: #858585;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #3e3e42;
}

.sample-data-info span {
  margin-right: 0.75rem;
}

.sample-data-canvas-container {
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  min-height: 200px;
}

.sample-data-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 0;
  margin-top: 0.75rem;
  border-top: 1px solid #3e3e42;
}

.pagination-button {
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  color: #cccccc;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  min-width: 32px;
}

.pagination-button:hover:not(:disabled) {
  background-color: #3e3e42;
  border-color: #007acc;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.75rem;
  color: #858585;
}

.loading-progress-bar {
  width: 100%;
  max-width: 400px;
  height: 4px;
  background-color: #2d2d30;
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress-bar-fill {
  height: 100%;
  background-color: #007acc;
  animation: loading-progress 1.5s ease-in-out infinite;
}

@keyframes loading-progress {
  0% {
    width: 0%;
    transform: translateX(0);
  }
  50% {
    width: 70%;
    transform: translateX(0);
  }
  100% {
    width: 100%;
    transform: translateX(100%);
  }
}

.loading-text {
  color: #858585;
  font-size: 0.875rem;
}
````

## File: src/renderer/components/ViewDefinitionModal/ViewDefinitionModal.css
````css
.view-definition-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.view-definition-modal-dialog {
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.view-definition-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #3e3e42;
  background-color: #252526;
}

.view-definition-modal-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #cccccc;
}

.view-definition-modal-close {
  background: transparent;
  border: none;
  color: #858585;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.15s ease;
}

.view-definition-modal-close:hover {
  color: #ffffff;
}

.view-definition-modal-content {
  flex: 1;
  overflow: hidden;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.view-definition-actions {
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-end;
}

.view-definition-copy-button {
  background-color: #007acc;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.view-definition-copy-button:hover {
  background-color: #005a9e;
}

.view-definition-editor {
  flex: 1;
  min-height: 400px;
  height: 100%;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  overflow: hidden;
}

.view-definition-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #858585;
}

.view-definition-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #3e3e42;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: view-definition-spinner-rotation 0.8s linear infinite;
}

@keyframes view-definition-spinner-rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.view-definition-error {
  padding: 1rem;
  background-color: #3a1d1d;
  color: #f48771;
  border-radius: 3px;
  border: 1px solid #6a1f1f;
}
````

## File: src/renderer/components/ViewDefinitionModal/ViewDefinitionModal.tsx
````typescript
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './ViewDefinitionModal.css';

interface ViewDefinitionModalProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

export const ViewDefinitionModal: React.FC<ViewDefinitionModalProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const [definition, setDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadViewDefinition = async () => {
      if (!window.electronAPI) {
        setError('Electron API not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.bigquery.getViewDefinition(datasetId, tableId);
        setDefinition(result.definition);
      } catch (err: any) {
        setError(err.message || 'Failed to load view definition');
      } finally {
        setIsLoading(false);
      }
    };

    loadViewDefinition();
  }, [datasetId, tableId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(definition);
  };

  return (
    <div className="view-definition-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-definition-modal-dialog">
        <div className="view-definition-modal-header">
          <h2>View Definition: {projectId}.{datasetId}.{tableId}</h2>
          <button className="view-definition-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="view-definition-modal-content">
          {isLoading && (
            <div className="view-definition-loading">
              <div className="view-definition-spinner"></div>
              <div>Loading view definition...</div>
            </div>
          )}
          {error && (
            <div className="view-definition-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!isLoading && !error && definition && (
            <>
              <div className="view-definition-actions">
                <button onClick={handleCopy} className="view-definition-copy-button">
                  Copy to Clipboard
                </button>
              </div>
              <div className="view-definition-editor">
                <Editor
                  height="400px"
                  language="sql"
                  value={definition}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    lineNumbers: 'on',
                    folding: true,
                    wordWrap: 'on',
                    automaticLayout: true,
                    renderLineHighlight: 'none',
                    scrollbar: {
                      vertical: 'auto',
                      horizontal: 'auto',
                    },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/types/electron-api.d.ts
````typescript
import type { ConnectionConfig, ConnectionConfiguration } from '../../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata, QueryTab, Row } from '../../shared/types/query';
import type { Dataset, Table } from '../../shared/types/dataset';

/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string): Promise<QueryResult>;
    cancel(jobId: string): Promise<void>;
    listDatasets(): Promise<Dataset[]>;
    listTables(datasetId: string): Promise<Table[]>;
    getTableSchema(datasetId: string, tableId: string): Promise<{ 
      fields: ColumnMetadata[];
      metadata?: {
        creationTime?: number;
        lastModifiedTime?: number;
        numRows?: number;
        numBytes?: number;
      };
    }>;
    getViewDefinition(datasetId: string, tableId: string): Promise<{ definition: string }>;
  };

  // Connection management
  connection: {
    configure(config: ConnectionConfig): Promise<void>;
    getActive(): Promise<ConnectionConfiguration | null>;
    getSaved(): Promise<ConnectionConfiguration | null>;
    restore(): Promise<ConnectionConfiguration | null>;
    test(config: ConnectionConfig): Promise<boolean>;
    disconnect(): Promise<void>;
  };

  // Saved queries
  queries: {
    list(): Promise<SavedQuery[]>;
    get(id: string): Promise<SavedQuery>;
    save(query: SaveQueryInput): Promise<SavedQuery>;
    update(id: string, updates: UpdateQueryInput): Promise<SavedQuery>;
    delete(id: string): Promise<void>;
    search(term: string): Promise<SavedQuery[]>;
  };

  // UI settings
  uiSettings: {
    getLeftSidebarWidth(): Promise<number>;
    setLeftSidebarWidth(width: number): Promise<void>;
    getRightSidebarWidth(): Promise<number>;
    setRightSidebarWidth(width: number): Promise<void>;
  };

  // Tabs management
  tabs: {
    getTabs(): Promise<QueryTab[]>;
    getActiveTabId(): Promise<string | null>;
    saveTabs(tabs: QueryTab[], activeTabId: string | null): Promise<void>;
    onBeforeClose(callback: () => void): () => void;
  };

  // Results cache
  resultsCache: {
    save(tabId: string, results: QueryResult): Promise<void>;
    get(tabId: string): Promise<QueryResult | null>;
    getMetadata(tabId: string): Promise<{
      columns: ColumnMetadata[];
      totalRows: number;
      rowsReturned: number;
      executionTimeMs: number;
      bytesProcessed?: number;
      jobId: string;
      hasMore: boolean;
    } | null>;
    getPage(tabId: string, pageNumber: number): Promise<Row[] | null>;
    delete(tabId: string): Promise<void>;
    clear(): Promise<void>;
  };

  // Menu events
  menu: {
    onShowHelp(callback: () => void): () => void;
    onNewTab(callback: () => void): () => void;
    onShowAbout(callback: () => void): () => void;
    onCloseTab(callback: () => void): () => void;
    onSaveQuery(callback: () => void): () => void;
    onFormatQuery(callback: () => void): () => void;
    onExecuteQuery(callback: () => void): () => void;
    onShowConnection(callback: () => void): () => void;
    onDisconnect(callback: () => void): () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
````

## File: src/renderer/index.tsx
````typescript
/// <reference path="./types/electron-api.d.ts" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
````

## File: src/shared/types/connection.ts
````typescript
/**
 * Connection configuration types for BigQuery
 */

export interface ConnectionConfig {
  projectId: string;
  authType: 'service-account' | 'application-default';
  serviceAccountKeyPath?: string;
  serviceAccountKey?: string; // JSON string content
  location?: string; // BigQuery location (defaults to 'EU')
  enableDbtSupport?: boolean; // Enable dbt syntax support (dbtify/de-dbtify)
}

export interface ConnectionConfiguration {
  projectId: string;
  authType: 'service-account' | 'application-default';
  serviceAccountKeyPath?: string;
  location?: string; // BigQuery location (defaults to 'EU')
  lastConnected?: string; // ISO timestamp
  isActive: boolean;
  enableDbtSupport?: boolean; // Enable dbt syntax support (dbtify/de-dbtify)
}
````

## File: tests/unit/renderer/App.test.tsx
````typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../../src/renderer/App';

// Mock the components that might have dependencies
jest.mock('../../../src/renderer/components/ConnectionDialog/ConnectionDialog', () => ({
  ConnectionDialog: () => <div data-testid="connection-dialog">Connection Dialog</div>,
}));

jest.mock('../../../src/renderer/components/SavedQueries/SavedQueries', () => ({
  SavedQueries: () => <div data-testid="saved-queries">Saved Queries</div>,
}));

jest.mock('../../../src/renderer/components/HelpDialog/HelpDialog', () => ({
  HelpDialog: () => <div data-testid="help-dialog">Help Dialog</div>,
}));

jest.mock('../../../src/renderer/components/AboutDialog/AboutDialog', () => ({
  AboutDialog: () => <div data-testid="about-dialog">About Dialog</div>,
}));

jest.mock('../../../src/renderer/components/TabBar/TabBar', () => ({
  TabBar: () => <div data-testid="tab-bar">Tab Bar</div>,
}));

jest.mock('../../../src/renderer/components/QueryEditor/QueryEditor', () => ({
  QueryEditor: () => <div data-testid="query-editor">Query Editor</div>,
}));

jest.mock('../../../src/renderer/components/QueryResults/QueryResults', () => ({
  QueryResults: () => <div data-testid="query-results">Query Results</div>,
}));

jest.mock('../../../src/renderer/components/DatasetTree/DatasetTree', () => ({
  DatasetTree: () => <div data-testid="dataset-tree">Dataset Tree</div>,
}));

jest.mock('../../../src/renderer/components/SavedQueriesTree/SavedQueriesTree', () => ({
  SavedQueriesTree: () => <div data-testid="saved-queries-tree">Saved Queries Tree</div>,
}));

jest.mock('../../../src/renderer/components/SchemaSidebar/SchemaSidebar', () => ({
  SchemaSidebar: () => <div data-testid="schema-sidebar">Schema Sidebar</div>,
}));

jest.mock('../../../src/renderer/components/SidebarSwitcher/SidebarSwitcher', () => ({
  SidebarSwitcher: ({ currentView, onViewChange }: { currentView: string; onViewChange: (view: string) => void }) => (
    <div data-testid="sidebar-switcher" data-view={currentView}>
      <button onClick={() => onViewChange('explorer')}>Explorer</button>
      <button onClick={() => onViewChange('saved-queries')}>Saved Queries</button>
    </div>
  ),
}));

jest.mock('../../../src/renderer/components/SidebarHeader/SidebarHeader', () => ({
  SidebarHeader: () => <div data-testid="sidebar-header">Sidebar Header</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
  });

  it('renders the main app structure', () => {
    render(<App />);
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('query-editor')).toBeInTheDocument();
    expect(screen.getByTestId('query-results')).toBeInTheDocument();
  });

  it('renders sidebar components', () => {
    render(<App />);
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-switcher')).toBeInTheDocument();
  });
});
````

## File: tests/setup.ts
````typescript
import '@testing-library/jest-dom';

// Mock Electron API
// Using (window as any) to avoid type conflicts with preload.ts
global.window = global.window || {};
(global.window as any).electronAPI = {
  bigquery: {
    execute: jest.fn().mockResolvedValue({}),
    cancel: jest.fn().mockResolvedValue(undefined),
    listDatasets: jest.fn().mockResolvedValue([]),
    listTables: jest.fn().mockResolvedValue([]),
    getTableSchema: jest.fn().mockResolvedValue({ fields: [] }),
    getViewDefinition: jest.fn().mockResolvedValue({ definition: '' }),
    getSampleData: jest.fn().mockResolvedValue({ rows: [], columns: [] }),
  },
  connection: {
    configure: jest.fn().mockResolvedValue(undefined),
    getActive: jest.fn().mockResolvedValue(null),
    getSaved: jest.fn().mockResolvedValue(null),
    restore: jest.fn().mockResolvedValue(null),
    test: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
  queries: {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
  },
  uiSettings: {
    getLeftSidebarWidth: jest.fn().mockResolvedValue(250),
    setLeftSidebarWidth: jest.fn().mockResolvedValue(undefined),
    getRightSidebarWidth: jest.fn().mockResolvedValue(300),
    setRightSidebarWidth: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    getTabs: jest.fn().mockResolvedValue([]),
    getActiveTabId: jest.fn().mockResolvedValue(null),
    saveTabs: jest.fn().mockResolvedValue(undefined),
    onBeforeClose: jest.fn(() => () => {}),
  },
  menu: {
    onShowHelp: jest.fn(() => () => {}),
    onNewTab: jest.fn(() => () => {}),
    onShowAbout: jest.fn(() => () => {}),
    onCloseTab: jest.fn(() => () => {}),
    onSaveQuery: jest.fn(() => () => {}),
    onFormatQuery: jest.fn(() => () => {}),
    onExecuteQuery: jest.fn(() => () => {}),
    onShowConnection: jest.fn(() => () => {}),
    onDisconnect: jest.fn(() => () => {}),
  },
  resultsCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
};

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor');
  },
}));
````

## File: src/renderer/components/HelpDialog/HelpDialog.css
````css
.help-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-dialog {
  background: #252526;
  border-radius: 4px;
  padding: 2rem;
  min-width: 600px;
  max-width: 700px;
  max-height: 80vh;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 1px solid #3e3e42;
  color: #cccccc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-dialog h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 400;
  color: #ffffff;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.help-content::-webkit-scrollbar {
  width: 8px;
}

.help-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.help-content::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 4px;
}

.help-content::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}

.shortcut-category {
  margin-bottom: 2rem;
}

.shortcut-category:last-child {
  margin-bottom: 0;
}

.shortcut-category h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #2d2d30;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  margin-right: 1rem;
}

.shortcut-keys kbd {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #3c3c3c;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: #cccccc;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  min-width: 1.5rem;
  text-align: center;
}

.shortcut-keys span {
  color: #858585;
  font-size: 0.75rem;
}

.shortcut-description {
  flex: 1;
  font-size: 0.8125rem;
  color: #cccccc;
  text-align: right;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #3e3e42;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  background-color: #0e639c;
  color: #ffffff;
}

.dialog-actions button:hover {
  background-color: #1177bb;
}

.donation-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  background-color: #0070f3;
  color: #ffffff;
  text-decoration: none;
  display: inline-block;
  font-family: inherit;
}

.donation-button:hover {
  background-color: #0051cc;
}
````

## File: src/renderer/components/HelpDialog/HelpDialog.tsx
````typescript
import React, { useEffect } from 'react';
import './HelpDialog.css';

interface HelpDialogProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: Shortcut[] = [
    // Help
    { keys: `${modifierKey} + ?`, description: 'Show keyboard shortcuts', category: 'Help' },
    
    // Tab Navigation
    { keys: `${modifierKey} + T`, description: 'New Tab', category: 'Tab Navigation' },
    { keys: `${modifierKey} + 1-9`, description: 'Switch to tab by number (1-9)', category: 'Tab Navigation' },
    
    // Query Editor
    { keys: `${modifierKey} + Enter`, description: 'Execute query', category: 'Query Editor' },
    { keys: `${modifierKey} + B`, description: 'Expand SELECT * to column list', category: 'Query Editor' },
    
    // Edit
    { keys: `${modifierKey} + Z`, description: 'Undo', category: 'Edit' },
    { keys: `${modifierKey} + Shift + Z`, description: 'Redo', category: 'Edit' },
    { keys: `${modifierKey} + X`, description: 'Cut', category: 'Edit' },
    { keys: `${modifierKey} + C`, description: 'Copy', category: 'Edit' },
    { keys: `${modifierKey} + V`, description: 'Paste', category: 'Edit' },
    
    // View
    { keys: `${modifierKey} + =`, description: 'Zoom In', category: 'View' },
    { keys: `${modifierKey} + -`, description: 'Zoom Out', category: 'View' },
    { keys: `${modifierKey} + 0`, description: 'Reset Zoom', category: 'View' },
    { keys: `${modifierKey} + F11`, description: 'Toggle Full Screen', category: 'View' },
    
    // Application
    { keys: isMac ? '⌘ + Q' : 'Ctrl + Q', description: 'Quit Application', category: 'Application' },
  ];

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent closing when clicking inside the dialog
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="help-dialog-overlay" onClick={onClose}>
      <div className="help-dialog" onClick={handleDialogClick}>
        <h2>Keyboard Shortcuts</h2>
        <div className="help-content">
          {categories.map((category) => (
            <div key={category} className="shortcut-category">
              <h3>{category}</h3>
              <div className="shortcut-list">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-keys">
                        {shortcut.keys.split(' + ').map((key, i) => (
                          <React.Fragment key={i}>
                            <kbd>{key}</kbd>
                            {i < shortcut.keys.split(' + ').length - 1 && <span> + </span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/components/SavedQueriesTree/SavedQueriesTree.css
````css
.saved-queries-tree {
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: #252526;
  color: #cccccc;
  border-right: 1px solid #3e3e42;
  overflow: hidden;
  min-height: 0;
}

.saved-queries-tree.collapsed {
  width: 30px;
}

.saved-queries-tree-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  min-height: 35px;
}

.collapse-button {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  border-radius: 3px;
}

.collapse-button:hover {
  background-color: #3e3e42;
}

.saved-queries-tree-title {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.refresh-button {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background-color 0.15s ease;
  border-radius: 3px;
}

.refresh-button:hover:not(:disabled) {
  color: #cccccc;
  background-color: #3e3e42;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.saved-queries-tree-search {
  padding: 0.5rem;
  border-bottom: 1px solid #3e3e42;
  position: relative;
}

.saved-queries-tree-search-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  background-color: #3e3e42;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  color: #cccccc;
  font-size: 0.8125rem;
  box-sizing: border-box;
}

.saved-queries-tree-search-input:focus {
  outline: none;
  border-color: #007acc;
  background-color: #1e1e1e;
}

.saved-queries-tree-search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.saved-queries-tree-search-clear:hover {
  color: #cccccc;
}

.saved-queries-tree-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.25rem;
}

.saved-queries-tree-loading,
.saved-queries-tree-empty {
  padding: 1rem;
  text-align: center;
  color: #858585;
  font-size: 0.8125rem;
}

.saved-query-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 3px;
  margin-bottom: 0.25rem;
  transition: background-color 0.15s ease;
}

.saved-query-item:hover {
  background-color: #2a2d2e;
}

.saved-query-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.saved-query-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.saved-query-name {
  font-size: 0.8125rem;
  color: #cccccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-query-description {
  font-size: 0.75rem;
  color: #858585;
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-menu {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 150px;
}

.context-menu-item {
  padding: 0.5rem 0.75rem;
  color: #cccccc;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.context-menu-item:hover:not(.disabled) {
  background-color: #2a2d2e;
}

.context-menu-item.disabled {
  color: #858585;
  cursor: not-allowed;
  opacity: 0.5;
}

/* Query preview tooltip */
.saved-query-tooltip {
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  max-width: 400px;
  min-width: 200px;
  max-height: 300px;
  overflow: hidden;
}

.saved-query-tooltip-code {
  margin: 0;
  padding: 0.75rem;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  max-height: 284px;
}
````

## File: src/renderer/components/SavedQueriesTree/SavedQueriesTree.tsx
````typescript
import React, { useState, useEffect, useRef, memo } from 'react';
import { useQueriesStore } from '../../stores/queries-store';
import { useTabsStore } from '../../stores/tabs-store';
import type { SavedQuery } from '../../../shared/types/query';
import './SavedQueriesTree.css';

interface SavedQueriesTreeProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefreshReady?: (refreshFn: () => void, isLoading: boolean) => void;
}

const SavedQueriesTreeComponent: React.FC<SavedQueriesTreeProps> = ({ collapsed = false, onToggleCollapse, onRefreshReady }) => {
  const { queries, isLoading, loadQueries, getFilteredQueries, setSearchTerm: setStoreSearchTerm } = useQueriesStore();
  const { createTab, setTabQuery, updateTab, tabs, activeTabId, setActiveTab } = useTabsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    query: SavedQuery;
  } | null>(null);
  const [hoveredQuery, setHoveredQuery] = useState<{
    query: SavedQuery;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    setStoreSearchTerm(searchTerm);
  }, [searchTerm, setStoreSearchTerm]);

  // Expose refresh function and loading state to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(loadQueries, isLoading);
    }
  }, [onRefreshReady, loadQueries, isLoading]);

  const handleQueryContextMenu = (event: React.MouseEvent, query: SavedQuery) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      query,
    });
  };

  const handleQueryMouseEnter = (event: React.MouseEvent, query: SavedQuery) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Add a small delay before showing tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredQuery({
        query,
        x: rect.right + 8,
        y: rect.top,
      });
    }, 300);
  };

  const handleQueryMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay hiding to allow cursor to move into tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredQuery(null);
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    // Cancel the hide timeout when entering tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip when leaving it
    setHoveredQuery(null);
  };

  const handleLoadToNewTab = () => {
    if (!contextMenu) return;
    
    const { query } = contextMenu;
    
    const newTabId = createTab();
    setTabQuery(newTabId, query.sqlText);
    updateTab(newTabId, {
      title: query.name,
      savedQueryId: query.id,
      isModified: false,
    });
    
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu?.visible]);

  // Close context menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu?.visible) {
        setContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu?.visible]);

  // Filter queries based on search term
  const filteredQueries = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return queries;
    }
    return getFilteredQueries();
  }, [queries, searchTerm, getFilteredQueries]);

  return (
    <div className={`saved-queries-tree ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          <div className="saved-queries-tree-search">
            <input
              type="text"
              className="saved-queries-tree-search-input"
              placeholder="Search saved queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
            />
            {searchTerm && (
              <button
                className="saved-queries-tree-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="saved-queries-tree-content">
            {isLoading && queries.length === 0 && (
              <div className="saved-queries-tree-loading">Loading saved queries...</div>
            )}
            {filteredQueries.length === 0 && !isLoading && (
              <div className="saved-queries-tree-empty">
                {searchTerm ? 'No matching queries found' : 'No saved queries yet'}
              </div>
            )}
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className="saved-query-item"
                onContextMenu={(e) => handleQueryContextMenu(e, query)}
                onMouseEnter={(e) => handleQueryMouseEnter(e, query)}
                onMouseLeave={handleQueryMouseLeave}
              >
                <span className="saved-query-icon">📝</span>
                <div className="saved-query-info">
                  <span className="saved-query-name">{query.name}</span>
                  {query.description && (
                    <span className="saved-query-description">{query.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-item" onClick={handleLoadToNewTab}>
            Open in new tab
          </div>
        </div>
      )}
      {hoveredQuery && (
        <div
          className="saved-query-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredQuery.x}px`,
            top: `${hoveredQuery.y}px`,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <pre className="saved-query-tooltip-code">{hoveredQuery.query.sqlText}</pre>
        </div>
      )}
    </div>
  );
};

export const SavedQueriesTree = memo(SavedQueriesTreeComponent, (prevProps, nextProps) => {
  return (
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.onToggleCollapse === nextProps.onToggleCollapse
  );
});
````

## File: src/renderer/components/TabBar/TabBar.css
````css
.tab-bar {
  display: flex;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
  align-items: center;
  height: 35px;
}

.tabs-container {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background-color: #2d2d30;
  border-right: 1px solid #3e3e42;
  cursor: pointer;
  user-select: none;
  min-width: 120px;
  max-width: 200px;
  position: relative;
  height: 35px;
  color: #cccccc;
  transition: background-color 0.15s ease;
}

.tab[draggable='true'] {
  cursor: grab;
}

.tab[draggable='true']:active {
  cursor: grabbing;
}

.tab:hover {
  background-color: #2a2d2e;
}

.tab.active {
  background-color: #1e1e1e;
  border-bottom: 1px solid #007acc;
  color: #ffffff;
}

.tab.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.tab.drag-over {
  border-left: 2px solid #007acc;
  padding-left: calc(0.75rem - 2px);
}

.tab.modified .tab-title::after {
  content: '';
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.modified-indicator {
  color: #007acc;
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.tab-close {
  margin-left: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #858585;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.tab-close:hover {
  background-color: #e81123;
  color: white;
}

.tab-close:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tab-close:disabled:hover {
  background-color: transparent;
  color: #858585;
}

.new-tab-button {
  padding: 0 0.75rem;
  background: none;
  border: none;
  border-left: 1px solid #3e3e42;
  cursor: pointer;
  font-size: 1.25rem;
  color: #858585;
  font-weight: 300;
  height: 35px;
  display: flex;
  align-items: center;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.new-tab-button:hover {
  background-color: #2a2d2e;
  color: #cccccc;
}
````

## File: src/renderer/utils/bigquery-formatter.ts
````typescript
/**
 * Formats BigQuery values for display in the UI
 * Supports all BigQuery data types as per:
 * https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/data-types
 */

// Pre-compile regex patterns for better performance (compiled once, reused many times)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}:\d{2}(\.\d+)?$/;
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Checks if a value is a Date object or Date-like object
 * This handles cases where Date objects might have been serialized/deserialized
 * and are no longer instanceof Date
 */
function isDateLike(value: any): boolean {
  if (value instanceof Date) {
    return true;
  }
  // Check if it's an object with Date-like methods/properties
  if (typeof value === 'object' && value !== null) {
    // Check for Date-like methods
    if (typeof value.getTime === 'function' && typeof value.toISOString === 'function') {
      return true;
    }
    // Check if it has Date-like properties (from serialized Date)
    if ('getTime' in value || 'toISOString' in value || 'getFullYear' in value) {
      return true;
    }
    // CRITICAL: Check for empty objects {} that might be Date objects that were JSON serialized
    // When Date objects are JSON.stringify'd, they become {}, so we need to check column type
    // This is a fallback for objects that lost their Date properties during serialization
    const keys = Object.keys(value);
    if (keys.length === 0 && typeof value === 'object') {
      // Empty object might be a serialized Date - we'll handle this in the formatter based on column type
      return true; // Return true so it gets special handling
    }
  }
  return false;
}

/**
 * Converts a Date-like value to a Date object for formatting
 */
function toDate(value: any): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    // Try to call getTime if available
    if (typeof value.getTime === 'function') {
      try {
        const time = value.getTime();
        if (typeof time === 'number' && !isNaN(time)) {
          return new Date(time);
        }
      } catch {
        // Ignore errors
      }
    }
    // Try to create Date from ISO string if available
    if (typeof value.toISOString === 'function') {
      try {
        const isoStr = value.toISOString();
        const date = new Date(isoStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch {
        // Ignore errors
      }
    }
  }
  return null;
}

/**
 * Formats a BigQuery value based on its column type
 * @param value - The value to format
 * @param columnType - The BigQuery column type (e.g., 'STRING', 'INTEGER', 'TIMESTAMP', etc.)
 * @returns Formatted string representation of the value
 */
export function formatBigQueryValue(value: any, columnType?: string, columnName?: string): string {
  // Handle NULL values - early return for common case
  if (value === null || value === undefined) {
    return 'NULL';
  }

  // Normalize column type early so we can use it for object detection
  const normalizedType = columnType?.toUpperCase() || '';
  const colNameLower = (columnName || '').toLowerCase();
  
  // Check if this is a date type - either by type or by column name
  // This handles cases where DATE/TIME columns were incorrectly typed as RECORD
  const isDateTypeByType = normalizedType === 'DATE' || normalizedType === 'DATETIME' || 
                           normalizedType === 'TIME' || normalizedType === 'TIMESTAMP';
  const isDateTypeByName = normalizedType === 'RECORD' && (
    colNameLower.includes('date') || 
    colNameLower.includes('time') || 
    colNameLower.includes('timestamp') ||
    colNameLower.includes('datetime')
  );
  const isDateType = isDateTypeByType || isDateTypeByName;

  // CRITICAL: Check if value is already the string "[object Object]"
  // This can happen if Date objects were converted to strings before reaching the formatter
  if (typeof value === 'string' && value === '[object Object]') {
    // CRITICAL: Even if column type is wrong (e.g., RECORD), check if column name suggests it's a date
    // This handles cases where DATE/TIME columns were incorrectly typed as RECORD
    if (isDateType) {
      return '[Invalid Date]';
    }
    return value; // For non-date columns, return as-is
  }

  // CRITICAL: Handle plain objects for DATE/TIME types BEFORE anything else
  // This prevents [object Object] from being displayed
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  if (isDateType && isObject) {
    // CRITICAL: Handle empty objects {} that might be Date objects that were JSON serialized
    // When Date objects go through JSON.stringify, they become {}
    const keys = Object.keys(value);
    if (keys.length === 0) {
      // Empty object for a date column - this is likely a Date that was serialized incorrectly
      // Check if it's truly empty or if it has non-enumerable properties
      // Try to detect if this was a Date object by checking the prototype
      const proto = Object.getPrototypeOf(value);
      if (proto === Object.prototype || proto === null) {
        // This is likely a Date object that was JSON.stringify'd to {}
        // Return a placeholder instead of [object Object]
        return '[Invalid Date]';
      }
      // Might be a Date-like object with non-enumerable properties
      // Try to convert it
      if (isDateLike(value)) {
        const dateObj = toDate(value);
        if (dateObj) {
          if (normalizedType === 'DATE') {
            return dateObj.toISOString().split('T')[0];
          }
          if (normalizedType === 'TIME') {
            const hours = String(dateObj.getUTCHours()).padStart(2, '0');
            const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
            const ms = dateObj.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedType === 'DATETIME') {
            return dateObj.toISOString().replace('T', ' ').slice(0, 19);
          }
          return dateObj.toISOString();
        }
      }
      return '[Invalid Date]';
    }
    // Check for wrapped value
    if ('value' in value && Object.keys(value).length === 1) {
      const innerValue = value.value;
      if (innerValue !== value) {
        return formatBigQueryValue(innerValue, columnType);
      }
    }
    
    // Try toString() first
    if ('toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str) || 
              /^\d{4}-\d{2}-\d{2}T/.test(str)) {
            return str;
          }
          // Try to parse it as a date
          const parsed = formatBigQueryValue(str, columnType);
          if (parsed !== str && parsed !== '[object Object]') {
            return parsed;
          }
        }
      } catch {
        // Continue with other checks
      }
    }
    
    // Check all properties for date-like strings
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
        // Check for Date instances and Date-like objects
        if (propValue instanceof Date || isDateLike(propValue)) {
          const dateObj = propValue instanceof Date ? propValue : toDate(propValue);
          if (dateObj) {
            if (normalizedType === 'DATE') {
              return dateObj.toISOString().split('T')[0];
            }
            if (normalizedType === 'DATETIME') {
              return dateObj.toISOString().replace('T', ' ').slice(0, 19);
            }
            return dateObj.toISOString();
          }
        }
      }
    }
    
    // Try JSON.stringify to extract date strings
    try {
      const jsonStr = JSON.stringify(value);
      const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)"/);
      if (dateMatch) {
        return dateMatch[1].replace('T', ' ').replace(/Z$/, '');
      }
      // Try parsing JSON and looking for date strings
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'string' && (/^\d{4}-\d{2}-\d{2}/.test(parsed) || /^\d{2}:\d{2}:\d{2}/.test(parsed))) {
        return parsed;
      }
      // Check all values in parsed object
      for (const key in parsed) {
        if (typeof parsed[key] === 'string' && (/^\d{4}-\d{2}-\d{2}/.test(parsed[key]) || /^\d{2}:\d{2}:\d{2}/.test(parsed[key]))) {
          return parsed[key];
        }
      }
    } catch {
      // JSON operations failed
    }
    
    // Check for date object with year/month/day properties
    if ('year' in value && 'month' in value && 'day' in value) {
      const year = value.year ?? new Date().getFullYear();
      const monthVal = value.month ?? 1;
      const month = String(monthVal).padStart(2, '0');
      const day = String(value.day ?? 1).padStart(2, '0');
      if (normalizedType === 'DATE') {
        return `${year}-${month}-${day}`;
      }
      // For DATETIME/TIMESTAMP, check for time components
      const hours = String(value.hours ?? 0).padStart(2, '0');
      const minutes = String(value.minutes ?? 0).padStart(2, '0');
      const seconds = String(value.seconds ?? 0).padStart(2, '0');
      if (normalizedType === 'DATETIME') {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    }
    
    // Last resort: show object keys instead of [object Object]
    // Reuse the keys variable that was already declared above
    if (keys.length > 0) {
      // Try one more time: check if any property value is a date string
      for (const key of keys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue)) {
            return propValue;
          }
        }
      }
      return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }
    // If object has no keys, return placeholder
    return '[Date Object]';
  }

  // Handle Date objects early - regardless of column type, to prevent [object Object] display
  // Check for both Date instances and Date-like objects (e.g., serialized Dates)
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      // Check if it's a valid date
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Format based on column type if available, otherwise use ISO string
      if (normalizedType === 'DATE') {
        return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      if (normalizedType === 'TIME') {
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const ms = dateObj.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (normalizedType === 'DATETIME') {
        return dateObj.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
      }
      if (normalizedType === 'TIMESTAMP') {
        return dateObj.toISOString();
      }
      // Default: use ISO string for any Date object
      return dateObj.toISOString();
    }
  }
  
  // Also check for Date instances explicitly (for compatibility)
  if (value instanceof Date) {
    // Check if it's a valid date
    if (isNaN(value.getTime())) {
      return 'Invalid Date';
    }
    // Format based on column type if available, otherwise use ISO string
    if (normalizedType === 'DATE') {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (normalizedType === 'TIME') {
      const hours = String(value.getUTCHours()).padStart(2, '0');
      const minutes = String(value.getUTCMinutes()).padStart(2, '0');
      const seconds = String(value.getUTCSeconds()).padStart(2, '0');
      const ms = value.getUTCMilliseconds();
      if (ms > 0) {
        const msStr = String(ms).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${msStr}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    if (normalizedType === 'DATETIME') {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    if (normalizedType === 'TIMESTAMP') {
      return value.toISOString();
    }
    // Default: use ISO string for any Date object
    return value.toISOString();
  }

  // Handle BOOL/BOOLEAN
  if (normalizedType === 'BOOL' || normalizedType === 'BOOLEAN') {
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return 'TRUE';
      if (lower === 'false' || lower === '0') return 'FALSE';
    }
    return String(value);
  }

  // Handle BYTES
  if (normalizedType === 'BYTES') {
    if (typeof value === 'string') {
      // BigQuery returns BYTES as base64-encoded strings
      // Display as hex for better readability
      try {
        const binaryString = atob(value);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return '0x' + Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // If not valid base64, return as-is
        return value;
      }
    }
    if (value instanceof Uint8Array || Array.isArray(value)) {
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      return '0x' + Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String(value);
  }

  // Handle DATE
  if (normalizedType === 'DATE') {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD format, return as-is
      if (DATE_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return value;
    }
    if (typeof value === 'number') {
      // Handle numeric date values (days since epoch)
      const date = new Date(value * 86400000); // Convert days to milliseconds
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    // Handle plain objects that might represent dates
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for date object with year/month/day properties
      if ('year' in value && 'month' in value && 'day' in value) {
        const year = value.year ?? new Date().getFullYear();
        // Handle both 0-indexed (JS) and 1-indexed (BigQuery) months
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Try to extract any string property that looks like a date
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const propValue = value[key];
          if (typeof propValue === 'string' && DATE_REGEX.test(propValue)) {
            return propValue;
          }
          if (typeof propValue === 'string') {
            const date = new Date(propValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
        }
      }
      
      // Try JSON.stringify to see if there's a serializable date value
      try {
        const jsonStr = JSON.stringify(value);
        // Check if JSON contains a date-like string
        const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2})"/);
        if (dateMatch) {
          return dateMatch[1];
        }
        // Try parsing the JSON and looking for date strings
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === 'string' && DATE_REGEX.test(parsed)) {
          return parsed;
        }
        // Check all values in the object
        for (const key in parsed) {
          if (typeof parsed[key] === 'string' && DATE_REGEX.test(parsed[key])) {
            return parsed[key];
          }
        }
      } catch {
        // JSON operations failed, continue
      }
      
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
      
      // Last resort: show object structure instead of [object Object]
      const keys = Object.keys(value);
      if (keys.length > 0) {
        // Try to show first few property values that might be useful
        const preview = keys.slice(0, 3).map(k => {
          const v = value[k];
          if (typeof v === 'string' && v.length < 20) return `${k}:${v}`;
          if (typeof v === 'number') return `${k}:${v}`;
          return k;
        }).join(', ');
        return `{${preview}${keys.length > 3 ? '...' : ''}}`;
      }
      // If object has no keys, return a placeholder instead of [object Object]
      return '[Date Object]';
    }
    // If we get here with an object for a DATE column, something went wrong
    // Return a placeholder instead of [object Object]
    if (typeof value === 'object' && value !== null) {
      return '[Date Object]';
    }
    return String(value);
  }

  // Handle TIME
  if (normalizedType === 'TIME') {
    if (value instanceof Date) {
      const hours = String(value.getUTCHours()).padStart(2, '0');
      const minutes = String(value.getUTCMinutes()).padStart(2, '0');
      const seconds = String(value.getUTCSeconds()).padStart(2, '0');
      const ms = value.getUTCMilliseconds();
      if (ms > 0) {
        const msStr = String(ms).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${msStr}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    if (typeof value === 'string') {
      // If already in HH:mm:ss format, return as-is
      if (TIME_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = date.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      return value;
    }
    if (typeof value === 'number') {
      // Handle numeric time values (milliseconds since midnight)
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = date.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
    }
    // Handle plain objects that might represent time
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for time object with hours/minutes/seconds properties
      if ('hours' in value || 'minutes' in value || 'seconds' in value) {
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
    }
    return String(value);
  }

  // Handle DATETIME
  if (normalizedType === 'DATETIME') {
    if (value instanceof Date) {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD HH:mm:ss format, return as-is
      if (DATETIME_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
      }
      return value;
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
      }
    }
    // Handle plain objects that might represent datetime
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for datetime object with date and time properties
      if (('year' in value && 'month' in value && 'day' in value) ||
          ('hours' in value || 'minutes' in value || 'seconds' in value)) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
    }
    return String(value);
  }

  // Handle TIMESTAMP
  if (normalizedType === 'TIMESTAMP') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      // If already in ISO format, return as-is
      if (ISO_TIMESTAMP_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return value;
    }
    if (typeof value === 'number') {
      // BigQuery timestamps are in microseconds since epoch
      // JavaScript Date uses milliseconds, so divide by 1000 if > 1e12
      const timestampMs = value > 1e12 ? value / 1000 : value;
      const date = new Date(timestampMs);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    // Handle plain objects that might represent timestamp
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for timestamp object with date and time properties
      if (('year' in value && 'month' in value && 'day' in value) ||
          ('hours' in value || 'minutes' in value || 'seconds' in value)) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${msStr}Z`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
    }
    return String(value);
  }

  // Handle INTERVAL
  if (normalizedType === 'INTERVAL') {
    if (typeof value === 'string') {
      // BigQuery INTERVAL format: "Y-M D H:M:S" or similar
      // Return as-is since it's already formatted
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // BigQuery might return interval as an object with parts
      if (value.years !== undefined || value.months !== undefined || 
          value.days !== undefined || value.hours !== undefined ||
          value.minutes !== undefined || value.seconds !== undefined) {
        const parts: string[] = [];
        if (value.years) parts.push(`${value.years} year${value.years !== 1 ? 's' : ''}`);
        if (value.months) parts.push(`${value.months} month${value.months !== 1 ? 's' : ''}`);
        if (value.days) parts.push(`${value.days} day${value.days !== 1 ? 's' : ''}`);
        if (value.hours) parts.push(`${value.hours} hour${value.hours !== 1 ? 's' : ''}`);
        if (value.minutes) parts.push(`${value.minutes} minute${value.minutes !== 1 ? 's' : ''}`);
        if (value.seconds) parts.push(`${value.seconds} second${value.seconds !== 1 ? 's' : ''}`);
        return parts.join(' ') || '0 seconds';
      }
    }
    return String(value);
  }

  // Handle NUMERIC and BIGNUMERIC
  if (normalizedType === 'NUMERIC' || normalizedType === 'BIGNUMERIC') {
    if (typeof value === 'number') {
      // Format with appropriate precision
      // NUMERIC has 38 digits total, 9 after decimal
      // BIGNUMERIC has 76 digits total, 38 after decimal
      // For display, use toFixed to show significant digits
      return value.toLocaleString('en-US', {
        maximumFractionDigits: 38,
        useGrouping: true,
      });
    }
    if (typeof value === 'string') {
      // BigQuery returns NUMERIC/BIGNUMERIC as strings to preserve precision
      // Format with locale-aware number formatting
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return num.toLocaleString('en-US', {
            maximumFractionDigits: 38,
            useGrouping: true,
          });
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    return String(value);
  }

  // Handle INTEGER types (INTEGER, INT64, INT32, INT, etc.)
  if (normalizedType === 'INTEGER' || normalizedType === 'INT' || normalizedType.includes('INT')) {
    if (typeof value === 'number') {
      // Ensure it's displayed as a whole number (no decimal point)
      // Use Math.floor or Math.trunc to remove any decimal part, then convert to string
      const intValue = Number.isInteger(value) ? value : Math.trunc(value);
      return String(intValue); // Convert to string without commas or decimal points
    }
    if (typeof value === 'string') {
      // BigQuery might return large integers as strings
      // Return as-is if it's already a valid integer string (no decimal point, no commas)
      if (/^-?\d+$/.test(value)) {
        return value; // Already a valid integer string, return without commas or periods
      }
      // If string contains a decimal point, parse and truncate to integer
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const intValue = Math.trunc(num); // Remove decimal part
          return String(intValue); // Convert to string without commas or decimal points
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    // For other types, try to convert to integer
    try {
      const num = Number(value);
      if (!isNaN(num)) {
        const intValue = Math.trunc(num);
        return String(intValue);
      }
    } catch {
      // If conversion fails, return as string
    }
    return String(value);
  }

  // Handle FLOAT and FLOAT64
  if (normalizedType === 'FLOAT' || normalizedType === 'FLOAT64') {
    if (typeof value === 'number') {
      // Format floats with reasonable precision
      if (Number.isInteger(value)) {
        return value.toLocaleString('en-US');
      }
      return value.toLocaleString('en-US', {
        maximumFractionDigits: 15,
        useGrouping: true,
      });
    }
    if (typeof value === 'string') {
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          if (Number.isInteger(num)) {
            return num.toLocaleString('en-US');
          }
          return num.toLocaleString('en-US', {
            maximumFractionDigits: 15,
            useGrouping: true,
          });
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    return String(value);
  }

  // Handle GEOGRAPHY
  if (normalizedType === 'GEOGRAPHY') {
    if (typeof value === 'string') {
      // BigQuery GEOGRAPHY is returned as GeoJSON strings
      try {
        const geoJson = JSON.parse(value);
        // Pretty-print GeoJSON
        return JSON.stringify(geoJson, null, 2);
      } catch {
        // If not valid JSON, return as-is
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      // Already parsed GeoJSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle JSON
  if (normalizedType === 'JSON') {
    if (typeof value === 'string') {
      // Try to parse and pretty-print JSON
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not valid JSON, return as-is
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      // Already parsed JSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle ARRAY
  if (normalizedType === 'ARRAY' || Array.isArray(value)) {
    if (Array.isArray(value)) {
      // Format array elements recursively
      const formatted = value.map((item, index) => {
        // For arrays, we don't have per-item type info, so format generically
        const formattedItem = formatBigQueryValue(item);
        return formattedItem;
      });
      return `[${formatted.join(', ')}]`;
    }
    return String(value);
  }

  // Handle STRUCT/RECORD
  if (normalizedType === 'STRUCT' || normalizedType === 'RECORD') {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      // Check if it's a BigQuery date object with a value property
      if (value.value !== undefined && Object.keys(value).length === 1) {
        // Recursively format the inner value (but avoid infinite recursion)
        const innerValue = value.value;
        if (innerValue !== value) {
          return formatBigQueryValue(innerValue, columnType);
        }
      }
      // Format as JSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle plain objects that aren't Date instances - check before STRING fallback
  // This prevents [object Object] display for objects that might represent dates or other types
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it's a wrapped value object (common in some BigQuery responses)
    if (value.value !== undefined && Object.keys(value).length === 1) {
      // Recursively format the inner value (but avoid infinite recursion)
      const innerValue = value.value;
      if (innerValue !== value) {
        return formatBigQueryValue(innerValue, columnType);
      }
    }
    
    // For date/time types, try to extract date from object properties
    if (normalizedType === 'DATE' || normalizedType === 'DATETIME' || normalizedType === 'TIMESTAMP') {
      // Check for common date object properties
      if ('year' in value && 'month' in value && 'day' in value) {
        const year = value.year;
        const month = String(value.month || 0).padStart(2, '0');
        const day = String(value.day || 0).padStart(2, '0');
        if (normalizedType === 'DATE') {
          return `${year}-${month}-${day}`;
        }
        // For DATETIME/TIMESTAMP, check for time components
        const hours = String(value.hours || 0).padStart(2, '0');
        const minutes = String(value.minutes || 0).padStart(2, '0');
        const seconds = String(value.seconds || 0).padStart(2, '0');
        if (normalizedType === 'DATETIME') {
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      // Try to find a string representation in common properties
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
    }
    
    // For other object types, try JSON stringify
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // If JSON.stringify fails, return a descriptive string
      return `[Object: ${Object.keys(value).join(', ')}]`;
    }
  }

  // CRITICAL: Before falling back to String(value), check if this is an object for a date/time type
  // This is a final safety net to prevent [object Object] display
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    // Try one more time to extract a date string
    try {
      const jsonStr = JSON.stringify(value);
      // Look for any date-like pattern in the JSON
      const datePatterns = [
        /"(\d{4}-\d{2}-\d{2})"/,  // DATE format
        /"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,  // TIMESTAMP format
        /"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,  // DATETIME format
        /"(\d{2}:\d{2}:\d{2})/,  // TIME format
      ];
      
      for (const pattern of datePatterns) {
        const match = jsonStr.match(pattern);
        if (match) {
          let dateStr = match[1];
          if (normalizedType === 'DATE' && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (normalizedType === 'DATETIME' && dateStr.includes('T')) {
            dateStr = dateStr.replace('T', ' ');
          }
          return dateStr;
        }
      }
      
      // If no date pattern found, show object structure
      const keys = Object.keys(value);
      if (keys.length > 0) {
        // Try to show first property value
        const firstKey = keys[0];
        const firstValue = value[firstKey];
        if (typeof firstValue === 'string' && firstValue.length < 50) {
          return firstValue;
        }
        return `{${keys.slice(0, 2).join(', ')}}`;
      }
      return '[Date Object]';
    } catch {
      // JSON.stringify failed
      const keys = Object.keys(value);
      return keys.length > 0 ? `{${keys.slice(0, 2).join(', ')}}` : '[Date Object]';
    }
  }

  // Handle STRING (default case)
  if (normalizedType === 'STRING' || normalizedType === '') {
    // CRITICAL: Before converting to string, check if it's a Date-like object
    // This prevents [object Object] from being displayed for Date objects
    if (isDateLike(value)) {
      const dateObj = toDate(value);
      if (dateObj) {
        if (isNaN(dateObj.getTime())) {
          return 'Invalid Date';
        }
        return dateObj.toISOString();
      }
    }
    
    // Before converting to string, check if it's an object
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      // Try JSON.stringify for objects
      try {
        return JSON.stringify(value);
      } catch {
        return `[Object: ${Object.keys(value).join(', ')}]`;
      }
    }
    
    // Check for Date instance one more time
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return 'Invalid Date';
      }
      return value.toISOString();
    }
    
    return String(value);
  }

  // Fallback for any other types
  // CRITICAL: Before using String(value), check if it's a Date-like object
  // This prevents [object Object] from being displayed for Date objects
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      // Format based on column type if available, otherwise use ISO string
      if (normalizedType === 'DATE') {
        return dateObj.toISOString().split('T')[0];
      }
      if (normalizedType === 'TIME') {
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const ms = dateObj.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (normalizedType === 'DATETIME') {
        return dateObj.toISOString().replace('T', ' ').slice(0, 19);
      }
      if (normalizedType === 'TIMESTAMP') {
        return dateObj.toISOString();
      }
      return dateObj.toISOString();
    }
  }
  
  // CRITICAL: Check for empty objects {} for date types BEFORE general object handling
  // Empty objects for date columns are likely Date objects that were JSON serialized
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const objKeys = Object.keys(value);
    if (objKeys.length === 0) {
      // Empty object for a date column - this is a Date that was serialized incorrectly
      return '[Invalid Date]';
    }
  }
  
  // Before using String(value), check if it's an object
  // Exclude Date instances and Date-like objects to prevent [object Object] display
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
      !(value instanceof Date) && !isDateLike(value)) {
    // CRITICAL: For date types, never return [object Object]
    if (isDateType) {
      const objKeys = Object.keys(value);
      if (objKeys.length === 0) {
        return '[Invalid Date]';
      }
      // Try to extract any useful information
      try {
        const jsonStr = JSON.stringify(value);
        if (jsonStr === '{}') {
          return '[Invalid Date]';
        }
        return jsonStr;
      } catch {
        return `[Object: ${objKeys.join(', ')}]`;
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return `[Object: ${Object.keys(value).join(', ')}]`;
    }
  }
  
  // Final fallback - but check for Date and Date-like objects one more time to be safe
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return dateObj.toISOString();
    }
  }
  
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return 'Invalid Date';
    }
    return value.toISOString();
  }
  
  // CRITICAL: Last check before String(value) - if it's a date type and an object, don't convert to string
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    return '[Invalid Date]';
  }
  
  return String(value);
}
````

## File: src/shared/types/query.ts
````typescript
/**
 * Query-related types
 */

export type TabType = 'query' | 'explorer' | 'saved-queries';

export interface QueryTab {
  id: string;
  title: string;
  type?: TabType; // 'query' by default, 'explorer' for Explorer tab
  queryText: string;
  isModified: boolean;
  executionStatus: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  jobId?: string;
  results?: QueryResult;
  error?: string;
  lastExecuted?: string; // ISO timestamp
  lastExecutedQueryText?: string; // The query text that was last executed
  savedQueryId?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  sqlText: string;
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  tags?: string[];
}

export interface SaveQueryInput {
  name: string;
  sqlText: string;
  description?: string;
  tags?: string[];
}

export interface UpdateQueryInput {
  name?: string;
  sqlText?: string;
  description?: string;
  tags?: string[];
}

export interface QueryResult {
  columns: ColumnMetadata[];
  rows: Row[];
  totalRows: number;
  rowsReturned: number;
  executionTimeMs: number;
  bytesProcessed?: number;
  jobId: string;
  hasMore: boolean;
}

export interface ColumnMetadata {
  name: string;
  type: string; // BigQuery type: STRING, INTEGER, FLOAT, etc.
  mode?: string; // NULLABLE, REQUIRED, REPEATED
}

export interface Row {
  values: any[]; // Values matching column order
}
````

## File: .gitignore
````
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
yarn.lock
pnpm-lock.yaml
PROJECT_REFERENCE.md

# Build outputs
dist/
build/
out/
*.tsbuildinfo

# Electron
*.asar
*.dmg
*.exe
*.deb
*.rpm
*.AppImage

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Logs
*.log
logs/
*.log.*

# Testing
coverage/
.nyc_output/
*.test.js.snap

# Temporary files
*.tmp
*.temp
.cache/

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Desktop.ini

# Electron specific
app/dist/
release/
````

## File: src/main/preload.ts
````typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { ConnectionConfig, ConnectionConfiguration } from '../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata, QueryTab, Row } from '../shared/types/query';
import type { Dataset, Table } from '../shared/types/dataset';

/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string): Promise<QueryResult>;
    cancel(jobId: string): Promise<void>;
    listDatasets(): Promise<Dataset[]>;
    listTables(datasetId: string): Promise<Table[]>;
    getTableSchema(datasetId: string, tableId: string): Promise<{ 
      fields: ColumnMetadata[];
      metadata?: {
        creationTime?: number;
        lastModifiedTime?: number;
        numRows?: number;
        numBytes?: number;
      };
    }>;
    getViewDefinition(datasetId: string, tableId: string): Promise<{ definition: string }>;
  };

  // Connection management
  connection: {
    configure(config: ConnectionConfig): Promise<void>;
    getActive(): Promise<ConnectionConfiguration | null>;
    getSaved(): Promise<ConnectionConfiguration | null>;
    restore(): Promise<ConnectionConfiguration | null>;
    test(config: ConnectionConfig): Promise<boolean>;
    disconnect(): Promise<void>;
  };

  // Saved queries
  queries: {
    list(): Promise<SavedQuery[]>;
    get(id: string): Promise<SavedQuery>;
    save(query: SaveQueryInput): Promise<SavedQuery>;
    update(id: string, updates: UpdateQueryInput): Promise<SavedQuery>;
    delete(id: string): Promise<void>;
    search(term: string): Promise<SavedQuery[]>;
  };

  // UI settings
  uiSettings: {
    getLeftSidebarWidth(): Promise<number>;
    setLeftSidebarWidth(width: number): Promise<void>;
    getRightSidebarWidth(): Promise<number>;
    setRightSidebarWidth(width: number): Promise<void>;
  };

  // Tabs management
  tabs: {
    getTabs(): Promise<QueryTab[]>;
    getActiveTabId(): Promise<string | null>;
    saveTabs(tabs: QueryTab[], activeTabId: string | null): Promise<void>;
    onBeforeClose(callback: () => void): () => void;
  };

  // Results cache
  resultsCache: {
    save(tabId: string, results: QueryResult): Promise<void>;
    get(tabId: string): Promise<QueryResult | null>;
    getMetadata(tabId: string): Promise<{
      columns: ColumnMetadata[];
      totalRows: number;
      rowsReturned: number;
      executionTimeMs: number;
      bytesProcessed?: number;
      jobId: string;
      hasMore: boolean;
    } | null>;
    getPage(tabId: string, pageNumber: number): Promise<Row[] | null>;
    delete(tabId: string): Promise<void>;
    clear(): Promise<void>;
  };

  // Menu events
  menu: {
    onShowHelp(callback: () => void): () => void;
    onNewTab(callback: () => void): () => void;
    onShowAbout(callback: () => void): () => void;
  };

  // App info
  app: {
    getVersion(): Promise<string>;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string) =>
      ipcRenderer.invoke('bigquery:execute', queryText, projectId),
    cancel: (jobId: string) => ipcRenderer.invoke('bigquery:cancel', jobId),
    listDatasets: () => ipcRenderer.invoke('bigquery:listDatasets'),
    listTables: (datasetId: string) => ipcRenderer.invoke('bigquery:listTables', datasetId),
    getTableSchema: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getTableSchema', datasetId, tableId),
    getViewDefinition: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getViewDefinition', datasetId, tableId),
  },
  connection: {
    configure: (config: ConnectionConfig) =>
      ipcRenderer.invoke('connection:configure', config),
    getActive: () => ipcRenderer.invoke('connection:getActive'),
    getSaved: () => ipcRenderer.invoke('connection:getSaved'),
    restore: () => ipcRenderer.invoke('connection:restore'),
    test: (config: ConnectionConfig) => ipcRenderer.invoke('connection:test', config),
    disconnect: () => ipcRenderer.invoke('connection:disconnect'),
  },
  queries: {
    list: () => ipcRenderer.invoke('queries:list'),
    get: (id: string) => ipcRenderer.invoke('queries:get', id),
    save: (query: SaveQueryInput) => ipcRenderer.invoke('queries:save', query),
    update: (id: string, updates: UpdateQueryInput) =>
      ipcRenderer.invoke('queries:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('queries:delete', id),
    search: (term: string) => ipcRenderer.invoke('queries:search', term),
  },
  uiSettings: {
    getLeftSidebarWidth: () => ipcRenderer.invoke('ui-settings:getLeftSidebarWidth'),
    setLeftSidebarWidth: (width: number) => ipcRenderer.invoke('ui-settings:setLeftSidebarWidth', width),
    getRightSidebarWidth: () => ipcRenderer.invoke('ui-settings:getRightSidebarWidth'),
    setRightSidebarWidth: (width: number) => ipcRenderer.invoke('ui-settings:setRightSidebarWidth', width),
  },
  tabs: {
    getTabs: () => ipcRenderer.invoke('tabs:getTabs'),
    getActiveTabId: () => ipcRenderer.invoke('tabs:getActiveTabId'),
    saveTabs: (tabs: QueryTab[], activeTabId: string | null) =>
      ipcRenderer.invoke('tabs:saveTabs', tabs, activeTabId),
    onBeforeClose: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('app:before-close', handler);
      return () => ipcRenderer.removeListener('app:before-close', handler);
    },
  },
  resultsCache: {
    save: (tabId: string, results: QueryResult) =>
      ipcRenderer.invoke('results-cache:save', tabId, results),
    get: (tabId: string) => ipcRenderer.invoke('results-cache:get', tabId),
    getMetadata: (tabId: string) => ipcRenderer.invoke('results-cache:getMetadata', tabId),
    getPage: (tabId: string, pageNumber: number) =>
      ipcRenderer.invoke('results-cache:getPage', tabId, pageNumber),
    delete: (tabId: string) => ipcRenderer.invoke('results-cache:delete', tabId),
    clear: () => ipcRenderer.invoke('results-cache:clear'),
  },
  menu: {
    onShowHelp: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:show-help', handler);
      return () => ipcRenderer.removeListener('menu:show-help', handler);
    },
    onNewTab: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:new-tab', handler);
      return () => ipcRenderer.removeListener('menu:new-tab', handler);
    },
    onShowAbout: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:show-about', handler);
      return () => ipcRenderer.removeListener('menu:show-about', handler);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
} as ElectronAPI);

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
````

## File: src/renderer/components/SampleDataModal/SampleDataModal.tsx
````typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBigQuery } from '../../hooks/useBigQuery';
import { CanvasTable } from '../QueryResults/CanvasTable';
import type { QueryResult } from '../../../shared/types/query';
import { formatBigQueryValue } from '../../utils/bigquery-formatter';
import './SampleDataModal.css';

interface SampleDataModalProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

const ROWS_PER_PAGE = 200;

export const SampleDataModal: React.FC<SampleDataModalProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const { executeQuery, isConnected } = useBigQuery();
  const [results, setResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    const loadSampleData = async () => {
      if (!isConnected) {
        setError('Not connected to BigQuery');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;
        const queryText = `SELECT * FROM ${tableRef} LIMIT 1000`;
        const result = await executeQuery(queryText);
        setResults(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load sample data');
        console.error('Failed to load sample data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleData();
  }, [projectId, datasetId, tableId, executeQuery, isConnected]);

  const handleColumnResize = useCallback((columnIndex: number, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnIndex]: width,
    }));
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, _rowIndex: number) => {
    // No-op for sample data modal - could be extended in the future
    e.preventDefault();
  }, []);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, _columnIndex: number) => {
    // No-op for sample data modal - could be extended in the future
    e.preventDefault();
  }, []);

  const handleSortColumn = useCallback((columnIndex: number, direction: 'asc' | 'desc') => {
    setSortColumn(columnIndex);
    setSortDirection(direction);
  }, []);

  const formatValue = useCallback((value: any, columnType?: string, columnName?: string): string => {
    return formatBigQueryValue(value, columnType, columnName);
  }, []);

  // Sort rows based on selected column and direction
  const sortedRows = useMemo(() => {
    if (!results?.rows || sortColumn === null || sortDirection === null) {
      return results?.rows || [];
    }

    const sorted = [...results.rows].sort((a, b) => {
      const aValue = a.values[sortColumn];
      const bValue = b.values[sortColumn];
      const column = results.columns[sortColumn];
      const columnType = (column?.type || '').toUpperCase();

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) {
        return bValue === null || bValue === undefined ? 0 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // Compare based on column type
      if (columnType === 'INTEGER' || columnType === 'INT' || columnType.includes('INT')) {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'FLOAT' || columnType === 'NUMERIC' || columnType === 'BIGNUMERIC') {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'BOOLEAN' || columnType === 'BOOL') {
        comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
      } else if (columnType === 'DATE' || columnType === 'DATETIME' || columnType === 'TIMESTAMP') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        comparison = aDate - bDate;
      } else {
        // String comparison (case-insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [results?.rows, results?.columns, sortColumn, sortDirection]);

  // Pagination calculations
  const totalRows = sortedRows.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  // Create a QueryResult-like object for the CanvasTable with paginated rows
  const paginatedResults: QueryResult | null = results
    ? {
        ...results,
        rows: paginatedRows,
      }
    : null;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="sample-data-modal-overlay" onClick={onClose}>
      <div className="sample-data-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sample-data-modal-header">
          <h2>Sample Data: {datasetId}.{tableId}</h2>
          <button className="sample-data-modal-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>
        
        <div className="sample-data-modal-content">
          {isLoading && (
            <div className="sample-data-loading">
              <div className="loading-progress-bar">
                <div className="loading-progress-bar-fill"></div>
              </div>
              <div className="loading-text">Loading sample data...</div>
            </div>
          )}
          
          {error && (
            <div className="sample-data-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {!isLoading && !error && results && (
            <>
              <div className="sample-data-info">
                <span>{results.rowsReturned.toLocaleString()} rows</span>
                {results.totalRows > results.rowsReturned && (
                  <span> of {results.totalRows.toLocaleString()} total</span>
                )}
                <span> • {results.executionTimeMs}ms</span>
                {results.bytesProcessed && (
                  <span> • {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
                )}
              </div>
              
              {paginatedResults && paginatedResults.rows.length > 0 ? (
                <>
                  <div className="sample-data-canvas-container">
                    <CanvasTable
                      results={paginatedResults}
                      columnWidths={columnWidths}
                      onColumnResize={handleColumnResize}
                      onRowContextMenu={handleRowContextMenu}
                      onColumnContextMenu={handleColumnContextMenu}
                      formatValue={formatValue}
                      currentPage={currentPage}
                      rowsPerPage={ROWS_PER_PAGE}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSortColumn={handleSortColumn}
                    />
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="sample-data-pagination">
                      <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        title="Previous page"
                      >
                        ‹
                      </button>
                      <span className="pagination-info">
                        {startIndex + 1}-{endIndex} of {totalRows.toLocaleString()}
                      </span>
                      <button
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        title="Next page"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="sample-data-empty">No data available</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
````

## File: src/renderer/components/TabBar/TabBar.tsx
````typescript
import React, { useState, useRef, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import './TabBar.css';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, createTab, reorderTabs } = useTabsStore();
  // Filter out Explorer and Saved Queries tabs (they're now in the sidebar)
  const queryTabs = tabs.filter(tab => tab.type === 'query');
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragImageRef = useRef<HTMLCanvasElement | null>(null);

  // Create a transparent drag image canvas once
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
    }
    dragImageRef.current = canvas;
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = queryTabs.find((t) => t.id === tabId);
    
    if (tab?.isModified) {
      const confirmed = window.confirm(
        'This tab has unsaved changes. Are you sure you want to close it?'
      );
      if (!confirmed) return;
    }
    closeTab(tabId);
  };

  const handleNewTab = () => {
    createTab();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Don't start drag if clicking on the close button
    const target = e.target as HTMLElement;
    if (target.closest('.tab-close')) {
      e.preventDefault();
      return;
    }
    
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Set data to enable drag
    
    // Use a transparent canvas as drag image to prevent default browser drag image (globe icon)
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    // Map dropIndex from queryTabs array back to full tabs array
    const dropTab = queryTabs[dropIndex];
    if (!dropTab) {
      setDraggedTabIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const actualDropIndex = tabs.findIndex(t => t.id === dropTab.id);
    const actualDragIndex = draggedTabIndex !== null ? tabs.findIndex(t => t.id === queryTabs[draggedTabIndex]?.id) : null;
    
    if (actualDragIndex !== null && actualDragIndex !== -1 && actualDropIndex !== -1 && actualDragIndex !== actualDropIndex) {
      reorderTabs(actualDragIndex, actualDropIndex);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {queryTabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.isModified ? 'modified' : ''} ${
              draggedTabIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.isModified && <span className="modified-indicator">●</span>}
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(e, tab.id)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              ×
            </button>
          </div>
        ))}
        <button className="new-tab-button" onClick={handleNewTab} title="New Tab">
          +
        </button>
      </div>
    </div>
  );
};
````

## File: src/main/ipc/bigquery.ts
````typescript
import { ipcMain } from 'electron';
import { getBigQueryClient, getActiveConnection } from './connection';
import type { QueryResult, ColumnMetadata, Row } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

/**
 * Serializes a value to ensure it can be cloned and sent through IPC.
 * Handles Date objects, BigNumber objects, Buffers, and nested structures.
 * Uses a WeakSet to track visited objects to prevent circular reference issues.
 * @param value - The value to serialize
 * @param visited - WeakSet to track visited objects (for circular reference detection)
 * @param columnType - Optional BigQuery column type (e.g., 'DATE', 'TIMESTAMP') to help with serialization
 */
function serializeValue(value: any, visited: WeakSet<object> = new WeakSet(), columnType?: string): any {
  // Normalize column type early so it's available throughout the function
  const normalizedColumnType = columnType?.toUpperCase() || '';
  const isDateType = normalizedColumnType === 'DATE' || normalizedColumnType === 'DATETIME' || 
                     normalizedColumnType === 'TIME' || normalizedColumnType === 'TIMESTAMP';
  
  // Handle null and undefined
  if (value === null || value === undefined) {
    return null;
  }

  // CRITICAL: Handle BigQueryDate/BigQueryTime objects FIRST, before any other object handling
  // These objects have a 'value' property containing the string representation
  // This must come BEFORE Date instance check because BigQueryDate is not instanceof Date
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it's a BigQuery date/time object with a 'value' property
    // This is the most common pattern: BigQueryDate { value: '2025-11-27' }
    if ('value' in value && typeof value.value === 'string') {
      const valueStr = value.value;
      // Verify it looks like a date/time string
      if (/^\d{4}-\d{2}-\d{2}/.test(valueStr) || /^\d{2}:\d{2}:\d{2}/.test(valueStr) || 
          /^\d{4}-\d{2}-\d{2}T/.test(valueStr)) {
        return valueStr;
      }
    }
  }

  // Handle Date objects - convert to ISO string
  // This MUST happen before any object handling to prevent Date objects from being serialized as {}
  if (value instanceof Date) {
    // Check if it's a valid date
    if (isNaN(value.getTime())) {
      return null; // Invalid dates become null
    }
    // Format based on column type if available
    if (normalizedColumnType === 'DATE') {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (normalizedColumnType === 'TIME') {
      const hours = String(value.getUTCHours()).padStart(2, '0');
      const minutes = String(value.getUTCMinutes()).padStart(2, '0');
      const seconds = String(value.getUTCSeconds()).padStart(2, '0');
      const ms = value.getUTCMilliseconds();
      if (ms > 0) {
        const msStr = String(ms).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${msStr}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    if (normalizedColumnType === 'DATETIME') {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    // Default: ISO string for TIMESTAMP or unknown
    return value.toISOString();
  }
  
  // CRITICAL: Check for Date-like objects BEFORE general object handling
  // BigQuery might return Date objects that aren't instanceof Date
  // Check for objects with Date-like methods or properties
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it has Date-like methods (might be a serialized Date or BigQuery Date object)
    if (typeof value.getTime === 'function' || typeof value.toISOString === 'function') {
      try {
        // Try to convert to Date
        let date: Date | null = null;
        if (typeof value.getTime === 'function') {
          const time = value.getTime();
          if (typeof time === 'number' && !isNaN(time)) {
            date = new Date(time);
          }
        } else if (typeof value.toISOString === 'function') {
          const isoStr = value.toISOString();
          date = new Date(isoStr);
        }
        
        if (date && !isNaN(date.getTime())) {
          // Format based on column type
          if (normalizedColumnType === 'DATE') {
            return date.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            const ms = date.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedColumnType === 'DATETIME') {
            return date.toISOString().replace('T', ' ').slice(0, 19);
          }
          return date.toISOString();
        }
      } catch {
        // If conversion fails, continue with normal handling
      }
    }
  }

  // Handle Buffer objects - convert to base64 string
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  // Handle BigNumber-like objects (from @google-cloud/bigquery)
  // Check for common BigNumber properties
  if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    // Check if it's a BigNumber by looking for valueOf or toNumber methods
    if ('valueOf' in value || 'toNumber' in value) {
      try {
        // Try to convert to number first, fallback to string
        const numValue = typeof value.valueOf === 'function' ? value.valueOf() : value;
        if (typeof numValue === 'number' && !isNaN(numValue) && isFinite(numValue)) {
          return numValue;
        }
        return String(value);
      } catch {
        return String(value);
      }
    }
  }

  // Handle arrays - recursively serialize each element
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, visited, columnType));
  }

  // Handle BigQuery DATE/DATETIME/TIME/TIMESTAMP objects
  // BigQuery may return these as objects with special properties or methods
  // This must come after array check but before general object handling
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // CRITICAL: For DATE/TIME columns, ANY object that isn't a Date instance should be handled specially
    // BigQuery might return DATE as objects in various formats
    if (isDateType) {
      // CRITICAL: Check for BigQuery date/time objects with a 'value' property FIRST
      // BigQueryDate/BigQueryTime objects have a 'value' property containing the string representation
      // This check should be very lenient - just check if 'value' exists and is a string
      if ('value' in value) {
        const innerValue = value.value;
        // If inner value is a string, return it directly (this is the most common case)
        if (typeof innerValue === 'string') {
          return innerValue;
        }
        // If inner value is a Date, convert to ISO string
        if (innerValue instanceof Date) {
          if (normalizedColumnType === 'DATE') {
            return innerValue.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
            const hours = String(innerValue.getUTCHours()).padStart(2, '0');
            const minutes = String(innerValue.getUTCMinutes()).padStart(2, '0');
            const seconds = String(innerValue.getUTCSeconds()).padStart(2, '0');
            const ms = innerValue.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedColumnType === 'DATETIME') {
            return innerValue.toISOString().replace('T', ' ').slice(0, 19);
          }
          return innerValue.toISOString();
        }
        // Recursively serialize the inner value
        return serializeValue(innerValue, visited, columnType);
      }
      
      // Check for BigQuery Date object structure - might have year, month, day properties
      if ('year' in value || 'month' in value || 'day' in value) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        if (normalizedColumnType === 'DATE') {
          return `${year}-${month}-${day}`;
        }
        // For DATETIME/TIMESTAMP, check for time components
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        if (normalizedColumnType === 'DATETIME') {
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      
      // Check for TIME object structure
      if (normalizedColumnType === 'TIME' && ('hours' in value || 'minutes' in value || 'seconds' in value)) {
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // For any other object structure for DATE/TIME, try to extract a string value
      // Check all properties for date-like strings
      const objKeys = Object.keys(value);
      for (const key of objKeys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
      }
      
      // If we can't extract a date string, return a placeholder instead of serializing to {}
      return '[Invalid Date Object]';
    }
    
    // For non-date types, check if it's a BigQuery date object with a value property
    if ('value' in value && Object.keys(value).length === 1) {
      const innerValue = value.value;
      // If inner value is a string that looks like a date, return it
      if (typeof innerValue === 'string') {
        return innerValue;
      }
      // If inner value is a Date, convert to ISO string
      if (innerValue instanceof Date) {
        return innerValue.toISOString();
      }
      // Recursively serialize the inner value
      return serializeValue(innerValue, visited, columnType);
    }
    
    // For DATE/TIME columns, try toString() first before checking properties
    if (isDateType && 'toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str) || 
              /^\d{4}-\d{2}-\d{2}T/.test(str)) {
            return str;
          }
        }
      } catch {
        // Continue with property checking if toString fails
      }
      
      // Also check if any property value is a date-like string
      const keys = Object.keys(value);
      for (const key of keys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
      }
    }
    
    // Check for date-like objects with year/month/day properties
    if ('year' in value && 'month' in value && 'day' in value) {
      const year = value.year;
      const month = String(value.month ?? 1).padStart(2, '0');
      const day = String(value.day ?? 1).padStart(2, '0');
      // Check if it also has time components (DATETIME/TIMESTAMP)
      if ('hours' in value || 'minutes' in value || 'seconds' in value) {
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${msStr}Z`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      // Just date components (DATE)
      return `${year}-${month}-${day}`;
    }
    
    // Check for time-only objects (TIME)
    if (('hours' in value || 'minutes' in value || 'seconds' in value) && 
        !('year' in value || 'month' in value || 'day' in value)) {
      const hours = String(value.hours ?? 0).padStart(2, '0');
      const minutes = String(value.minutes ?? 0).padStart(2, '0');
      const seconds = String(value.seconds ?? 0).padStart(2, '0');
      const ms = value.milliseconds ?? 0;
      if (ms > 0) {
        const msStr = String(ms).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${msStr}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // Try to call toString() if it exists and might give us a useful string
    // (Only if we haven't already tried it above for date types)
    if (!isDateType && 'toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        // If toString gives us something useful (not [object Object]), use it
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str)) {
            return str;
          }
        }
      } catch {
        // Ignore toString errors
      }
    }
  }

  // Handle objects - recursively serialize each property
  if (typeof value === 'object') {
    // Check for circular references
    if (visited.has(value)) {
      return '[Circular]';
    }
    visited.add(value);

    try {
      // Check if it's a plain object (not a class instance)
      const proto = Object.getPrototypeOf(value);
      if (proto === null || proto === Object.prototype) {
        // For DATE/TIME columns, be very aggressive about converting objects to strings
        if (isDateType) {
          // Try toString() first
          if ('toString' in value && typeof value.toString === 'function') {
            try {
              const str = value.toString();
              if (str && str !== '[object Object]' && typeof str === 'string') {
                // Check if it looks like a date/time string
                if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str) || 
                    /^\d{4}-\d{2}-\d{2}T/.test(str)) {
                  return str;
                }
              }
            } catch {
              // Continue with property checking if toString fails
            }
          }
          
          // Check all properties for date-like strings
          const keys = Object.keys(value);
          for (const key of keys) {
            const propValue = value[key];
            if (typeof propValue === 'string') {
              // Check if it looks like a date/time string
              if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
                  /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
                return propValue;
              }
            }
            // If property is a Date, convert it
            if (propValue instanceof Date) {
              if (normalizedColumnType === 'DATE') {
                return propValue.toISOString().split('T')[0];
              }
              return propValue.toISOString();
            }
          }
          
          // If we still haven't found a date string, try JSON.stringify to extract it
          try {
            const jsonStr = JSON.stringify(value);
            const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)"/);
            if (dateMatch) {
              const dateStr = dateMatch[1];
              if (normalizedColumnType === 'DATE') {
                return dateStr.split('T')[0]; // Just the date part
              }
              return dateStr.replace('T', ' ').replace(/Z$/, '');
            }
            // Also try to find any date-like string in the JSON
            const allDateMatches = jsonStr.matchAll(/"(\d{4}-\d{2}-\d{2}[^"]*)"/g);
            for (const match of allDateMatches) {
              const dateStr = match[1];
              if (normalizedColumnType === 'DATE' && !dateStr.includes('T') && !dateStr.includes(':')) {
                return dateStr;
              }
              if (normalizedColumnType !== 'DATE' && (dateStr.includes('T') || dateStr.includes(':'))) {
                return dateStr.replace('T', ' ').replace(/Z$/, '');
              }
            }
          } catch {
            // JSON.stringify failed, continue with normal serialization
          }
          
          // Last resort for DATE columns: convert object to string representation
          // This prevents [object Object] from being sent through IPC
          if (normalizedColumnType === 'DATE' || normalizedColumnType === 'DATETIME' || 
              normalizedColumnType === 'TIMESTAMP') {
            // Try to create a meaningful string from the object
            const keys = Object.keys(value);
            if (keys.length === 0) {
              return '[Empty Date Object]';
            }
            // Return first property value if it's a string or number
            const firstKey = keys[0];
            const firstValue = value[firstKey];
            if (typeof firstValue === 'string') {
              return firstValue;
            }
            if (typeof firstValue === 'number') {
              // Try to interpret as date
              const date = new Date(firstValue > 1e12 ? firstValue / 1000 : firstValue);
              if (!isNaN(date.getTime())) {
                if (normalizedColumnType === 'DATE') {
                  return date.toISOString().split('T')[0];
                }
                return date.toISOString();
              }
            }
            // Return object structure as string
            return `{${keys.slice(0, 2).join(', ')}}`;
          }
        } else {
          // For non-date types, check if this might be a date-like object
          // that we missed in the earlier check (e.g., has a custom toString that returns a date)
          const keys = Object.keys(value);
          // If object has very few keys and one looks date-like, try toString first
          if (keys.length <= 3 && 'toString' in value && typeof value.toString === 'function') {
            try {
              const str = value.toString();
              if (str && str !== '[object Object]' && typeof str === 'string') {
                // Check if it looks like a date/time string
                if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str)) {
                  return str;
                }
              }
            } catch {
              // Continue with normal serialization if toString fails
            }
          }
        }
        
        const serialized: any = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            serialized[key] = serializeValue(value[key], visited, columnType);
          }
        }
        // CRITICAL: If serialized object is empty {} and this is a date type, return placeholder
        // This prevents empty objects from being stored and later displayed as "[object Object]"
        if (Object.keys(serialized).length === 0 && isDateType) {
          return '[Invalid Date]';
        }
        return serialized;
      } else {
        // For non-plain objects (class instances), try to serialize
        // CRITICAL: Check for Date objects BEFORE JSON.stringify/parse
        // JSON.stringify converts Date objects to {}, which then becomes [object Object]
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            return null;
          }
          if (normalizedColumnType === 'DATE') {
            return value.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
            const hours = String(value.getUTCHours()).padStart(2, '0');
            const minutes = String(value.getUTCMinutes()).padStart(2, '0');
            const seconds = String(value.getUTCSeconds()).padStart(2, '0');
            const ms = value.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedColumnType === 'DATETIME') {
            return value.toISOString().replace('T', ' ').slice(0, 19);
          }
          return value.toISOString();
        }
        
        // Check for Date-like objects (objects with Date methods)
        if (typeof value.getTime === 'function' || typeof value.toISOString === 'function') {
          try {
            let date: Date | null = null;
            if (typeof value.getTime === 'function') {
              const time = value.getTime();
              if (typeof time === 'number' && !isNaN(time)) {
                date = new Date(time);
              }
            } else if (typeof value.toISOString === 'function') {
              const isoStr = value.toISOString();
              date = new Date(isoStr);
            }
            
            if (date && !isNaN(date.getTime())) {
              if (normalizedColumnType === 'DATE') {
                return date.toISOString().split('T')[0];
              }
              if (normalizedColumnType === 'TIME') {
                const hours = String(date.getUTCHours()).padStart(2, '0');
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(date.getUTCSeconds()).padStart(2, '0');
                const ms = date.getUTCMilliseconds();
                if (ms > 0) {
                  const msStr = String(ms).padStart(3, '0');
                  return `${hours}:${minutes}:${seconds}.${msStr}`;
                }
                return `${hours}:${minutes}:${seconds}`;
              }
              if (normalizedColumnType === 'DATETIME') {
                return date.toISOString().replace('T', ' ').slice(0, 19);
              }
              return date.toISOString();
            }
          } catch {
            // If conversion fails, continue with normal serialization
          }
        }
        
        // First try JSON.stringify/parse which handles most cases
        // BUT: This will convert Date objects to {}, so we check for Dates above
        try {
          const jsonStr = JSON.stringify(value);
          // Check if JSON.stringify produced an empty object for a date type
          // This happens when Date objects are stringified
          if (jsonStr === '{}' && isDateType) {
            // This is likely a Date object that was stringified to {}
            return '[Invalid Date]';
          }
          return JSON.parse(jsonStr);
        } catch {
          // If JSON serialization fails (e.g., circular refs, functions),
          // try to extract enumerable properties
          const serialized: any = {};
          for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
              serialized[key] = serializeValue(value[key], visited, columnType);
            }
          }
          // If we got nothing, check if it's a date type before converting to string
          if (Object.keys(serialized).length === 0 && isDateType) {
            return '[Invalid Date]';
          }
          // If we got nothing, convert to string as last resort
          return Object.keys(serialized).length > 0 ? serialized : String(value);
        }
      }
    } catch (error) {
      // If anything goes wrong, check if it's a Date object before converting to string
      // This prevents [object Object] from being returned for Date objects
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          return null;
        }
        if (normalizedColumnType === 'DATE') {
          return value.toISOString().split('T')[0];
        }
        if (normalizedColumnType === 'TIME') {
          const hours = String(value.getUTCHours()).padStart(2, '0');
          const minutes = String(value.getUTCMinutes()).padStart(2, '0');
          const seconds = String(value.getUTCSeconds()).padStart(2, '0');
          const ms = value.getUTCMilliseconds();
          if (ms > 0) {
            const msStr = String(ms).padStart(3, '0');
            return `${hours}:${minutes}:${seconds}.${msStr}`;
          }
          return `${hours}:${minutes}:${seconds}`;
        }
        if (normalizedColumnType === 'DATETIME') {
          return value.toISOString().replace('T', ' ').slice(0, 19);
        }
        return value.toISOString();
      }
      // For date types, return a placeholder instead of [object Object]
      if (isDateType && typeof value === 'object' && value !== null) {
        return '[Invalid Date]';
      }
      // Last resort: convert to string
      return String(value);
    }
  }

  // For primitives (string, number, boolean), return as-is
  return value;
}

export function registerBigQueryHandlers(): void {
  ipcMain.handle('bigquery:execute', async (_event, queryText: string, projectId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const startTime = Date.now();

      // Get location from active connection, default to EU
      const connection = getActiveConnection();
      const location = connection?.location || 'EU';

      // Create query job
      const [job] = await client.createQueryJob({
        query: queryText,
        location,
      });

      // Wait for job to complete and get all results
      // Use a large maxResults to get all rows (BigQuery API limit is 10MB per response)
      // For very large result sets, we'd need pagination, but for now get as many as possible
      const [rows] = await job.getQueryResults({ maxResults: 100000 });
      
      // Get job metadata
      const [jobMetadata] = await job.getMetadata();

      const executionTimeMs = Date.now() - startTime;

      // Transform schema to ColumnMetadata
      // Get schema from job metadata - check multiple possible locations
      let schema = jobMetadata.configuration?.query?.schema || 
                   jobMetadata.statistics?.query?.schema ||
                   jobMetadata.schema;
      
      let columns: ColumnMetadata[] = [];
      
      if (schema?.fields && schema.fields.length > 0) {
        // Use schema from metadata
        columns = schema.fields.map((field: any) => {
          return {
            name: field.name,
            type: field.type, // BigQuery returns types like 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP'
            mode: field.mode,
          };
        });
      } else if (rows && rows.length > 0) {
        // Fallback: extract column names and types from first row
        // NOTE: This fallback should rarely be used if schema is available
        const firstRow = rows[0];
        columns = Object.keys(firstRow).map((key) => {
          const value = firstRow[key];
          let type = 'STRING'; // Default type
          if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
          } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
          } else if (value instanceof Date) {
            type = 'TIMESTAMP';
          } else if (Array.isArray(value)) {
            type = 'ARRAY';
          } else if (value && typeof value === 'object') {
            // CRITICAL: Check if it's a Date-like object before defaulting to RECORD
            // BigQuery DATE/TIME objects might not be instanceof Date
            const keyLower = key.toLowerCase();
            let isDateLike = false;
            let detectedType: string | null = null;
            
            // Check 1: Date instance or Date-like object with methods
            if (value instanceof Date || typeof value.getTime === 'function' || typeof value.toISOString === 'function') {
              isDateLike = true;
              // Try to guess based on column name
              if (keyLower.includes('date') && !keyLower.includes('time') && !keyLower.includes('timestamp')) {
                detectedType = 'DATE';
              } else if (keyLower.includes('time') && !keyLower.includes('date') && !keyLower.includes('timestamp')) {
                detectedType = 'TIME';
              } else if (keyLower.includes('datetime')) {
                detectedType = 'DATETIME';
              } else {
                detectedType = 'TIMESTAMP';
              }
            }
            
            // Check 2: Object with 'value' property containing date-like string
            if (!isDateLike && 'value' in value && typeof value.value === 'string') {
              const valueStr = value.value;
              if (/^\d{4}-\d{2}-\d{2}/.test(valueStr) || /^\d{2}:\d{2}:\d{2}/.test(valueStr) || 
                  /^\d{4}-\d{2}-\d{2}T/.test(valueStr)) {
                isDateLike = true;
                if (keyLower.includes('date') && !keyLower.includes('time') && !keyLower.includes('timestamp')) {
                  detectedType = 'DATE';
                } else if (keyLower.includes('time') && !keyLower.includes('date') && !keyLower.includes('timestamp')) {
                  detectedType = 'TIME';
                } else if (keyLower.includes('datetime')) {
                  detectedType = 'DATETIME';
                } else if (/^\d{4}-\d{2}-\d{2}T/.test(valueStr)) {
                  detectedType = 'TIMESTAMP';
                } else if (/^\d{4}-\d{2}-\d{2}/.test(valueStr)) {
                  detectedType = 'DATE';
                } else if (/^\d{2}:\d{2}:\d{2}/.test(valueStr)) {
                  detectedType = 'TIME';
                } else {
                  detectedType = 'TIMESTAMP';
                }
              }
            }
            
            // Check 3: Object with year/month/day properties (DATE or DATETIME)
            if (!isDateLike && ('year' in value || 'month' in value || 'day' in value)) {
              isDateLike = true;
              if (keyLower.includes('datetime') || ('hours' in value || 'minutes' in value || 'seconds' in value)) {
                detectedType = 'DATETIME';
              } else {
                detectedType = 'DATE';
              }
            }
            
            // Check 4: Object with hours/minutes/seconds but no year/month/day (TIME)
            if (!isDateLike && ('hours' in value || 'minutes' in value || 'seconds' in value) &&
                !('year' in value || 'month' in value || 'day' in value)) {
              isDateLike = true;
              detectedType = 'TIME';
            }
            
            // Check 5: Column name suggests DATE/TIME even if object structure is unclear
            if (!isDateLike && (keyLower.includes('date') || keyLower.includes('time') || 
                                keyLower.includes('timestamp') || keyLower.includes('datetime'))) {
              // Check if object has any string properties that look like dates
              const keys = Object.keys(value);
              for (const objKey of keys) {
                const propValue = value[objKey];
                if (typeof propValue === 'string') {
                  if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
                      /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
                    isDateLike = true;
                    if (keyLower.includes('date') && !keyLower.includes('time') && !keyLower.includes('timestamp')) {
                      detectedType = 'DATE';
                    } else if (keyLower.includes('time') && !keyLower.includes('date') && !keyLower.includes('timestamp')) {
                      detectedType = 'TIME';
                    } else if (keyLower.includes('datetime')) {
                      detectedType = 'DATETIME';
                    } else {
                      detectedType = 'TIMESTAMP';
                    }
                    break;
                  }
                }
              }
            }
            
            if (isDateLike && detectedType) {
              type = detectedType;
            } else {
              type = 'RECORD';
            }
          }
          return {
            name: key,
            type,
            mode: 'NULLABLE',
          };
        });
      }

      // Transform rows to Row format
      // BigQuery returns rows as objects with field names as keys
      // Serialize all values to ensure they can be cloned and sent through IPC
      
      const transformedRows: Row[] = rows.map((row: any) => ({
        values: columns.map((col) => {
          const value = row[col.name];
          
          // Pass column type to serializeValue to help with date/time serialization
          let serialized = serializeValue(value, new WeakSet(), col.type);
          
          // CRITICAL: For DATE/TIME columns, ensure we NEVER store an object - always convert to string
          // This prevents objects from being stored in cache and later displayed as "[object Object]"
          const colTypeUpper = (col.type || '').toUpperCase();
          if (colTypeUpper === 'DATE' || colTypeUpper === 'TIME' || 
              colTypeUpper === 'DATETIME' || colTypeUpper === 'TIMESTAMP') {
            // If serialized result is still an object, convert it to a string
            if (typeof serialized === 'object' && serialized !== null) {
              // Try to extract a date string from the object
              const keys = Object.keys(serialized);
              for (const key of keys) {
                const propValue = serialized[key];
                if (typeof propValue === 'string') {
                  // Check if it looks like a date/time string
                  if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
                      /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
                    serialized = propValue;
                    break;
                  }
                }
              }
              
              // If we still have an object, convert to placeholder string
              if (typeof serialized === 'object' && serialized !== null) {
                serialized = '[Invalid Date]';
              }
            }
            
            // CRITICAL: Check if serialized result is "[object Object]" string and fix it
            if (typeof serialized === 'string' && serialized === '[object Object]') {
              serialized = '[Invalid Date]';
            }
            
            // Ensure final result is a string (not object, not null, not undefined)
            if (typeof serialized !== 'string') {
              if (serialized === null || serialized === undefined) {
                serialized = '[Invalid Date]';
              } else {
                serialized = String(serialized);
                // If string conversion produced "[object Object]", use placeholder
                if (serialized === '[object Object]') {
                  serialized = '[Invalid Date]';
                }
              }
            }
          }
          
          return serialized;
        }),
      }));

      // Use the actual number of rows returned, or totalRowsReturned from metadata if available
      const totalRowsReturned = parseInt(
        jobMetadata.statistics?.query?.totalRowsReturned || 
        jobMetadata.statistics?.totalRowsReturned || 
        String(transformedRows.length), 
        10
      );

      const result: QueryResult = {
        columns,
        rows: transformedRows,
        totalRows: totalRowsReturned,
        rowsReturned: transformedRows.length,
        executionTimeMs,
        bytesProcessed: parseInt(jobMetadata.statistics?.totalBytesProcessed || '0', 10),
        jobId: job.id || '',
        hasMore: transformedRows.length < totalRowsReturned, // Indicate if there are more rows available
      };

      return result;
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        const err = new Error('Network error: Unable to connect to BigQuery');
        (err as any).code = BigQueryErrorCode.NETWORK_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      if (error.code === 403 || error.code === 401) {
        const err = new Error('Authentication error');
        (err as any).code = BigQueryErrorCode.AUTH_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      
      // Extract error message from BigQuery error
      let errorMessage = error.message || 'Query execution failed';
      
      // If error has details array, try to extract message from first detail
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.message) {
          errorMessage = firstError.message;
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      const err = new Error(errorMessage);
      (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
      (err as any).details = error.errors || error;
      throw err;
    }
  });

  ipcMain.handle('bigquery:cancel', async (_event, jobId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const job = client.job(jobId);
      await job.cancel();
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.JOB_NOT_FOUND,
          message: 'Job not found or already completed',
        };
      }
      throw {
        code: BigQueryErrorCode.CANCEL_FAILED,
        message: 'Failed to cancel job',
        details: error.message,
      };
    }
  });

  ipcMain.handle('bigquery:listDatasets', async () => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const [datasets] = await client.getDatasets();
      return datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.id,
        location: dataset.metadata?.location || 'US',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list datasets',
        details: error.errors || error,
      };
    }
  });

  ipcMain.handle('bigquery:listTables', async (_event, datasetId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const dataset = client.dataset(datasetId);
      const [tables] = await dataset.getTables();
      return tables.map((table) => ({
        id: table.id,
        name: table.id,
        type: table.metadata?.type || 'TABLE',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list tables',
        details: error.errors || error,
      };
    }
  });

  // Wrap handler to suppress error logging for table not found errors
  ipcMain.handle('bigquery:getTableSchema', async (_event, datasetId: string, tableId: string) => {
    try {
      return await (async () => {
        const client = getBigQueryClient();
        if (!client) {
          throw {
            code: BigQueryErrorCode.CONNECTION_FAILED,
            message: 'No active BigQuery connection',
          };
        }

        try {
          const table = client.dataset(datasetId).table(tableId);
          const [metadata] = await table.getMetadata();
          
          // Extract schema fields
          const schema = metadata.schema;
          if (!schema || !schema.fields) {
            return {
              fields: [],
            };
          }

          // Recursively transform fields to include nested structures
          const transformField = (field: any): ColumnMetadata & { fields?: any[] } => {
            const result: ColumnMetadata & { fields?: any[] } = {
              name: field.name,
              type: field.type,
              mode: field.mode || 'NULLABLE',
            };
            
            if (field.fields && field.fields.length > 0) {
              result.fields = field.fields.map(transformField);
            }
            
            return result;
          };

          // Extract table metadata
          // BigQuery timestamps are in milliseconds, can be string or number
          const creationTime = metadata.creationTime 
            ? (typeof metadata.creationTime === 'string' 
                ? parseInt(metadata.creationTime, 10) 
                : metadata.creationTime)
            : undefined;
          const lastModifiedTime = metadata.lastModifiedTime
            ? (typeof metadata.lastModifiedTime === 'string'
                ? parseInt(metadata.lastModifiedTime, 10)
                : metadata.lastModifiedTime)
            : undefined;
          const numRows = metadata.numRows
            ? (typeof metadata.numRows === 'string'
                ? parseInt(metadata.numRows, 10)
                : metadata.numRows)
            : undefined;
          const numBytes = metadata.numBytes
            ? (typeof metadata.numBytes === 'string'
                ? parseInt(metadata.numBytes, 10)
                : metadata.numBytes)
            : undefined;

          return {
            fields: schema.fields.map(transformField),
            metadata: {
              creationTime,
              lastModifiedTime,
              numRows,
              numBytes,
            },
          };
        } catch (error: any) {
          if (error.code === 404) {
            // Create error but suppress Electron's automatic logging for table not found errors
            // These errors are handled in the UI and don't need to be logged
            const err = new Error('Table not found');
            (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
            (err as any).details = error.message;
            // Mark error to suppress logging
            (err as any).suppressLogging = true;
            throw err;
          }
          const err = new Error(error.message || 'Failed to get table schema');
          (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
          (err as any).details = error.errors || error;
          throw err;
        }
      })();
    } catch (error: any) {
      // Suppress Electron's automatic error logging for table not found errors
      if (error?.code === BigQueryErrorCode.BIGQUERY_ERROR && 
          error?.message === 'Table not found') {
        // Re-throw without Electron logging by using a custom error handler
        // Electron will still pass the error to the renderer, but won't log it
        const err = new Error('Table not found');
        (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
        (err as any).details = error.details || error.message;
        // Use a custom property to signal this shouldn't be logged
        Object.defineProperty(err, 'suppressLogging', { value: true, enumerable: false });
        throw err;
      }
      // Re-throw other errors normally
      throw error;
    }
  });

  ipcMain.handle('bigquery:getViewDefinition', async (_event, datasetId: string, tableId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const table = client.dataset(datasetId).table(tableId);
      const [metadata] = await table.getMetadata();
      
      // Check if this is actually a view
      if (metadata.type !== 'VIEW' && metadata.type !== 'MATERIALIZED_VIEW') {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Table is not a view',
        };
      }

      // Get view definition from metadata
      // For regular views: metadata.view.query
      // For materialized views: metadata.materializedView.query
      let viewDefinition = '';
      if (metadata.type === 'VIEW' && metadata.view) {
        viewDefinition = metadata.view.query || '';
      } else if (metadata.type === 'MATERIALIZED_VIEW' && metadata.materializedView) {
        viewDefinition = metadata.materializedView.query || '';
      }
      
      if (!viewDefinition) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View definition not found',
        };
      }

      return {
        definition: viewDefinition,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View not found',
          details: error.message,
        };
      }
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to get view definition',
        details: error.errors || error,
      };
    }
  });
}
````

## File: src/main/main.ts
````typescript
import { app, BrowserWindow, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerBigQueryHandlers } from './ipc/bigquery';
import { registerConnectionHandlers } from './ipc/connection';
import { registerQueriesHandlers } from './ipc/queries';
import { registerUISettingsHandlers } from './ipc/ui-settings';
import { registerTabsHandlers } from './ipc/tabs';
import { registerResultsCacheHandlers } from './ipc/results-cache';
import { getWindowBounds, setWindowBounds } from './storage/ui-settings-store';
import { clearAllResults } from './storage/results-cache-store';

// Suppress error logging for "Table not found" errors from IPC handlers
// These errors are handled in the UI and don't need console logging
// Intercept at the process level before Electron logs them
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
  const message = chunk?.toString() || '';
  // Check if this is a "Table not found" error from getTableSchema
  // Match various formats Electron might use to log the error
  if ((message.includes('bigquery:getTableSchema') || message.includes('Error occurred in handler')) && 
      (message.includes('Table not found') || 
       message.includes('code: \'BIGQUERY_ERROR\'') ||
       message.includes('BIGQUERY_ERROR'))) {
    // Suppress logging for table not found errors
    return true;
  }
  // Write all other messages normally
  return originalStderrWrite(chunk, encoding, callback);
};

// Set app name immediately (before any other app calls) for macOS dock
// This must be called before app.whenReady() to ensure the dock shows the correct name
if (process.platform === 'darwin') {
  app.setName('QueryForge');
  console.log('Initial app name set to:', app.getName());
}

let mainWindow: BrowserWindow | null = null;

// Register IPC handlers
registerBigQueryHandlers();
registerConnectionHandlers();
registerQueriesHandlers();
registerUISettingsHandlers();
registerTabsHandlers();
registerResultsCacheHandlers();

// Register app version handler
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow?.webContents.send('menu:new-tab');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About QueryForge',
          click: () => {
            mainWindow?.webContents.send('menu:show-about');
          },
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+?',
          click: () => {
            mainWindow?.webContents.send('menu:show-help');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  // Restore window size and position from previous session
  const savedBounds = getWindowBounds();
  const windowState = {
    width: savedBounds?.width || 1200,
    height: savedBounds?.height || 800,
    x: savedBounds?.x,
    y: savedBounds?.y,
  };

  // Get icon path - always check from root directory first (most reliable)
  const rootDir = process.cwd();
  let iconPath: string | undefined;
  
  if (process.platform === 'darwin') {
    // macOS: prefer .icns file (better transparency support)
    const icnsPath = path.join(rootDir, 'queryforge_icon.icns');
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    
    // Prefer .icns for better transparency and native macOS support
    if (fs.existsSync(icnsPath)) {
      iconPath = icnsPath;
    } else if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    // Windows/Linux: use PNG
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }
  
  if (iconPath) {
    console.log('Using icon:', iconPath);
  } else {
    console.warn('Icon not found. Expected locations:');
    if (process.platform === 'darwin') {
      console.warn('  -', path.join(rootDir, 'queryforge_icon.icns'));
      console.warn('  -', path.join(rootDir, 'queryforge_icon.png'));
    } else {
      console.warn('  -', path.join(rootDir, 'queryforge_icon.png'));
    }
  }

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for preload script
    },
  };

  // Set icon for Windows/Linux (macOS uses dock icon instead)
  if (iconPath && process.platform !== 'darwin') {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow({
    ...windowOptions,
    title: 'QueryForge',
  });
  
  // Set app icon for macOS dock (if icon found)
  // macOS will automatically apply rounded corners to the icon
  if (iconPath && process.platform === 'darwin' && app.dock) {
    try {
      // Ensure we have an absolute path
      const absoluteIconPath = path.isAbsolute(iconPath) ? iconPath : path.resolve(rootDir, iconPath);
      
      // Verify file exists
      if (!fs.existsSync(absoluteIconPath)) {
        console.warn('Icon file does not exist:', absoluteIconPath);
        return;
      }
      
      // Use nativeImage for both .icns and PNG files
      // nativeImage.createFromPath() works with .icns files on macOS
      const icon = nativeImage.createFromPath(absoluteIconPath);
      if (!icon.isEmpty()) {
        app.dock.setIcon(icon);
        // Set app name again after setting dock icon (macOS may need this)
        app.setName('QueryForge');
        console.log('Set macOS dock icon:', absoluteIconPath);
        console.log('App name after setting icon:', app.getName());
      } else {
        console.warn('Icon file is empty:', absoluteIconPath);
      }
    } catch (error) {
      console.warn('Failed to set dock icon:', error);
    }
  }

  // Debounce function to avoid saving too frequently
  let saveTimeout: NodeJS.Timeout | null = null;
  const saveWindowBounds = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      const bounds = mainWindow?.getBounds();
      if (bounds) {
        setWindowBounds({
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
        });
      }
    }, 500); // Debounce by 500ms
  };

  // Save window state on move/resize
  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);

  // Save window bounds and tabs when window is closed
  mainWindow.on('close', () => {
    const bounds = mainWindow?.getBounds();
    if (bounds) {
      setWindowBounds({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      });
    }
    // Request tabs to be saved from renderer process
    mainWindow?.webContents.send('app:before-close');
    // Clear results cache when application closes
    clearAllResults();
  });

  // Load the HTML file from dist (webpack bundles everything)
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // DevTools can be opened manually via View > Toggle Developer Tools menu or Cmd+Option+I / Ctrl+Shift+I
  // Only open automatically if explicitly requested via command line flag
  if (process.argv.includes('--dev') || process.argv.includes('--open-devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set app icon before app is ready (for better compatibility)
function setAppIcon(): void {
  const rootDir = process.cwd();
  let iconPath: string | undefined;
  
  if (process.platform === 'darwin') {
    // macOS: prefer .icns file (better transparency support)
    const icnsPath = path.join(rootDir, 'queryforge_icon.icns');
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    
    // Prefer .icns for better transparency and native macOS support
    if (fs.existsSync(icnsPath)) {
      iconPath = icnsPath;
    } else if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    // Windows/Linux: use PNG
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }
  
  if (iconPath) {
    try {
      // Ensure we have an absolute path
      const absoluteIconPath = path.isAbsolute(iconPath) ? iconPath : path.resolve(rootDir, iconPath);
      
      // Verify file exists
      if (!fs.existsSync(absoluteIconPath)) {
        console.warn('Icon file does not exist:', absoluteIconPath);
        return;
      }
      
      // Use nativeImage for both .icns and PNG files
      // nativeImage.createFromPath() works with .icns files on macOS
      const icon = nativeImage.createFromPath(absoluteIconPath);
      if (!icon.isEmpty()) {
        app.setAboutPanelOptions({
          iconPath: absoluteIconPath,
        });
        console.log('Set app icon:', absoluteIconPath);
      } else {
        console.warn('Icon file is empty:', absoluteIconPath);
      }
    } catch (error) {
      console.warn('Failed to set app icon:', error);
    }
  }
}

// Set icon early
setAppIcon();

app.whenReady().then(() => {
  // Verify and set app name again after app is ready (for macOS dock)
  if (process.platform === 'darwin') {
    app.setName('QueryForge');
    console.log('App name set to:', app.getName());
  }
  
  // Also override console.error as a backup (though stderr.write should catch most cases)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ') || '';
    // Check if this is a "Table not found" error from getTableSchema
    // Match various formats Electron might use to log the error
    if ((errorMessage.includes('bigquery:getTableSchema') || errorMessage.includes('Error occurred in handler')) && 
        (errorMessage.includes('Table not found') || 
         errorMessage.includes('code: \'BIGQUERY_ERROR\'') ||
         errorMessage.includes('BIGQUERY_ERROR'))) {
      // Suppress logging for table not found errors
      return;
    }
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
  
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clear results cache when all windows are closed
  clearAllResults();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clear cache on app quit (for macOS)
app.on('will-quit', () => {
  clearAllResults();
});
````

## File: src/renderer/stores/tabs-store.ts
````typescript
import { create } from 'zustand';
import type { QueryTab, QueryResult, TabType } from '../../shared/types/query';

interface TabsState {
  tabs: QueryTab[];
  activeTabId: string | null;
  createTab: () => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTab: (tabId: string, updates: Partial<QueryTab>) => void;
  setTabQuery: (tabId: string, queryText: string) => void;
  setTabResults: (tabId: string, results: QueryResult) => void;
  setTabError: (tabId: string, error: string) => void;
  setTabStatus: (tabId: string, status: QueryTab['executionStatus']) => void;
  loadTabs: () => Promise<void>;
  saveTabs: () => Promise<void>;
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function for saving tabs
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFn: () => Promise<void>, delay: number = 500) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveFn().catch((error) => {
      console.error('Failed to save tabs:', error);
    });
  }, delay);
};

// Filter out any legacy Explorer or Saved Queries tabs
function filterStaticTabs(tabs: QueryTab[]): QueryTab[] {
  return tabs.filter(t => t.type !== 'explorer' && t.type !== 'saved-queries');
}

export const useTabsStore = create<TabsState>((set, get) => {
  return {
    tabs: [
      {
        id: generateTabId(),
        title: 'Query 1',
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      },
      {
        id: generateTabId(),
        title: 'Query 2',
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      },
    ],
    activeTabId: null,

    loadTabs: async () => {
      if (!window.electronAPI?.tabs) {
        return;
      }
      try {
        const savedTabs = await window.electronAPI.tabs.getTabs();
        const savedActiveTabId = await window.electronAPI.tabs.getActiveTabId();
        
        // Filter out any legacy Explorer or Saved Queries tabs
        let filteredTabs = filterStaticTabs(savedTabs || []);
        
        if (filteredTabs.length === 0) {
          // No saved tabs, use default tabs
          filteredTabs = get().tabs;
        }
        
        // Ensure active tab ID is valid (not a static tab)
        const validActiveTabId = filteredTabs.find(t => t.id === savedActiveTabId)?.id || filteredTabs[0]?.id || null;
        
        if (filteredTabs.length > 0) {
          set({
            tabs: filteredTabs,
            activeTabId: validActiveTabId,
          });
        } else {
          // No tabs left, use default
          const defaultTabId = get().tabs[0]?.id || null;
          set({ activeTabId: defaultTabId });
        }
      } catch (error) {
        console.error('Failed to load tabs:', error);
        // Use default tab if loading fails
        const defaultTabId = get().tabs[0]?.id || null;
        set({ activeTabId: defaultTabId });
      }
    },

    saveTabs: async () => {
      if (!window.electronAPI?.tabs) {
        return;
      }
      try {
        const { tabs, activeTabId } = get();
        await window.electronAPI.tabs.saveTabs(tabs, activeTabId);
      } catch (error) {
        console.error('Failed to save tabs:', error);
      }
    },

    createTab: () => {
      const tabs = get().tabs;
      const newTabId = generateTabId();
      const newTab: QueryTab = {
        id: newTabId,
        title: `Query ${tabs.length + 1}`,
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      };
      const updatedTabs = [...tabs, newTab];
      set({
        tabs: updatedTabs,
        activeTabId: newTabId,
      });
      return newTabId;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId } = get();
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.id !== tabId);
      
      // If closing the active tab, switch to another tab
      let newActiveTabId = activeTabId;
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Switch to the tab that was before this one, or the first tab
          newActiveTabId = newTabs[tabIndex - 1]?.id || newTabs[0]?.id || null;
        } else {
          // No tabs left
          newActiveTabId = null;
        }
      }

      set({
        tabs: newTabs,
        activeTabId: newActiveTabId,
      });
    },

    setActiveTab: (tabId: string) => {
      set({ activeTabId: tabId });
    },

    reorderTabs: (fromIndex: number, toIndex: number) => {
      const { tabs } = get();
      if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
        return;
      }
      
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      
      set({ tabs: newTabs });
    },

    updateTab: (tabId: string, updates: Partial<QueryTab>) => {
      set((state) => {
        const updatedTabs = state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        );
        return {
          tabs: updatedTabs,
        };
      });
    },

    setTabQuery: (tabId: string, queryText: string) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      if (tab) {
        get().updateTab(tabId, {
          queryText,
          isModified: queryText !== (tab.savedQueryId ? tab.queryText : ''),
        });
      }
    },

    setTabResults: (tabId: string, results: QueryResult) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      get().updateTab(tabId, {
        results,
        executionStatus: 'completed',
        error: undefined,
        lastExecuted: new Date().toISOString(),
        lastExecutedQueryText: tab?.queryText || '',
      });
    },

    setTabError: (tabId: string, error: string) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      get().updateTab(tabId, {
        error,
        executionStatus: 'error',
        results: undefined,
        lastExecuted: new Date().toISOString(),
        lastExecutedQueryText: tab?.queryText || '',
      });
    },

    setTabStatus: (tabId: string, status: QueryTab['executionStatus']) => {
      get().updateTab(tabId, { executionStatus: status });
    },
  };
});

// Subscribe to tab changes and auto-save (debounced)
let previousTabs: QueryTab[] = [];
let previousActiveTabId: string | null = null;

useTabsStore.subscribe((state) => {
  // Filter out any legacy static tabs that might have been loaded
  const filteredTabs = filterStaticTabs(state.tabs);
  if (filteredTabs.length !== state.tabs.length) {
    // Found static tabs, remove them
    const validActiveTabId = filteredTabs.find(t => t.id === state.activeTabId)?.id || filteredTabs[0]?.id || null;
    useTabsStore.setState({ tabs: filteredTabs, activeTabId: validActiveTabId });
    return;
  }
  
  // Check if tabs or activeTabId actually changed
  const tabsChanged = state.tabs !== previousTabs || state.activeTabId !== previousActiveTabId;
  
  if (tabsChanged) {
    previousTabs = state.tabs;
    previousActiveTabId = state.activeTabId;
    // Auto-save when tabs or activeTabId changes
    debouncedSave(() => useTabsStore.getState().saveTabs());
  }
});

// Track if initialization has been done to prevent multiple calls
let isInitialized = false;

// Initialize tabs loading - will be called from App.tsx when electronAPI is ready
// This function can be called multiple times safely (idempotent)
export function initializeTabsStore(): void {
  if (isInitialized) {
    return; // Already initialized
  }

  if (window.electronAPI?.tabs) {
    isInitialized = true;
    
    useTabsStore.getState().loadTabs().then(() => {
      // Initialize active tab after loading
      const state = useTabsStore.getState();
      if (!state.activeTabId && state.tabs.length > 0) {
        useTabsStore.setState({ activeTabId: state.tabs[0].id });
      }
    }).catch((error) => {
      console.error('Failed to initialize tabs:', error);
      // Fallback: Initialize active tab on first load if loading fails
      useTabsStore.setState({ activeTabId: useTabsStore.getState().tabs[0]?.id || null });
    });

    // Listen for before-close event to save tabs immediately
    window.electronAPI.tabs.onBeforeClose(() => {
      // Clear any pending debounced save and save immediately
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      useTabsStore.getState().saveTabs();
    });
  } else {
    // Fallback: Initialize active tab on first load if electronAPI is not available
    useTabsStore.setState({ activeTabId: useTabsStore.getState().tabs[0]?.id || null });
  }
}

// Try to initialize immediately if electronAPI is already available
// Otherwise, it will be initialized from App.tsx
if (typeof window !== 'undefined' && window.electronAPI?.tabs) {
  initializeTabsStore();
}
````

## File: src/renderer/components/DatasetTree/DatasetTree.tsx
````typescript
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useConnectionStore } from '../../stores/connection-store';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import { useTabsStore } from '../../stores/tabs-store';
import { SampleDataModal } from '../SampleDataModal/SampleDataModal';
import { ViewDefinitionModal } from '../ViewDefinitionModal/ViewDefinitionModal';
import type { Dataset, Table } from '../../../shared/types/dataset';
import './DatasetTree.css';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  expanded?: boolean;
  loading?: boolean;
}

interface DatasetTreeProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onShowSchema?: (projectId: string, datasetId: string, tableId: string) => void;
  onRefreshReady?: (refreshFn: () => void, isLoading: boolean) => void;
}

const DatasetTreeComponent: React.FC<DatasetTreeProps> = ({ collapsed = false, onToggleCollapse, onShowSchema, onRefreshReady }) => {
  const connection = useConnectionStore((state) => state.connection);
  const { createTab, setTabQuery, updateTab, tabs, activeTabId, setActiveTab } = useTabsStore();
  const [datasets, setDatasets] = useState<DatasetWithTables[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    dataset: Dataset;
    table: Table;
  } | null>(null);
  const [sampleDataModal, setSampleDataModal] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);
  const [viewDefinitionModal, setViewDefinitionModal] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { setDatasets: setMetadataDatasets, setDatasetTables, getDatasetTables } = useBigQueryMetadataStore();

  const loadDatasets = useCallback(async () => {
    if (!connection || !window.electronAPI) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const datasetList = await window.electronAPI.bigquery.listDatasets();
      const datasetsWithState = datasetList.map((ds) => ({
        ...ds,
        expanded: false,
        loading: false,
      }));
      setDatasets(datasetsWithState);
      
      // Also store in metadata store for completion provider
      setMetadataDatasets(datasetList.map((ds) => ({ ...ds })));
      
      // Preload tables for all datasets in the background
      datasetList.forEach((dataset) => {
        window.electronAPI!.bigquery
          .listTables(dataset.id)
          .then((tables) => {
            setDatasetTables(dataset.id, tables);
          })
          .catch((err) => {
            console.warn(`Failed to preload tables for dataset ${dataset.id}:`, err);
          });
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets');
      console.error('Failed to load datasets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, setMetadataDatasets, setDatasetTables]);

  useEffect(() => {
    if (connection) {
      loadDatasets();
    } else {
      setDatasets([]);
    }
  }, [connection, loadDatasets]);

  // Expose refresh function and loading state to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(loadDatasets, isLoading);
    }
  }, [onRefreshReady, loadDatasets, isLoading]);

  const toggleDataset = async (datasetId: string) => {
    if (!window.electronAPI) return;

    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id === datasetId) {
          if (ds.expanded) {
            // Collapse
            return { ...ds, expanded: false };
          } else {
            // Expand - load tables if not already loaded
            if (!ds.tables) {
              // Set loading state
              const updated = { ...ds, expanded: true, loading: true };
              
              // Load tables
              window.electronAPI.bigquery
                .listTables(datasetId)
                .then((tables) => {
                  setDatasets((prevDatasets) =>
                    prevDatasets.map((d) =>
                      d.id === datasetId
                        ? { ...d, tables, loading: false }
                        : d
                    )
                  );
                  // Also store in metadata store
                  setDatasetTables(datasetId, tables);
                })
                .catch((err) => {
                  console.error('Failed to load tables:', err);
                  setDatasets((prevDatasets) =>
                    prevDatasets.map((d) =>
                      d.id === datasetId
                        ? { ...d, loading: false }
                        : d
                    )
                  );
                });
              
              return updated;
            }
            return { ...ds, expanded: true };
          }
        }
        return ds;
      })
    );
  };

  const handleTableClick = (event: React.MouseEvent, dataset: Dataset, table: Table) => {
    // Handle Ctrl/Cmd+click to insert SELECT statement
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const tableRef = `\`${connection?.projectId}.${dataset.id}.${table.id}\``;
      const selectStatement = `SELECT * FROM ${tableRef}`;
      window.dispatchEvent(
        new CustomEvent('insertTableReference', { detail: selectStatement })
      );
    }
    // Regular left click does nothing (removed table insertion feature)
  };

  const handleTableContextMenu = (event: React.MouseEvent, dataset: Dataset, table: Table) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed for schema view
    if (event.ctrlKey || event.metaKey) {
      if (onShowSchema && connection?.projectId) {
        onShowSchema(connection.projectId, dataset.id, table.id);
      }
      return;
    }
    
    // Show context menu
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      dataset,
      table,
    });
  };

  const handleOpenInNewTab = () => {
    if (!contextMenu || !connection) return;
    
    const { dataset, table } = contextMenu;
    const tableRef = `\`${connection.projectId}.${dataset.id}.${table.id}\``;
    const queryText = `SELECT * FROM ${tableRef}`;
    
    const newTabId = createTab();
    setTabQuery(newTabId, queryText);
    updateTab(newTabId, {
      title: `${dataset.name}.${table.name}`,
    });
    
    setContextMenu(null);
  };

  const handleShowSchema = () => {
    if (!contextMenu || !connection?.projectId || !onShowSchema) return;
    
    const { dataset, table } = contextMenu;
    onShowSchema(connection.projectId, dataset.id, table.id);
    setContextMenu(null);
  };

  const handleViewSampleData = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    setSampleDataModal({
      projectId: connection.projectId,
      datasetId: dataset.id,
      tableId: table.id,
    });
    setContextMenu(null);
  };

  const handleViewDefinition = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    setViewDefinitionModal({
      projectId: connection.projectId,
      datasetId: dataset.id,
      tableId: table.id,
    });
    setContextMenu(null);
  };

  const handleAddWithJoin = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    const tableRef = `\`${connection.projectId}.${dataset.id}.${table.id}\``;
    const tableAlias = table.id.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize table name for alias
    
    // Get the active tab's query
    const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;
    const currentQuery = activeTab?.queryText || '';
    
    let newQuery: string;
    
    if (!currentQuery.trim()) {
      // If no query exists, just insert a SELECT FROM (can't JOIN without a first table)
      newQuery = `SELECT *\nFROM ${tableRef} AS ${tableAlias}`;
    } else {
      const trimmedQuery = currentQuery.trim();
      const upperQuery = trimmedQuery.toUpperCase();
      
      // Check if there's already a FROM clause
      const fromMatch = upperQuery.match(/\bFROM\b/i);
      
      if (fromMatch) {
        // There's already a FROM clause, add JOIN
        // Find position before WHERE/ORDER/GROUP/HAVING/LIMIT
        const clauseMatch = upperQuery.match(/\b(WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT)\b/i);
        
        if (clauseMatch && clauseMatch.index !== undefined) {
          // Insert JOIN before the clause
          const beforeClause = trimmedQuery.substring(0, clauseMatch.index).trim();
          const afterClause = trimmedQuery.substring(clauseMatch.index);
          // Find the last table reference to use in JOIN condition
          const lastTableMatch = beforeClause.match(/(?:FROM|JOIN)\s+[^\s]+(?:\s+AS\s+)?(\w+)?/gi);
          const firstTableAlias = lastTableMatch && lastTableMatch.length > 0 
            ? (lastTableMatch[lastTableMatch.length - 1].match(/\b(?:AS\s+)?(\w+)$/i)?.[1] || 't1')
            : 't1';
          newQuery = `${beforeClause}\nJOIN ${tableRef} AS ${tableAlias} ON `;
        } else {
          // No WHERE/ORDER/etc clause, append JOIN at the end
          // Try to find the first table alias from FROM clause
          const fromTableMatch = trimmedQuery.match(/FROM\s+[^\s]+(?:\s+AS\s+(\w+))?/i);
          const firstTableAlias = fromTableMatch?.[1] || 't1';
          newQuery = `${trimmedQuery}\nJOIN ${tableRef} AS ${tableAlias} ON `;
        }
      } else {
        // No FROM clause found, add FROM (can't add JOIN without a first table)
        // Check if it starts with SELECT
        if (upperQuery.startsWith('SELECT')) {
          newQuery = `${trimmedQuery}\nFROM ${tableRef} AS ${tableAlias}`;
        } else {
          // Not a SELECT query, prepend SELECT and add FROM
          newQuery = `SELECT *\nFROM ${tableRef} AS ${tableAlias}\n\n${trimmedQuery}`;
        }
      }
    }
    
    // Update the active tab, or create a new one if none exists
    if (activeTab) {
      setTabQuery(activeTab.id, newQuery);
    } else {
      const newTabId = createTab();
      setTabQuery(newTabId, newQuery);
    }
    
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu?.visible]);

  // Close context menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu?.visible) {
        setContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu?.visible]);

  // Filter datasets and tables based on search term
  const filteredDatasets = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return datasets;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return datasets
      .filter((dataset) => {
        const datasetMatches = dataset.name.toLowerCase().includes(searchLower);
        // Check both local tables and metadata store tables
        const localTables = dataset.tables || [];
        const metadataTables = getDatasetTables(dataset.id) || [];
        // Combine tables, preferring local if available, otherwise use metadata
        // Deduplicate by table id
        const tableMap = new Map<string, Table>();
        metadataTables.forEach((table) => tableMap.set(table.id, table));
        localTables.forEach((table) => tableMap.set(table.id, table));
        const allTables = Array.from(tableMap.values());
        
        const matchingTables = allTables.filter((table) =>
          table.name.toLowerCase().includes(searchLower)
        );
        return datasetMatches || matchingTables.length > 0;
      })
      .map((dataset) => {
        const datasetMatches = dataset.name.toLowerCase().includes(searchLower);
        // Check both local tables and metadata store tables
        const localTables = dataset.tables || [];
        const metadataTables = getDatasetTables(dataset.id) || [];
        // Combine tables, preferring local if available, otherwise use metadata
        // Deduplicate by table id
        const tableMap = new Map<string, Table>();
        metadataTables.forEach((table) => tableMap.set(table.id, table));
        localTables.forEach((table) => tableMap.set(table.id, table));
        const allTables = Array.from(tableMap.values());
        
        const matchingTables = allTables.filter((table) =>
          table.name.toLowerCase().includes(searchLower)
        );

        return {
          ...dataset,
          // Auto-expand if searching and there are matching tables or dataset matches
          expanded: (matchingTables.length > 0 || datasetMatches) ? true : dataset.expanded,
          // Show all tables if dataset name matches, otherwise show only matching tables
          // Prefer local tables if available, otherwise use metadata tables
          tables: datasetMatches 
            ? (localTables.length > 0 ? localTables : allTables)
            : matchingTables.length > 0 
              ? matchingTables 
              : (localTables.length > 0 ? localTables : allTables),
        };
      });
  }, [datasets, searchTerm, getDatasetTables]);

  if (!connection) {
    return (
      <div className={`dataset-tree ${collapsed ? 'collapsed' : ''}`}>
        {!collapsed && (
          <div className="dataset-tree-empty">Not connected</div>
        )}
      </div>
    );
  }

  return (
    <div className={`dataset-tree ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          <div className="dataset-tree-search">
            <input
              type="text"
              className="dataset-tree-search-input"
              placeholder="Search datasets and tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Prevent closing context menu when typing in search
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
            />
            {searchTerm && (
              <button
                className="dataset-tree-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="dataset-tree-content">
            {isLoading && datasets.length === 0 && (
              <div className="dataset-tree-loading">Loading datasets...</div>
            )}
            {error && <div className="dataset-tree-error">{error}</div>}
            {filteredDatasets.length === 0 && !isLoading && !error && (
              <div className="dataset-tree-empty">
                {searchTerm ? 'No matching datasets or tables found' : 'No datasets found'}
              </div>
            )}
            {filteredDatasets.map((dataset) => (
            <div key={dataset.id} className="dataset-item">
              <div
                className="dataset-header"
                onClick={() => toggleDataset(dataset.id)}
              >
                <span className="dataset-icon">
                  {dataset.expanded ? '▼' : '▶'}
                </span>
                <span className="dataset-name">{dataset.name}</span>
              </div>
              {dataset.expanded && (
                <div className="dataset-tables">
                  {dataset.loading ? (
                    <div className="table-loading">Loading tables...</div>
                  ) : (
                    dataset.tables?.map((table) => (
                      <div
                        key={table.id}
                        className="table-item"
                        onClick={(e) => handleTableClick(e, dataset, table)}
                        onContextMenu={(e) => handleTableContextMenu(e, dataset, table)}
                        title={`${dataset.name}.${table.name} (Ctrl+Click for SELECT, Right-click for menu)`}
                      >
                        <span className="table-icon">
                          {table.type === 'VIEW' ? '📄' : '🗄'}
                        </span>
                        <span className="table-name">{table.name}</span>
                      </div>
                    ))
                  )}
                  {dataset.tables && dataset.tables.length === 0 && (
                    <div className="table-empty">No tables</div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-item" onClick={handleOpenInNewTab}>
            Open in new tab
          </div>
          <div className="context-menu-item" onClick={handleAddWithJoin}>
            Add with JOIN
          </div>
          <div className="context-menu-item" onClick={handleViewSampleData}>
            View sample data
          </div>
          {contextMenu.table.type === 'VIEW' && (
            <div className="context-menu-item" onClick={handleViewDefinition}>
              Show view definition
            </div>
          )}
          {onShowSchema && connection?.projectId && (
            <div className="context-menu-item" onClick={handleShowSchema}>
              Show schema
            </div>
          )}
        </div>
      )}
      {sampleDataModal && (
        <SampleDataModal
          projectId={sampleDataModal.projectId}
          datasetId={sampleDataModal.datasetId}
          tableId={sampleDataModal.tableId}
          onClose={() => setSampleDataModal(null)}
        />
      )}
      {viewDefinitionModal && (
        <ViewDefinitionModal
          projectId={viewDefinitionModal.projectId}
          datasetId={viewDefinitionModal.datasetId}
          tableId={viewDefinitionModal.tableId}
          onClose={() => setViewDefinitionModal(null)}
        />
      )}
    </div>
  );
};

export const DatasetTree = memo(DatasetTreeComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.onToggleCollapse === nextProps.onToggleCollapse &&
    prevProps.onShowSchema === nextProps.onShowSchema
  );
});
````

## File: src/renderer/components/QueryResults/QueryResults.tsx
````typescript
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { RowContextMenu } from './RowContextMenu';
import { CanvasTable } from './CanvasTable';
import type { QueryTab, QueryResult, ColumnMetadata, Row } from '../../../shared/types/query';
import { formatBigQueryValue } from '../../utils/bigquery-formatter';
import './QueryResults.css';

const ROWS_PER_PAGE = 200;

export const QueryResults: React.FC = () => {
  // Use separate selectors to ensure reactivity for each property
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const activeTab = useTabsStore((state) => {
    if (!activeTabId) return null;
    return state.tabs.find((t) => t.id === activeTabId) || null;
  });
  
  // All hooks must be called before any conditional returns
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex?: number;
    columnIndex?: number;
    isRowNumberColumn?: boolean;
  } | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  
  // Store metadata and current page separately for efficient cache access
  const [resultsMetadata, setResultsMetadata] = useState<{
    columns: any[];
    totalRows: number;
    rowsReturned: number;
    executionTimeMs: number;
    bytesProcessed?: number;
    jobId: string;
    hasMore: boolean;
  } | null>(null);
  const [currentPageRows, setCurrentPageRows] = useState<any[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const error = activeTab?.error;
  const executionStatus: QueryTab['executionStatus'] = activeTab?.executionStatus || 'idle';
  
  // Load metadata from cache when tab changes or when execution completes
  useEffect(() => {
    if (!activeTabId || !window.electronAPI?.resultsCache) {
      setResultsMetadata(null);
      setCurrentPageRows([]);
      return;
    }
    
    // If query is running, don't load from cache (wait for new results)
    if (executionStatus === 'running') {
      setResultsMetadata(null);
      setCurrentPageRows([]);
      return;
    }
    
    // Load metadata from cache
    setIsLoadingCache(true);
    window.electronAPI.resultsCache
      .getMetadata(activeTabId)
      .then((metadata: {
        columns: ColumnMetadata[];
        totalRows: number;
        rowsReturned: number;
        executionTimeMs: number;
        bytesProcessed?: number;
        jobId: string;
        hasMore: boolean;
      } | null) => {
        if (metadata) {
          setResultsMetadata(metadata);
          setIsLoadingCache(false);
        } else {
          setResultsMetadata(null);
          setCurrentPageRows([]);
          setIsLoadingCache(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load results metadata from cache:', err);
        setResultsMetadata(null);
        setCurrentPageRows([]);
        setIsLoadingCache(false);
      });
  }, [activeTabId, executionStatus]);
  
  // Load current page from cache when metadata or page changes
  useEffect(() => {
    if (!activeTabId || !resultsMetadata || !window.electronAPI?.resultsCache) {
      setCurrentPageRows([]);
      return;
    }
    
    setIsLoadingPage(true);
    window.electronAPI.resultsCache
      .getPage(activeTabId, currentPage)
      .then((pageRows: Row[] | null) => {
        if (pageRows) {
          setCurrentPageRows(pageRows);
        } else {
          setCurrentPageRows([]);
        }
        setIsLoadingPage(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load page from cache:', err);
        setCurrentPageRows([]);
        setIsLoadingPage(false);
      });
  }, [activeTabId, currentPage, resultsMetadata]);
  
  // Prefetch adjacent pages for smoother navigation
  useEffect(() => {
    if (!activeTabId || !resultsMetadata || !window.electronAPI?.resultsCache) {
      return;
    }
    
    const totalPages = Math.ceil(resultsMetadata.rowsReturned / ROWS_PER_PAGE);
    
    // Prefetch next page if available
    if (currentPage < totalPages) {
      window.electronAPI.resultsCache.getPage(activeTabId, currentPage + 1).catch(() => {
        // Silently fail prefetch
      });
    }
    
    // Prefetch previous page if available
    if (currentPage > 1) {
      window.electronAPI.resultsCache.getPage(activeTabId, currentPage - 1).catch(() => {
        // Silently fail prefetch
      });
    }
  }, [activeTabId, currentPage, resultsMetadata]);
  
  // Reset column widths when results change (use jobId as stable identifier)
  const resultsJobId = resultsMetadata?.jobId;
  const resultsColumnCount = resultsMetadata?.columns?.length;
  
  useEffect(() => {
    if (resultsJobId !== undefined) {
      setColumnWidths({});
      setCurrentPage(1); // Reset to first page when results change
      setSortColumn(null); // Reset sorting when results change
      setSortDirection(null);
    }
  }, [resultsJobId, activeTab?.id, resultsColumnCount]);

  // Sort rows based on selected column and direction
  const sortedRows = React.useMemo(() => {
    if (sortColumn === null || sortDirection === null || !currentPageRows.length) {
      return currentPageRows;
    }

    const sorted = [...currentPageRows].sort((a, b) => {
      const aValue = a.values[sortColumn];
      const bValue = b.values[sortColumn];
      const column = resultsMetadata?.columns[sortColumn];
      const columnType = (column?.type || '').toUpperCase();

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) {
        return bValue === null || bValue === undefined ? 0 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // Compare based on column type
      if (columnType === 'INTEGER' || columnType === 'INT' || columnType.includes('INT')) {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'FLOAT' || columnType === 'NUMERIC' || columnType === 'BIGNUMERIC') {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'BOOLEAN' || columnType === 'BOOL') {
        comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
      } else if (columnType === 'DATE' || columnType === 'DATETIME' || columnType === 'TIMESTAMP') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        comparison = aDate - bDate;
      } else {
        // String comparison (case-insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [currentPageRows, sortColumn, sortDirection, resultsMetadata?.columns]);

  // Create a QueryResult-like object for compatibility with existing code
  const results: QueryResult | null = resultsMetadata
    ? {
        columns: resultsMetadata.columns,
        rows: sortedRows, // Use sorted rows instead of currentPageRows
        totalRows: resultsMetadata.totalRows,
        rowsReturned: resultsMetadata.rowsReturned,
        executionTimeMs: resultsMetadata.executionTimeMs,
        bytesProcessed: resultsMetadata.bytesProcessed,
        jobId: resultsMetadata.jobId,
        hasMore: resultsMetadata.hasMore,
      }
    : null;

  const handleColumnResize = useCallback((columnIndex: number, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnIndex]: width,
    }));
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIndex: number, isRowNumberColumn?: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex,
      isRowNumberColumn,
    });
  }, []);

  const formatValue = useCallback((value: any, columnType?: string, columnName?: string): string => {
    // Pass both type and name to formatter for better date detection
    return formatBigQueryValue(value, columnType, columnName);
  }, []);

  const formatCSVValue = useCallback((val: any, columnType?: string, columnName?: string): string => {
    const formatted = formatValue(val, columnType, columnName);
    // Escape commas, quotes, and newlines in values
    if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
      return `"${formatted.replace(/"/g, '""')}"`;
    }
    return formatted;
  }, [formatValue]);

  const handleCopyRowValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.rowIndex === undefined) return;

    // Use sorted rows from results (which matches what's displayed)
    const rowIndex = contextMenu.rowIndex;
    const row = results.rows[rowIndex];
    
    if (!row) return;

    const headers = results.columns.map((col: any) => formatCSVValue(col.name));
    const values = row.values.map((val: any, idx: number) => {
      const col = results.columns[idx];
      return formatCSVValue(val, col?.type, col?.name);
    });

    // Format: header1,header2,header3\nvalue1,value2,value3
    const csvText = [headers.join(','), values.join(',')].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, formatCSVValue]);

  const handleCopyColumnValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.columnIndex === undefined) return;

    const columnIndex = contextMenu.columnIndex;
    const column = results.columns[columnIndex];
    
    if (!column) return;

    // Get header
    const header = formatCSVValue(column.name);
    
    // Get all values for this column from sorted rows (matches what's displayed)
    const values = results.rows.map(row => formatCSVValue(row.values[columnIndex], column.type, column.name));

    // Format: header\nvalue1\nvalue2\nvalue3...
    const csvText = [header, ...values].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, formatCSVValue]);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      columnIndex,
    });
  }, []);

  const handleSortColumn = useCallback((columnIndex: number, direction: 'asc' | 'desc') => {
    setSortColumn(columnIndex);
    setSortDirection(direction);
  }, []);

  // Pagination calculations - use metadata for total rows, current page rows are already loaded
  const totalRows = resultsMetadata?.rowsReturned || 0;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + currentPageRows.length, totalRows);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Now we can do conditional returns after all hooks
  if (error) {
    return (
      <div className="query-results">
        <div className="error-results">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!resultsMetadata) {
    // Show "Executing query..." when status is running, otherwise show default message
    const message = executionStatus === 'running' 
      ? 'Executing query...' 
      : isLoadingCache
      ? 'Loading results...'
      : 'Execute a query to see results here.';
    
    return (
      <div className="query-results">
        <div className="no-results">
          <div>{message}</div>
          {(executionStatus === 'running' || isLoadingCache) && (
            <div className="query-spinner-container">
              <div className="query-spinner"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show loading indicator while page is loading
  if (isLoadingPage && currentPageRows.length === 0) {
    return (
      <div className="query-results">
        <div className="no-results">
          <div>Loading page {currentPage}...</div>
          <div className="query-spinner-container">
            <div className="query-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have columns and rows to display
  const hasColumns = resultsMetadata.columns && resultsMetadata.columns.length > 0;
  const hasRows = currentPageRows && currentPageRows.length > 0;

  if (!hasColumns && !hasRows) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
            {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
              <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
            )}
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
          </div>
        </div>
        <div className="no-results">No data to display (empty result set).</div>
      </div>
    );
  }

  if (!hasColumns) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
            {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
              <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
            )}
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
          </div>
        </div>
        <div className="no-results">Error: No column information available.</div>
      </div>
    );
  }

  return (
    <div className="query-results">
      <div className="results-header">
        <div className="results-info">
          <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
          {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
            <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
          )}
          <span> • {resultsMetadata.executionTimeMs}ms</span>
          {resultsMetadata.bytesProcessed && (
            <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
          )}
        </div>
      </div>
      <div className="results-table-container">
        {hasRows && results ? (
          <CanvasTable
            results={results}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            onRowContextMenu={handleRowContextMenu}
            onColumnContextMenu={handleColumnContextMenu}
            formatValue={formatValue}
            currentPage={currentPage}
            rowsPerPage={ROWS_PER_PAGE}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
          />
        ) : (
          <div className="no-rows-message">No rows returned</div>
        )}
      </div>
      {hasRows && totalPages > 1 && (
        <div className="results-pagination">
          <button
            className="pagination-button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            title="Previous page"
          >
            ‹
          </button>
          <span className="pagination-info">
            {startIndex + 1}-{endIndex} of {totalRows.toLocaleString()}
          </span>
          <button
            className="pagination-button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            ›
          </button>
        </div>
      )}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopyValues={contextMenu.columnIndex !== undefined ? handleCopyColumnValues : handleCopyRowValues}
          menuLabel={
            contextMenu.columnIndex !== undefined 
              ? 'Copy column values (with header)' 
              : contextMenu.isRowNumberColumn 
                ? 'Copy row as CSV' 
                : 'Copy values (with headers)'
          }
        />
      )}
    </div>
  );
};
````

## File: src/renderer/utils/bigquery-completions.ts
````typescript
/**
 * BigQuery IntelliSense and code completion provider for Monaco Editor
 */

// Import metadata store - use dynamic import to avoid circular dependencies
let metadataStoreGetter: (() => any) | null = null;

export function setMetadataStoreGetter(getter: () => any) {
  metadataStoreGetter = getter;
}

// Schema cache to avoid repeated API calls
const schemaCache = new Map<string, Promise<any[]>>();

// Get table schema (with caching)
async function getTableSchema(
  projectId: string,
  datasetId: string,
  tableId: string
): Promise<any[]> {
  const cacheKey = `${projectId}.${datasetId}.${tableId}`;
  
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }
  
  const schemaPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        return result.fields || [];
      }
      return [];
    } catch (error) {
      // Return empty array on error, don't cache errors
      return [];
    }
  })();
  
  schemaCache.set(cacheKey, schemaPromise);
  return schemaPromise;
}

// Monaco CompletionItemKind enum values (using numeric constants to avoid importing monaco-editor)
const CompletionItemKind = {
  Function: 1,
  Keyword: 14,
  Class: 7, // Use Class for tables
  Module: 9, // Use Module for datasets
  Property: 10, // Use Property for projects
} as const;

const CompletionItemInsertTextRule = {
  InsertAsSnippet: 4,
} as const;

type Monaco = typeof import('monaco-editor');

// BigQuery SQL Keywords
const BIGQUERY_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'USING', 'CROSS',
  'UNION', 'ALL', 'DISTINCT', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'ILIKE', 'BETWEEN', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'VIEW', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE', 'WITH', 'RECURSIVE', 'WINDOW',
  'OVER', 'PARTITION', 'ROWS', 'RANGE', 'PRECEDING', 'FOLLOWING', 'CURRENT',
  'ROW', 'UNBOUNDED', 'INTERVAL', 'CAST', 'SAFE_CAST', 'EXTRACT', 'DATE',
  'DATETIME', 'TIME', 'TIMESTAMP', 'STRING', 'INT64', 'FLOAT64', 'BOOL',
  'BYTES', 'ARRAY', 'STRUCT', 'GEOGRAPHY', 'JSON', 'NUMERIC', 'BIGNUMERIC',
  'DECIMAL', 'TRUE', 'FALSE', 'IF', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST',
];

// BigQuery Date/Time Functions
const DATE_TIME_FUNCTIONS = [
  {
    label: 'CURRENT_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_DATE()',
    documentation: 'Returns the current date as a DATE value.',
    detail: 'DATE CURRENT_DATE()',
  },
  {
    label: 'CURRENT_DATETIME',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_DATETIME()',
    documentation: 'Returns the current date and time as a DATETIME value.',
    detail: 'DATETIME CURRENT_DATETIME([timezone])',
  },
  {
    label: 'CURRENT_TIME',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_TIME()',
    documentation: 'Returns the current time as a TIME value.',
    detail: 'TIME CURRENT_TIME([timezone])',
  },
  {
    label: 'CURRENT_TIMESTAMP',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_TIMESTAMP()',
    documentation: 'Returns the current date and time as a TIMESTAMP value.',
    detail: 'TIMESTAMP CURRENT_TIMESTAMP()',
  },
  {
    label: 'DATE',
    kind: CompletionItemKind.Function,
    insertText: 'DATE(${1:timestamp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a timestamp to a DATE value.',
    detail: 'DATE DATE(timestamp)',
  },
  {
    label: 'DATE_ADD',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_ADD(${1:date}, INTERVAL ${2:number} ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Adds a specified time interval to a DATE value.',
    detail: 'DATE DATE_ADD(date, INTERVAL number date_part)',
  },
  {
    label: 'DATE_SUB',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_SUB(${1:date}, INTERVAL ${2:number} ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Subtracts a specified time interval from a DATE value.',
    detail: 'DATE DATE_SUB(date, INTERVAL number date_part)',
  },
  {
    label: 'DATE_DIFF',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_DIFF(${1:date1}, ${2:date2}, ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of date_part intervals between two DATE values.',
    detail: 'INT64 DATE_DIFF(date1, date2, date_part)',
  },
  {
    label: 'EXTRACT',
    kind: CompletionItemKind.Function,
    insertText: 'EXTRACT(${1|YEAR,MONTH,DAY,HOUR,MINUTE,SECOND|} FROM ${2:date})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Extracts a date part from a date, time, or timestamp.',
    detail: 'INT64 EXTRACT(date_part FROM date)',
  },
  {
    label: 'FORMAT_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'FORMAT_DATE(${1:"%Y-%m-%d"}, ${2:date})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Formats a DATE value according to the specified format string.',
    detail: 'STRING FORMAT_DATE(format_string, date)',
  },
  {
    label: 'PARSE_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'PARSE_DATE(${1:"%Y-%m-%d"}, ${2:date_string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string representation of a date to a DATE value.',
    detail: 'DATE PARSE_DATE(format_string, date_string)',
  },
  {
    label: 'TIMESTAMP',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP(${1:timestamp_string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string representation of a timestamp to a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP(timestamp_string)',
  },
  {
    label: 'TIMESTAMP_ADD',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_ADD(${1:timestamp}, INTERVAL ${2:number} ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Adds a specified time interval to a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP_ADD(timestamp, INTERVAL number date_part)',
  },
  {
    label: 'TIMESTAMP_SUB',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_SUB(${1:timestamp}, INTERVAL ${2:number} ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Subtracts a specified time interval from a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP_SUB(timestamp, INTERVAL number date_part)',
  },
  {
    label: 'TIMESTAMP_DIFF',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_DIFF(${1:timestamp1}, ${2:timestamp2}, ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of date_part intervals between two TIMESTAMP values.',
    detail: 'INT64 TIMESTAMP_DIFF(timestamp1, timestamp2, date_part)',
  },
];

// BigQuery String Functions
const STRING_FUNCTIONS = [
  {
    label: 'CONCAT',
    kind: CompletionItemKind.Function,
    insertText: 'CONCAT(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Concatenates one or more values into a single string.',
    detail: 'STRING CONCAT(value1, value2, ...)',
  },
  {
    label: 'SUBSTR',
    kind: CompletionItemKind.Function,
    insertText: 'SUBSTR(${1:string}, ${2:position}, ${3:length})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns a substring of the specified string.',
    detail: 'STRING SUBSTR(string, position[, length])',
  },
  {
    label: 'TRIM',
    kind: CompletionItemKind.Function,
    insertText: 'TRIM(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Removes leading and trailing whitespace from a string.',
    detail: 'STRING TRIM(string)',
  },
  {
    label: 'UPPER',
    kind: CompletionItemKind.Function,
    insertText: 'UPPER(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string to uppercase.',
    detail: 'STRING UPPER(string)',
  },
  {
    label: 'LOWER',
    kind: CompletionItemKind.Function,
    insertText: 'LOWER(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string to lowercase.',
    detail: 'STRING LOWER(string)',
  },
  {
    label: 'LENGTH',
    kind: CompletionItemKind.Function,
    insertText: 'LENGTH(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the length of a string in bytes.',
    detail: 'INT64 LENGTH(string)',
  },
  {
    label: 'STARTS_WITH',
    kind: CompletionItemKind.Function,
    insertText: 'STARTS_WITH(${1:string}, ${2:prefix})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string starts with the specified prefix.',
    detail: 'BOOL STARTS_WITH(string, prefix)',
  },
  {
    label: 'ENDS_WITH',
    kind: CompletionItemKind.Function,
    insertText: 'ENDS_WITH(${1:string}, ${2:suffix})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string ends with the specified suffix.',
    detail: 'BOOL ENDS_WITH(string, suffix)',
  },
  {
    label: 'REGEXP_CONTAINS',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_CONTAINS(${1:string}, ${2:regexp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string matches the regular expression.',
    detail: 'BOOL REGEXP_CONTAINS(string, regexp)',
  },
  {
    label: 'REGEXP_EXTRACT',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_EXTRACT(${1:string}, ${2:regexp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Extracts the first substring that matches the regular expression.',
    detail: 'STRING REGEXP_EXTRACT(string, regexp)',
  },
  {
    label: 'REGEXP_REPLACE',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_REPLACE(${1:string}, ${2:regexp}, ${3:replacement})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Replaces all substrings that match the regular expression.',
    detail: 'STRING REGEXP_REPLACE(string, regexp, replacement)',
  },
  {
    label: 'SPLIT',
    kind: CompletionItemKind.Function,
    insertText: 'SPLIT(${1:string}, ${2:delimiter})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Splits a string into an array of substrings.',
    detail: 'ARRAY<STRING> SPLIT(string, delimiter)',
  },
];

// BigQuery Aggregate Functions
const AGGREGATE_FUNCTIONS = [
  {
    label: 'COUNT',
    kind: CompletionItemKind.Function,
    insertText: 'COUNT(${1:*})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of rows in the result set.',
    detail: 'INT64 COUNT([DISTINCT] expression)',
  },
  {
    label: 'SUM',
    kind: CompletionItemKind.Function,
    insertText: 'SUM(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sum of non-NULL values.',
    detail: 'NUMERIC SUM([DISTINCT] expression)',
  },
  {
    label: 'AVG',
    kind: CompletionItemKind.Function,
    insertText: 'AVG(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the average of non-NULL values.',
    detail: 'NUMERIC AVG([DISTINCT] expression)',
  },
  {
    label: 'MIN',
    kind: CompletionItemKind.Function,
    insertText: 'MIN(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the minimum value.',
    detail: 'MIN(expression)',
  },
  {
    label: 'MAX',
    kind: CompletionItemKind.Function,
    insertText: 'MAX(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the maximum value.',
    detail: 'MAX(expression)',
  },
  {
    label: 'STDDEV',
    kind: CompletionItemKind.Function,
    insertText: 'STDDEV(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sample standard deviation of non-NULL values.',
    detail: 'NUMERIC STDDEV([DISTINCT] expression)',
  },
  {
    label: 'STDDEV_POP',
    kind: CompletionItemKind.Function,
    insertText: 'STDDEV_POP(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the population standard deviation of non-NULL values.',
    detail: 'NUMERIC STDDEV_POP([DISTINCT] expression)',
  },
  {
    label: 'VARIANCE',
    kind: CompletionItemKind.Function,
    insertText: 'VARIANCE(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sample variance of non-NULL values.',
    detail: 'NUMERIC VARIANCE([DISTINCT] expression)',
  },
  {
    label: 'ARRAY_AGG',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_AGG(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns an array of expression values.',
    detail: 'ARRAY ARRAY_AGG([DISTINCT] expression [ORDER BY key])',
  },
  {
    label: 'STRING_AGG',
    kind: CompletionItemKind.Function,
    insertText: 'STRING_AGG(${1:expression}, ${2:delimiter})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns a concatenated string of expression values.',
    detail: 'STRING STRING_AGG([DISTINCT] expression, delimiter [ORDER BY key])',
  },
];

// BigQuery Window Functions
const WINDOW_FUNCTIONS = [
  {
    label: 'ROW_NUMBER',
    kind: CompletionItemKind.Function,
    insertText: 'ROW_NUMBER() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sequential row number within a partition.',
    detail: 'INT64 ROW_NUMBER() OVER (window_spec)',
  },
  {
    label: 'RANK',
    kind: CompletionItemKind.Function,
    insertText: 'RANK() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the rank of rows within a partition.',
    detail: 'INT64 RANK() OVER (window_spec)',
  },
  {
    label: 'DENSE_RANK',
    kind: CompletionItemKind.Function,
    insertText: 'DENSE_RANK() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the dense rank of rows within a partition.',
    detail: 'INT64 DENSE_RANK() OVER (window_spec)',
  },
  {
    label: 'LAG',
    kind: CompletionItemKind.Function,
    insertText: 'LAG(${1:expression}, ${2:offset}) OVER (${3:PARTITION BY ${4:column} ORDER BY ${5:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression at a specified offset before the current row.',
    detail: 'LAG(expression, offset) OVER (window_spec)',
  },
  {
    label: 'LEAD',
    kind: CompletionItemKind.Function,
    insertText: 'LEAD(${1:expression}, ${2:offset}) OVER (${3:PARTITION BY ${4:column} ORDER BY ${5:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression at a specified offset after the current row.',
    detail: 'LEAD(expression, offset) OVER (window_spec)',
  },
  {
    label: 'FIRST_VALUE',
    kind: CompletionItemKind.Function,
    insertText: 'FIRST_VALUE(${1:expression}) OVER (${2:PARTITION BY ${3:column} ORDER BY ${4:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression from the first row in the window.',
    detail: 'FIRST_VALUE(expression) OVER (window_spec)',
  },
  {
    label: 'LAST_VALUE',
    kind: CompletionItemKind.Function,
    insertText: 'LAST_VALUE(${1:expression}) OVER (${2:PARTITION BY ${3:column} ORDER BY ${4:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression from the last row in the window.',
    detail: 'LAST_VALUE(expression) OVER (window_spec)',
  },
];

// BigQuery Array Functions
const ARRAY_FUNCTIONS = [
  {
    label: 'ARRAY',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY[${1:value1}, ${2:value2}]',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Creates an array from a list of values.',
    detail: 'ARRAY<T> ARRAY[value1, value2, ...]',
  },
  {
    label: 'ARRAY_LENGTH',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_LENGTH(${1:array})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the length of an array.',
    detail: 'INT64 ARRAY_LENGTH(array)',
  },
  {
    label: 'ARRAY_CONCAT',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_CONCAT(${1:array1}, ${2:array2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Concatenates two arrays.',
    detail: 'ARRAY<T> ARRAY_CONCAT(array1, array2)',
  },
  {
    label: 'UNNEST',
    kind: CompletionItemKind.Function,
    insertText: 'UNNEST(${1:array})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts an array into a table with one row per element.',
    detail: 'UNNEST(array)',
  },
];

// BigQuery Conditional Functions
const CONDITIONAL_FUNCTIONS = [
  {
    label: 'IF',
    kind: CompletionItemKind.Function,
    insertText: 'IF(${1:condition}, ${2:true_value}, ${3:false_value})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns one value if condition is true, another if false.',
    detail: 'IF(condition, true_value, false_value)',
  },
  {
    label: 'IFNULL',
    kind: CompletionItemKind.Function,
    insertText: 'IFNULL(${1:expression}, ${2:null_value})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the first non-NULL expression.',
    detail: 'IFNULL(expression1, expression2)',
  },
  {
    label: 'COALESCE',
    kind: CompletionItemKind.Function,
    insertText: 'COALESCE(${1:expression1}, ${2:expression2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the first non-NULL expression.',
    detail: 'COALESCE(expression1, expression2, ...)',
  },
  {
    label: 'NULLIF',
    kind: CompletionItemKind.Function,
    insertText: 'NULLIF(${1:expression1}, ${2:expression2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns NULL if expression1 equals expression2, otherwise returns expression1.',
    detail: 'NULLIF(expression1, expression2)',
  },
  {
    label: 'GREATEST',
    kind: CompletionItemKind.Function,
    insertText: 'GREATEST(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the greatest value among all arguments.',
    detail: 'GREATEST(value1, value2, ...)',
  },
  {
    label: 'LEAST',
    kind: CompletionItemKind.Function,
    insertText: 'LEAST(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the least value among all arguments.',
    detail: 'LEAST(value1, value2, ...)',
  },
];

// Combine all functions
const ALL_FUNCTIONS = [
  ...DATE_TIME_FUNCTIONS,
  ...STRING_FUNCTIONS,
  ...AGGREGATE_FUNCTIONS,
  ...WINDOW_FUNCTIONS,
  ...ARRAY_FUNCTIONS,
  ...CONDITIONAL_FUNCTIONS,
];

// Create keyword completions (range will be added in the provider)
const createKeywordCompletions = () => {
  return BIGQUERY_KEYWORDS.map((keyword) => ({
    label: keyword,
    kind: CompletionItemKind.Keyword,
    insertText: keyword,
    detail: 'BigQuery Keyword',
  }));
};

/**
 * Parses table reference pattern from text
 * Returns { project, dataset, table, prefix } or null if not a table reference
 */
function parseTableReference(text: string): {
  project?: string;
  dataset?: string;
  table?: string;
  prefix: string;
} | null {
  if (!text) return null;
  
  // Remove backticks for parsing
  const cleanText = text.replace(/`/g, '').trim();
  
  // Handle case where text ends with a dot (e.g., "project.dataset.")
  const endsWithDot = cleanText.endsWith('.');
  const textToParse = endsWithDot ? cleanText.slice(0, -1) : cleanText;
  
  // Match patterns like: project.dataset.table, dataset.table, or just table
  // Also handle partial matches like project.dataset. or dataset.
  const parts = textToParse.split('.').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return null;
  } else if (parts.length === 1) {
    // Just a table name or partial table name, or dataset name if ends with dot
    if (endsWithDot) {
      return { dataset: parts[0], table: '', prefix: '' };
    }
    return { table: parts[0], prefix: parts[0] };
  } else if (parts.length === 2) {
    // dataset.table or partial, or project.dataset if ends with dot
    if (endsWithDot) {
      return { project: parts[0], dataset: parts[1], table: '', prefix: '' };
    }
    return { dataset: parts[0], table: parts[1] || '', prefix: parts[1] || '' };
  } else if (parts.length === 3) {
    // project.dataset.table or partial
    return { project: parts[0], dataset: parts[1], table: parts[2] || '', prefix: parts[2] || '' };
  }
  
  return null;
}

/**
 * Extracts dataset and table identifiers from a table reference string
 */
function resolveDatasetTableFromRef(tableRef: string): { datasetId: string; tableId: string } | null {
  if (!tableRef) {
    return null;
  }

  const cleanRef = tableRef.replace(/[`"']/g, '');
  const parts = cleanRef.split('.').filter((part) => part.length > 0);

  if (parts.length === 2) {
    return { datasetId: parts[0], tableId: parts[1] };
  }

  if (parts.length === 3) {
    return { datasetId: parts[1], tableId: parts[2] };
  }

  return null;
}

/**
 * Gets text before cursor that might be a table reference
 */
function getTableReferenceText(model: any, position: any): string | null {
  const lineText = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineText.substring(0, position.column - 1);
  
  // Check if we're right after a dot FIRST (e.g., "project.dataset." or "dataset.")
  // This handles the case where user types "project.dataset." and expects table suggestions
  // This must be checked before the general dot check to catch trailing dots
  const dotMatch = textBeforeCursor.match(/([a-zA-Z0-9_`-]+(?:\.[a-zA-Z0-9_`-]+)*)\.$/);
  if (dotMatch) {
    return dotMatch[1] + '.';
  }
  
  // Look backwards from cursor to find the start of a potential table reference
  // Stop at whitespace, operators, or keywords like FROM, JOIN, etc.
  // Note: Don't stop at hyphens or dots as they're part of identifiers
  const stopPattern = /[\s,;()\[\]+*/=<>!|&]/;
  let end = textBeforeCursor.length;
  let start = end;
  
  // Find the end of the current word/identifier
  // Allow dots and hyphens in identifiers (for project.dataset.table and project-dataset-table)
  while (start > 0) {
    const char = textBeforeCursor[start - 1];
    if (stopPattern.test(char)) {
      break;
    }
    // Allow dots, hyphens, backticks, and alphanumeric characters
    if (!/[a-zA-Z0-9_`.\-]/.test(char)) {
      break;
    }
    start--;
  }
  
  // Get the text that might be a table reference
  const potentialRef = textBeforeCursor.substring(start, end).trim();
  
  // Always check if it contains dots (indicating project.dataset.table pattern)
  // This is the most reliable indicator of a table reference
  if (potentialRef.includes('.')) {
    return potentialRef;
  }
  
  // If no dots, check if we're in a context where table names are expected
  // Look for FROM, JOIN keywords before the cursor
  const fromMatch = textBeforeCursor.match(/\b(FROM|JOIN)\s+([^,\s;()]+)$/i);
  if (fromMatch) {
    return fromMatch[2];
  }
  
  // If we have a partial identifier and we're in a FROM/JOIN context, return it
  if (potentialRef && /[a-zA-Z0-9_`-]/.test(potentialRef)) {
    // Check if there's a FROM or JOIN keyword nearby
    const contextMatch = textBeforeCursor.match(/\b(FROM|JOIN)\s+[^,\s;()]*$/i);
    if (contextMatch) {
      return potentialRef;
    }
  }
  
  return null;
}

interface StatementContext {
  statementText: string;
  statementStartOffset: number;
  statementEndOffset: number;
  cursorOffsetInStatement: number;
  textBeforeCursor: string;
}

interface StatementBounds {
  startOffset: number;
  endOffset: number;
}

interface ScanState {
  inSingleQuote: boolean;
  inDoubleQuote: boolean;
  inBacktick: boolean;
  inLineComment: boolean;
  inBlockComment: boolean;
}

function createInitialScanState(): ScanState {
  return {
    inSingleQuote: false,
    inDoubleQuote: false,
    inBacktick: false,
    inLineComment: false,
    inBlockComment: false,
  };
}

function advanceScanState(state: ScanState, text: string, index: number): number {
  const char = text[index];
  const nextChar = index + 1 < text.length ? text[index + 1] : '';

  if (state.inLineComment) {
    if (char === '\n') {
      state.inLineComment = false;
    } else if (char === '\r') {
      state.inLineComment = false;
    }
    return 1;
  }

  if (state.inBlockComment) {
    if (char === '*' && nextChar === '/') {
      state.inBlockComment = false;
      return 2;
    }
    return 1;
  }

  if (!state.inSingleQuote && !state.inDoubleQuote && !state.inBacktick) {
    if (char === '-' && nextChar === '-') {
      state.inLineComment = true;
      return 2;
    }
    if (char === '/' && nextChar === '*') {
      state.inBlockComment = true;
      return 2;
    }
  }

  if (!state.inDoubleQuote && !state.inBacktick && char === "'") {
    if (state.inSingleQuote && nextChar === "'") {
      return 2;
    }
    state.inSingleQuote = !state.inSingleQuote;
    return 1;
  }

  if (!state.inSingleQuote && !state.inBacktick && char === '"') {
    if (state.inDoubleQuote && nextChar === '"') {
      return 2;
    }
    state.inDoubleQuote = !state.inDoubleQuote;
    return 1;
  }

  if (!state.inSingleQuote && !state.inDoubleQuote && char === '`') {
    state.inBacktick = !state.inBacktick;
    return 1;
  }

  return 1;
}

function findStatementBounds(fullText: string, cursorOffset: number): StatementBounds {
  const len = fullText.length;
  const stateBeforeCursor = createInitialScanState();
  let startOffset = 0;
  let i = 0;

  while (i < Math.min(cursorOffset, len)) {
    const char = fullText[i];
    if (
      !stateBeforeCursor.inSingleQuote &&
      !stateBeforeCursor.inDoubleQuote &&
      !stateBeforeCursor.inBacktick &&
      !stateBeforeCursor.inLineComment &&
      !stateBeforeCursor.inBlockComment &&
      char === ';'
    ) {
      startOffset = i + 1;
      i++;
      continue;
    }
    i += advanceScanState(stateBeforeCursor, fullText, i);
  }

  const stateAfterCursor: ScanState = { ...stateBeforeCursor };
  let endOffset = len;
  let j = cursorOffset;

  while (j < len) {
    const char = fullText[j];
    if (
      !stateAfterCursor.inSingleQuote &&
      !stateAfterCursor.inDoubleQuote &&
      !stateAfterCursor.inBacktick &&
      !stateAfterCursor.inLineComment &&
      !stateAfterCursor.inBlockComment &&
      char === ';'
    ) {
      endOffset = j;
      break;
    }
    j += advanceScanState(stateAfterCursor, fullText, j);
  }

  return { startOffset, endOffset };
}

function getStatementContext(model: any, position: any): StatementContext | null {
  if (!model || typeof model.getValue !== 'function' || typeof model.getOffsetAt !== 'function') {
    return null;
  }
  const fullText = model.getValue();
  const cursorOffset = model.getOffsetAt(position);
  const { startOffset, endOffset } = findStatementBounds(fullText, cursorOffset);
  const safeStart = Math.max(0, startOffset);
  const safeEnd = Math.max(safeStart, endOffset);
  const statementText = fullText.substring(safeStart, safeEnd);
  const cursorOffsetInStatement = cursorOffset - safeStart;
  return {
    statementText,
    statementStartOffset: safeStart,
    statementEndOffset: safeEnd,
    cursorOffsetInStatement,
    textBeforeCursor: statementText.substring(0, Math.max(0, cursorOffsetInStatement)),
  };
}

/**
 * Parses JOIN statements from SQL to extract table references and aliases
 * Returns array of { tableRef, alias, joinType } for each JOIN
 */
function parseJoinStatements(sql: string): Array<{
  tableRef: string;
  alias: string | null;
  joinType: string;
  position: number;
}> {
  const joins: Array<{ tableRef: string; alias: string | null; joinType: string; position: number }> = [];
  
  // Strip comments to avoid matching inside comments
  const stripComments = (text: string): string => {
    let result = '';
    let i = 0;
    const len = text.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        result += char;
        i++;
        continue;
      }

      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      if (char === '-' && nextChar === '-') {
        while (i < len && text[i] !== '\n' && text[i] !== '\r') {
          i++;
        }
        if (i < len && text[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && text[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && text[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < len) {
          if (text[i] === '*' && i + 1 < len && text[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        result += ' ';
        continue;
      }

      result += char;
      i++;
    }

    return result;
  };
  
  const sqlWithoutComments = stripComments(sql);
  
  // Match JOIN patterns: [LEFT|RIGHT|INNER|OUTER|FULL|CROSS] JOIN table_ref [AS alias] or table_ref alias
  // First try to match with explicit AS
  const joinPatternWithAs = /\b((?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+)?JOIN\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+AS\s+([\w\-]+)/gi;
  const matchesWithAs = Array.from(sqlWithoutComments.matchAll(joinPatternWithAs));
  
  for (const match of matchesWithAs) {
    const joinType = (match[1] || '').trim().toUpperCase() || 'INNER';
    const tableRef = match[2].trim();
    const alias = match[3] || null;
    const position = match.index || 0;
    joins.push({ tableRef, alias, joinType, position });
  }
  
  // Then match without AS - look for JOIN table_ref followed by a word that could be an alias
  const joinPatternWithoutAs = /\b((?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+)?JOIN\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+([\w\-]+)(?=\s+ON|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/gi;
  const matchesWithoutAs = Array.from(sqlWithoutComments.matchAll(joinPatternWithoutAs));
  
  for (const match of matchesWithoutAs) {
    const joinType = (match[1] || '').trim().toUpperCase() || 'INNER';
    const tableRef = match[2].trim();
    const potentialAlias = match[3] || null;
    
    // Only add if we haven't already added this JOIN (from the AS pattern)
    const alreadyAdded = joins.some(j => 
      j.position === (match.index || 0) && 
      j.tableRef === tableRef
    );
    
    if (!alreadyAdded && potentialAlias) {
      // Verify it's likely an alias (not a keyword or part of table name)
      const isKeyword = /^(ON|WHERE|ORDER|GROUP|HAVING|LIMIT|SELECT|FROM|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS)$/i.test(potentialAlias);
      if (!isKeyword && !potentialAlias.includes('.')) {
        joins.push({ tableRef, alias: potentialAlias, joinType, position: match.index || 0 });
      }
    }
  }
  
  // Sort joins by position to maintain order
  joins.sort((a, b) => a.position - b.position);
  
  return joins;
}

/**
 * Parses FROM clause to extract the first table reference and alias
 */
function parseFromClause(sql: string): { tableRef: string; alias: string | null } | null {
  const stripComments = (text: string): string => {
    let result = '';
    let i = 0;
    const len = text.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        result += char;
        i++;
        continue;
      }

      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      if (char === '-' && nextChar === '-') {
        while (i < len && text[i] !== '\n' && text[i] !== '\r') {
          i++;
        }
        if (i < len && text[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && text[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && text[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < len) {
          if (text[i] === '*' && i + 1 < len && text[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        result += ' ';
        continue;
      }

      result += char;
      i++;
    }

    return result;
  };
  
  const sqlWithoutComments = stripComments(sql);
  
  // Match FROM table_ref [AS alias] or table_ref alias
  // First try with explicit AS
  const fromPatternWithAs = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+AS\s+([\w\-]+)/i;
  const matchWithAs = sqlWithoutComments.match(fromPatternWithAs);
  
  if (matchWithAs) {
    return { tableRef: matchWithAs[1].trim(), alias: matchWithAs[2] || null };
  }
  
  // Then try without AS
  const fromPatternWithoutAs = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+([\w\-]+)(?=\s+JOIN|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/i;
  const matchWithoutAs = sqlWithoutComments.match(fromPatternWithoutAs);
  
  if (matchWithoutAs) {
    const tableRef = matchWithoutAs[1].trim();
    const potentialAlias = matchWithoutAs[2];
    
    // Verify it's likely an alias (not a keyword)
    const isKeyword = /^(JOIN|WHERE|ORDER|GROUP|HAVING|LIMIT|SELECT)$/i.test(potentialAlias);
    if (!isKeyword && !potentialAlias.includes('.')) {
      return { tableRef, alias: potentialAlias };
    }
  }
  
  // Fallback: just the table reference without alias
  const fromPatternNoAlias = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))(?=\s+JOIN|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/i;
  const matchNoAlias = sqlWithoutComments.match(fromPatternNoAlias);
  
  if (matchNoAlias) {
    return { tableRef: matchNoAlias[1].trim(), alias: null };
  }
  
  return null;
}

/**
 * Detects if we're in a SELECT clause and returns all available table references with aliases
 */
function detectSelectContext(
  model: any,
  position: any,
  statementContext?: StatementContext | null
): Array<{ tableRef: string; alias: string | null }> | null {
  const fallbackText = model.getValue();
  const cursorOffset = statementContext ? statementContext.cursorOffsetInStatement : model.getOffsetAt(position);
  const textUpToCursor = statementContext ? statementContext.textBeforeCursor : fallbackText.substring(0, cursorOffset);
  const statementSql = statementContext ? statementContext.statementText : fallbackText;
  
  // Look for the last SELECT before the cursor inside the active statement
  const selectMatches = Array.from(textUpToCursor.matchAll(/\bSELECT\s+/gi)) as RegExpMatchArray[];
  if (selectMatches.length === 0) {
    return null;
  }
  
  const lastSelectMatch = selectMatches[selectMatches.length - 1];
  const selectIndex = lastSelectMatch.index || 0;
  const selectScopedTextUpToCursor = textUpToCursor.substring(selectIndex);
  const selectScopedStatementText = statementSql.substring(selectIndex);
  
  // Find the FROM keyword after the located SELECT
  const fromMatch = selectScopedTextUpToCursor.match(/\bFROM\s+/i);
  
  // If we haven't reached FROM yet, or cursor is before FROM, we're in SELECT clause
  if (!fromMatch || cursorOffset <= selectIndex + (fromMatch.index || 0)) {
    const fromClause = parseFromClause(selectScopedStatementText);
    const joins = parseJoinStatements(selectScopedStatementText);
    
    const tables: Array<{ tableRef: string; alias: string | null }> = [];
    
    if (fromClause) {
      tables.push(fromClause);
    }
    
    for (const join of joins) {
      tables.push({
        tableRef: join.tableRef,
        alias: join.alias,
      });
    }
    
    return tables.length > 0 ? tables : null;
  }
  
  return null;
}

/**
 * Detects if we're in a JOIN ON clause and returns the relevant table references
 */
function detectJoinOnContext(
  model: any,
  position: any,
  statementContext?: StatementContext | null
): { leftTable: { tableRef: string; alias: string | null } | null; rightTable: { tableRef: string; alias: string | null } | null } | null {
  const fallbackText = model.getValue();
  const cursorOffset = statementContext ? statementContext.cursorOffsetInStatement : model.getOffsetAt(position);
  const textUpToCursor = statementContext ? statementContext.textBeforeCursor : fallbackText.substring(0, cursorOffset);
  const statementSql = statementContext ? statementContext.statementText : fallbackText;
  
  const selectMatches = Array.from(textUpToCursor.matchAll(/\bSELECT\s+/gi)) as RegExpMatchArray[];
  if (selectMatches.length === 0) {
    return null;
  }
  const lastSelectMatch = selectMatches[selectMatches.length - 1];
  const selectIndex = lastSelectMatch.index || 0;
  const selectScopedTextUpToCursor = textUpToCursor.substring(selectIndex);
  const selectScopedStatementText = statementSql.substring(selectIndex);
  
  // Check if we're after an ON keyword that follows a JOIN
  const onMatches = Array.from(selectScopedTextUpToCursor.matchAll(/\bON\s+/gi)) as RegExpMatchArray[];
  if (onMatches.length === 0) {
    return null;
  }
  
  const lastOnMatch = onMatches[onMatches.length - 1];
  const onIndex = lastOnMatch.index || 0;
  
  // Ensure there is a JOIN prior to this ON within the active statement
  const textBeforeOn = selectScopedTextUpToCursor.substring(0, onIndex);
  const joinMatch = textBeforeOn.match(/\b(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)?\s+JOIN\s+/i);
  if (!joinMatch) {
    return null;
  }
  
  // Parse FROM clause and JOIN statements using text up to cursor to stay within the active statement
  const fromClause = parseFromClause(selectScopedStatementText);
  if (!fromClause) {
    return null;
  }
  
  const joins = parseJoinStatements(selectScopedTextUpToCursor);
  if (joins.length === 0) {
    return null;
  }
  
  const activeJoin = joins[joins.length - 1];
  if (!activeJoin) {
    return null;
  }
  
  const leftTable = fromClause;
  const rightTable = {
    tableRef: activeJoin.tableRef,
    alias: activeJoin.alias,
  };
  
  return { leftTable, rightTable };
}

/**
 * Gets column suggestions for JOIN ON clause
 */
async function getJoinColumnSuggestions(
  projectId: string,
  leftTable: { tableRef: string; alias: string | null },
  rightTable: { tableRef: string; alias: string | null },
  prefix: string = ''
): Promise<any[]> {
  const suggestions: any[] = [];
  
  try {
    // Parse table references to get dataset and table IDs
    const parseTableRef = (tableRef: string): { datasetId: string; tableId: string } | null => {
      const cleanRef = tableRef.replace(/[`"']/g, '');
      const parts = cleanRef.split('.').filter(p => p.length > 0);
      
      if (parts.length === 2) {
        return { datasetId: parts[0], tableId: parts[1] };
      } else if (parts.length === 3) {
        return { datasetId: parts[1], tableId: parts[2] };
      }
      
      return null;
    };
    
    const leftParsed = parseTableRef(leftTable.tableRef);
    const rightParsed = parseTableRef(rightTable.tableRef);
    
    if (!leftParsed || !rightParsed) {
      return [];
    }
    
    // Get schemas for both tables
    const [leftSchema, rightSchema] = await Promise.all([
      getTableSchema(projectId, leftParsed.datasetId, leftParsed.tableId),
      getTableSchema(projectId, rightParsed.datasetId, rightParsed.tableId),
    ]);
    
    const prefixLower = prefix.toLowerCase();
    
    // Add columns from left table
    const leftAlias = leftTable.alias || leftParsed.tableId;
    for (const field of leftSchema) {
      const fieldName = field.name;
      if (!prefixLower || fieldName.toLowerCase().startsWith(prefixLower)) {
        suggestions.push({
          label: `${leftAlias}.${fieldName}`,
          kind: CompletionItemKind.Property,
          insertText: `${leftAlias}.${fieldName}`,
          detail: `Column: ${fieldName} (${field.type || 'unknown'})`,
          documentation: `Column from ${leftTable.tableRef}`,
        });
      }
    }
    
    // Add columns from right table
    const rightAlias = rightTable.alias || rightParsed.tableId;
    for (const field of rightSchema) {
      const fieldName = field.name;
      if (!prefixLower || fieldName.toLowerCase().startsWith(prefixLower)) {
        suggestions.push({
          label: `${rightAlias}.${fieldName}`,
          kind: CompletionItemKind.Property,
          insertText: `${rightAlias}.${fieldName}`,
          detail: `Column: ${fieldName} (${field.type || 'unknown'})`,
          documentation: `Column from ${rightTable.tableRef}`,
        });
      }
    }
  } catch (error) {
    // Silently handle errors
  }
  
  return suggestions;
}

/**
 * Gets matching tables from cache (synchronous)
 */
/**
 * Calculates a match score for a table name against a search pattern.
 * Higher scores indicate better matches.
 * 
 * @param tableName - The table name to match against
 * @param pattern - The search pattern (already lowercase)
 * @returns A score object with match status and priority, or null if no match
 */
function calculateTableMatchScore(tableName: string, pattern: string): { score: number; matchType: 'prefix' | 'segment' | 'segment-start' | 'contains' | 'fuzzy' } | null {
  const lowerName = tableName.toLowerCase();
  
  // Priority 1: Exact prefix match (highest priority)
  if (lowerName.startsWith(pattern)) {
    return { score: 1000 - lowerName.length, matchType: 'prefix' };
  }
  
  // Priority 2: Segment match - pattern matches start of any underscore/hyphen-separated segment sequence
  // e.g., "dim_acc" matches "whs_dim_account" because "dim_acc" starts the segment "dim_account"
  const segments = lowerName.split(/[_-]/);
  for (let i = 1; i < segments.length; i++) {
    // Build the remaining part from this segment onwards
    const remainingSegments = segments.slice(i).join('_');
    if (remainingSegments.startsWith(pattern)) {
      // Earlier segment matches get slightly higher priority
      return { score: 900 - i * 10 - lowerName.length, matchType: 'segment' };
    }
  }
  
  // Priority 3: Single segment start match - pattern matches the start of any individual segment
  // e.g., "agreement" matches "whs_dim_agreement" because segment "agreement" starts with "agreement"
  // e.g., "agree" matches "whs_dim_agreement" because segment "agreement" starts with "agree"
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].startsWith(pattern)) {
      // Earlier segment matches get slightly higher priority
      return { score: 800 - i * 10 - lowerName.length, matchType: 'segment-start' };
    }
  }
  
  // Priority 4: Contains match - pattern appears anywhere in the name
  // e.g., "ount" matches "dim_account_history"
  const containsIndex = lowerName.indexOf(pattern);
  if (containsIndex > 0) {
    // Earlier occurrence gets higher priority
    return { score: 600 - containsIndex - lowerName.length, matchType: 'contains' };
  }
  
  // Priority 5: Fuzzy segment match - each part of the pattern (split by underscore) 
  // matches the start of corresponding segments in order
  // e.g., "dim_acc" could match "dimension_table_account" (dim->dimension, acc->account)
  const patternParts = pattern.split(/[_-]/);
  if (patternParts.length > 1) {
    let segmentIndex = 0;
    let allPartsMatch = true;
    
    for (const part of patternParts) {
      let found = false;
      // Look for this part starting from current segment index
      for (let i = segmentIndex; i < segments.length; i++) {
        if (segments[i].startsWith(part)) {
          segmentIndex = i + 1; // Next part must match a later segment
          found = true;
          break;
        }
      }
      if (!found) {
        allPartsMatch = false;
        break;
      }
    }
    
    if (allPartsMatch) {
      return { score: 400 - lowerName.length, matchType: 'fuzzy' };
    }
  }
  
  return null;
}

/**
 * Filters and sorts tables based on the search pattern using intelligent matching.
 * 
 * @param tables - Array of tables to filter
 * @param pattern - The search pattern (will be lowercased)
 * @returns Filtered and sorted array of tables with their match info
 */
function filterTablesWithScoring<T extends { name: string }>(
  tables: T[],
  pattern: string
): Array<{ table: T; score: number; matchType: string }> {
  if (!pattern) {
    return tables.map(table => ({ table, score: 0, matchType: 'all' }));
  }
  
  const lowerPattern = pattern.toLowerCase();
  const results: Array<{ table: T; score: number; matchType: string }> = [];
  
  for (const table of tables) {
    const match = calculateTableMatchScore(table.name, lowerPattern);
    if (match) {
      results.push({ table, score: match.score, matchType: match.matchType });
    }
  }
  
  // Sort by score descending (higher is better)
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

function getMatchingTablesFromCache(
  projectId: string,
  parsedRef: { project?: string; dataset?: string; table?: string; prefix: string },
  getMetadataStore: () => { getDatasetTables: (datasetId: string) => any[] | undefined; getAllTables: () => Array<{ dataset: string; table: any }>; datasets: any[] }
): any[] {
  const suggestions: any[] = [];
  const metadataStore = getMetadataStore();
  
  try {
    // If we have a project and dataset, search for tables in that dataset
    if (parsedRef.project && parsedRef.dataset) {
      const tables = metadataStore.getDatasetTables(parsedRef.dataset);
      if (tables) {
        const prefix = parsedRef.prefix;
        const filtered = filterTablesWithScoring(tables, prefix);
        
        filtered.forEach(({ table, matchType }) => {
          // When we have project.dataset, only insert the table name (not the full path)
          // The user has already typed project.dataset, so we just complete with the table name
          const fullName = `${parsedRef.project}.${parsedRef.dataset}.${table.name}`;
          suggestions.push({
            label: table.name,
            kind: CompletionItemKind.Class,
            insertText: table.name, // Only table name since project.dataset is already typed
            detail: `Table: ${fullName}`,
            documentation: `Table in ${parsedRef.project}.${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
      }
    }
    // If we only have a dataset, search for tables in that dataset
    else if (parsedRef.dataset) {
      const tables = metadataStore.getDatasetTables(parsedRef.dataset);
      if (tables && tables.length > 0) {
        const prefix = parsedRef.prefix;
        const filtered = filterTablesWithScoring(tables, prefix);
        
        filtered.forEach(({ table, matchType }) => {
          // When we have a dataset, only insert the table name (not the full path)
          // The user has already typed the dataset, so we just complete with the table name
          const insertText = table.name; // Just the table name
          const fullName = projectId 
            ? `${projectId}.${parsedRef.dataset}.${table.name}`
            : `${parsedRef.dataset}.${table.name}`;
          suggestions.push({
            label: table.name,
            kind: CompletionItemKind.Class,
            insertText: insertText, // Only table name, not full path
            detail: `Table: ${fullName}`,
            documentation: projectId 
              ? `Table in ${projectId}.${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`
              : `Table in ${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
      }
    }
    // If we only have a prefix, search across all datasets
    else if (parsedRef.prefix) {
      const prefix = parsedRef.prefix;
      const allTables = metadataStore.getAllTables();
      
      // Filter tables using the improved matching algorithm
      const tablesWithNames = allTables.map(({ dataset, table }) => ({
        name: table.name,
        dataset,
        table
      }));
      
      const filtered = filterTablesWithScoring(tablesWithNames, prefix);
      
      filtered
        .slice(0, 50) // Limit to 50 suggestions
        .forEach(({ table: { dataset, table }, matchType }) => {
          // Always include project ID in the full path if available
          const fullName = projectId
            ? `${projectId}.${dataset}.${table.name}`
            : `${dataset}.${table.name}`;
          suggestions.push({
            label: `${dataset}.${table.name}`, // Show dataset.table in label for clarity
            kind: CompletionItemKind.Class,
            insertText: fullName, // Insert full project.dataset.table path if projectId available
            detail: `Table: ${fullName}`,
            documentation: projectId 
              ? `Table in ${projectId}.${dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`
              : `Table in ${dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
    }
    
    return suggestions;
  } catch (error) {
    return [];
  }
}

/**
 * Creates a completion provider for BigQuery SQL
 */
export function createBigQueryCompletionProvider(monaco: Monaco, getProjectId: () => string | null): any {
  return {
    triggerCharacters: ['.'], // Trigger on dot to show table suggestions
    provideCompletionItems: async (model: any, position: any, context: any) => {
      const word = model.getWordUntilPosition(position);
      const lineText = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineText.substring(0, position.column - 1);
      const statementContext = getStatementContext(model, position);
      
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Check if we're in a SELECT clause first (for column suggestions)
      const projectId = getProjectId();
      let selectColumnSuggestions: any[] = [];
      let isSelectContext = false;
      let joinColumnSuggestions: any[] = [];
      let isJoinOnContext = false;
      
      if (projectId) {
        // Check for SELECT clause context
        const selectTables = detectSelectContext(model, position, statementContext);
        if (selectTables && selectTables.length > 0) {
          // Check if we're typing after a table alias dot (e.g., "da." or "dp.id")
          const aliasDotMatch = textBeforeCursor.match(/([\w\-]+)\.([\w\-]*)$/);
          
          if (aliasDotMatch) {
            const typedAlias = aliasDotMatch[1];
            const partialColumn = aliasDotMatch[2] || '';
            
            // Find matching table by alias
            const getTableAlias = (table: { tableRef: string; alias: string | null }): string => {
              if (table.alias) {
                return table.alias;
              }
              const cleanRef = table.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              return parts[parts.length - 1] || '';
            };
            
            for (const table of selectTables) {
              const tableAlias = getTableAlias(table);
              if (typedAlias.toLowerCase() === tableAlias.toLowerCase()) {
                isSelectContext = true;
                
                const resolvedRef = resolveDatasetTableFromRef(table.tableRef);
                
                if (resolvedRef) {
                  const { datasetId, tableId } = resolvedRef;
                  try {
                    const schema = await getTableSchema(projectId, datasetId, tableId);
                    const prefixLower = partialColumn.toLowerCase();
                    
                    // Calculate proper range
                    const dotPosition = textBeforeCursor.lastIndexOf('.');
                    const rangeStartColumn = partialColumn 
                      ? (dotPosition + 2)
                      : position.column;
                    const rangeEndColumn = position.column;
                    
                    for (const field of schema) {
                      if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                        selectColumnSuggestions.push({
                          label: field.name,
                          kind: CompletionItemKind.Property,
                          insertText: field.name,
                          detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                          documentation: `Column from ${table.tableRef}`,
                          range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: rangeStartColumn,
                            endColumn: rangeEndColumn,
                          },
                        });
                      }
                    }
                  } catch (error) {
                    // Silently handle errors
                  }
                }
                break;
              }
            }
          }

          if (!isSelectContext) {
            const dedupedTables: Array<{
              alias: string | null;
              tableRef: string;
              datasetId: string;
              tableId: string;
            }> = [];
            const seenTables = new Set<string>();

            for (const table of selectTables) {
              const resolvedRef = resolveDatasetTableFromRef(table.tableRef);
              if (!resolvedRef) {
                continue;
              }

              const key = table.alias
                ? `alias:${table.alias.toLowerCase()}`
                : `table:${resolvedRef.datasetId.toLowerCase()}.${resolvedRef.tableId.toLowerCase()}`;

              if (seenTables.has(key)) {
                continue;
              }

              seenTables.add(key);
              dedupedTables.push({
                alias: table.alias,
                tableRef: table.tableRef,
                datasetId: resolvedRef.datasetId,
                tableId: resolvedRef.tableId,
              });
            }

            if (dedupedTables.length > 0) {
              try {
                const schemaResults = await Promise.all(
                  dedupedTables.map(async (tableInfo) => ({
                    tableInfo,
                    schema: await getTableSchema(projectId, tableInfo.datasetId, tableInfo.tableId),
                  }))
                );

                const partialColumn = word.word || '';
                const prefixLower = partialColumn.toLowerCase();
                const baseRange = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                };
                const shouldInsertBareColumns = dedupedTables.length === 1 && !dedupedTables[0].alias;

                for (const { tableInfo, schema } of schemaResults) {
                  const displayPrefix = tableInfo.alias || tableInfo.tableId;
                  for (const field of schema) {
                    if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                      const label = shouldInsertBareColumns && !tableInfo.alias
                        ? field.name
                        : `${displayPrefix}.${field.name}`;
                      selectColumnSuggestions.push({
                        label,
                        kind: CompletionItemKind.Property,
                        insertText: label,
                        detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                        documentation: `Column from ${tableInfo.tableRef}`,
                        range: baseRange,
                      });
                    }
                  }
                }

                if (selectColumnSuggestions.length > 0) {
                  isSelectContext = true;
                }
              } catch (error) {
                // Silently handle errors
              }
            }
          }
        }
        
        // Check if we're in a JOIN ON clause
        const joinContext = detectJoinOnContext(model, position, statementContext);
        if (joinContext && joinContext.leftTable && joinContext.rightTable) {
          isJoinOnContext = true;
          
          // Get the current word/prefix for filtering
          const currentWord = word.word || '';
          
          // Check if we're typing after a table alias dot (e.g., "dp." or "da.id")
          const textBeforeCursor = lineText.substring(0, position.column - 1);
          // Match alias followed by dot, optionally followed by a partial column name
          const aliasDotMatch = textBeforeCursor.match(/([\w\-]+)\.([\w\-]*)$/);
          
          if (aliasDotMatch) {
            // User typed an alias and dot, possibly with a partial column name
            const typedAlias = aliasDotMatch[1];
            const partialColumn = aliasDotMatch[2] || '';
            
            // Get aliases for both tables
            const getTableAlias = (table: { tableRef: string; alias: string | null }): string => {
              if (table.alias) {
                return table.alias;
              }
              // Extract table name from tableRef
              const cleanRef = table.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              return parts[parts.length - 1] || '';
            };
            
            const leftAlias = getTableAlias(joinContext.leftTable);
            const rightAlias = getTableAlias(joinContext.rightTable);
            
            // Determine which table's columns to show
            let targetTable: { tableRef: string; alias: string | null } | null = null;
            if (typedAlias.toLowerCase() === leftAlias.toLowerCase()) {
              targetTable = joinContext.leftTable;
            } else if (typedAlias.toLowerCase() === rightAlias.toLowerCase()) {
              targetTable = joinContext.rightTable;
            }
            
            if (targetTable) {
              // Parse table reference
              const cleanRef = targetTable.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              let datasetId: string | null = null;
              let tableId: string | null = null;
              
              if (parts.length === 2) {
                datasetId = parts[0];
                tableId = parts[1];
              } else if (parts.length === 3) {
                datasetId = parts[1];
                tableId = parts[2];
              }
              
              if (datasetId && tableId) {
                try {
                  const schema = await getTableSchema(projectId, datasetId, tableId);
                  const prefixLower = partialColumn.toLowerCase();
                  
                  // Calculate proper range - if we're right after the dot, start at cursor position
                  // Otherwise, replace the partial column name
                  const dotPosition = textBeforeCursor.lastIndexOf('.');
                  const rangeStartColumn = partialColumn 
                    ? (dotPosition + 2) // After the dot, replace partial column
                    : position.column;   // Right after dot, insert at cursor
                  const rangeEndColumn = position.column;
                  
                  for (const field of schema) {
                    // Filter by partial column name if provided
                    if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                      joinColumnSuggestions.push({
                        label: field.name,
                        kind: CompletionItemKind.Property,
                        insertText: field.name,
                        detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                        documentation: `Column from ${targetTable.tableRef}`,
                        range: {
                          startLineNumber: position.lineNumber,
                          endLineNumber: position.lineNumber,
                          startColumn: rangeStartColumn,
                          endColumn: rangeEndColumn,
                        },
                      });
                    }
                  }
                } catch (error) {
                  // Silently handle errors
                }
              }
            }
          } else {
            // Not after a dot, show columns from both tables with aliases
            try {
              joinColumnSuggestions = await getJoinColumnSuggestions(
                projectId,
                joinContext.leftTable,
                joinContext.rightTable,
                currentWord
              );
              
              // Update range for column suggestions
              joinColumnSuggestions = joinColumnSuggestions.map((item) => ({
                ...item,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                },
              }));
            } catch (error) {
              // Silently handle errors
            }
          }
        }
      }
      
      // Try to get table suggestions
      const tableRefText = getTableReferenceText(model, position);
      let tableSuggestions: any[] = [];
      let hasTableContext = false;
      
      // Skip table suggestions if we're in SELECT or JOIN ON context (unless we're typing a table reference)
      if (!isSelectContext && !isJoinOnContext && tableRefText && projectId) {
        const parsedRef = parseTableReference(tableRefText);
        
        if (parsedRef) {
          try {
            // Use cached data from metadata store (synchronous)
            const getMetadataStore = metadataStoreGetter || (() => {
              // Fallback: try to get from window if available
              if (typeof window !== 'undefined' && (window as any).__bigqueryMetadataStore) {
                return (window as any).__bigqueryMetadataStore;
              }
              return { getDatasetTables: () => undefined, getAllTables: () => [], datasets: [] };
            });
            
            const metadataStore = getMetadataStore();
            tableSuggestions = getMatchingTablesFromCache(projectId, parsedRef, getMetadataStore);
            
            // If we have table suggestions, we're in a table context
            hasTableContext = tableSuggestions.length > 0;
            
            // Update range for table suggestions
            if (tableSuggestions.length > 0) {
              // Calculate the actual range for the table reference
              const lineText = model.getLineContent(position.lineNumber);
              const textBeforeCursor = lineText.substring(0, position.column - 1);
              
              // Check if we're right after a dot (e.g., "Bricks.")
              const endsWithDot = textBeforeCursor.endsWith('.');
              
              let startColumn: number;
              let endColumn: number;
              
              if (endsWithDot) {
                // When cursor is right after a dot, we want to insert the table name
                // The range should start at the cursor position (after the dot)
                // and end at the cursor position (replacing nothing, just inserting)
                startColumn = position.column;
                endColumn = position.column;
              } else {
                // When typing a partial table name (e.g., "Bricks.B1"), replace from after the last dot
                // Find the position right after the last dot
                const lastDotIndex = textBeforeCursor.lastIndexOf('.');
                
                if (lastDotIndex >= 0) {
                  // We have a dot, so replace everything after it
                  startColumn = lastDotIndex + 2; // +1 for 0-index, +1 to be after the dot
                  endColumn = position.column;
                } else {
                  // No dot found, find the start of the current identifier
                  // Look backwards from cursor to find the start, stopping at spaces or operators
                  const stopPattern = /[\s,;()\[\]+*/=<>!|&]/;
                  let start = textBeforeCursor.length;
                  
                  // Find the start of the current word/identifier
                  while (start > 0) {
                    const char = textBeforeCursor[start - 1];
                    if (stopPattern.test(char)) {
                      break;
                    }
                    // Allow dots, hyphens, backticks, and alphanumeric characters
                    if (!/[a-zA-Z0-9_`.\-]/.test(char)) {
                      break;
                    }
                    start--;
                  }
                  
                  startColumn = start + 1;
                  endColumn = position.column;
                }
              }
              
              const tableRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn,
                endColumn,
              };
              
              tableSuggestions = tableSuggestions.map((item) => ({
                ...item,
                range: tableRange,
              }));
            }
          } catch (error) {
            // Silently handle errors
          }
        }
      }

      // Prioritize column suggestions based on context
      // SELECT context takes precedence, then JOIN ON context
      const suggestions: any[] = [];
      
      if (isSelectContext && selectColumnSuggestions.length > 0) {
        // In SELECT context, show column suggestions from the selected table
        selectColumnSuggestions.sort((a, b) => a.label.localeCompare(b.label));
        suggestions.push(...selectColumnSuggestions);
      } else if (isJoinOnContext) {
        // In JOIN ON context, show column suggestions from both tables
        if (joinColumnSuggestions.length > 0) {
          // Sort suggestions by label for better UX
          joinColumnSuggestions.sort((a, b) => a.label.localeCompare(b.label));
          suggestions.push(...joinColumnSuggestions);
        }
        // If no column suggestions but we're in JOIN context, don't show other suggestions
        // (this prevents showing keywords/functions when user expects columns)
      } else {
        // Check if we have a table reference with a trailing dot - this is a strong signal for table context
        const hasTrailingDot = tableRefText?.endsWith('.');
        
        if (hasTableContext || (hasTrailingDot && tableRefText)) {
          // In table context or after a dot, only show table suggestions
          suggestions.push(...tableSuggestions);
        } else if (tableRefText) {
          // We detected a table reference but no suggestions found - still show table suggestions first
          suggestions.push(...tableSuggestions);
          
          // Add keywords/functions only if we have no table suggestions
          if (tableSuggestions.length === 0) {
            const keywordCompletions = createKeywordCompletions();
            suggestions.push(
              ...keywordCompletions.map((item) => ({
                ...item,
                range,
              })),
              ...ALL_FUNCTIONS.map((item) => ({
                ...item,
                range,
              }))
            );
          }
        } else {
          // Not in table context, show standard completions
          const keywordCompletions = createKeywordCompletions();
          suggestions.push(
            ...keywordCompletions.map((item) => ({
              ...item,
              range,
            })),
            ...ALL_FUNCTIONS.map((item) => ({
              ...item,
              range,
            })),
            ...tableSuggestions // Still include table suggestions if any (for prefix-only searches)
          );
        }
      }

      return { suggestions };
    },
  };
}

// Track whether completion provider has been registered to avoid duplicates
let completionProviderRegistered = false;

/**
 * Registers BigQuery language support with Monaco Editor
 */
export function registerBigQueryLanguage(
  monaco?: typeof import('monaco-editor'),
  getProjectId?: () => string | null
): void {
  // Avoid registering multiple completion providers (which causes duplicate suggestions)
  if (completionProviderRegistered) {
    return;
  }
  
  // Use provided monaco instance or try to get from window
  const monacoInstance = monaco || (typeof window !== 'undefined' ? (window as any).monaco : null);
  
  if (!monacoInstance) {
    return;
  }

  // Default getProjectId function that tries to get from connection store
  const defaultGetProjectId = getProjectId || (() => {
    if (typeof window !== 'undefined') {
      // Try to get from the function set by QueryEditor component
      try {
        const getter = (window as any).__bigqueryGetProjectId;
        if (typeof getter === 'function') {
          return getter();
        }
      } catch {
        // Ignore errors
      }
    }
    return null;
  });

  // Register completion provider for SQL language
  const providers = monacoInstance.languages.getLanguages();
  const sqlLanguage = providers.find((lang: { id: string }) => lang.id === 'sql');
  
  if (sqlLanguage) {
    monacoInstance.languages.registerCompletionItemProvider('sql', createBigQueryCompletionProvider(monacoInstance, defaultGetProjectId));
    completionProviderRegistered = true;
  }
}
````

## File: README.md
````markdown
# QueryForge

A powerful desktop application for browsing and querying Google Cloud Platform BigQuery data. Built with Electron, React, and TypeScript, QueryForge provides a native desktop experience for BigQuery operations with rich features for data analysts and developers.

## Features

### Connection Management
- **Flexible Authentication**: Connect using service account credentials or Application Default Credentials (ADC)
- **Connection Persistence**: Connection settings persist across sessions
- **Connection Testing**: Validate credentials before establishing connection

### Query Execution
- **Rich SQL Editor**: Monaco Editor (VS Code's editor) with BigQuery-specific syntax highlighting
- **Intelligent Autocomplete**: Context-aware suggestions for tables, columns, and BigQuery functions
- **Query Formatting**: Auto-format SQL with Cmd/Ctrl+Shift+F
- **Query Validation**: Syntax validation before execution
- **Query Cancellation**: Cancel long-running queries
- **Progress Indication**: Visual feedback during query execution

### Multi-Tab Workflow
- **Multiple Tabs**: Work with multiple queries simultaneously in separate tabs
- **Tab Persistence**: Tabs and their content persist across sessions
- **Drag & Drop Reordering**: Reorganize tabs by dragging
- **Quick Tab Switching**: Use Cmd/Ctrl+1-9 to switch between tabs
- **Modified Indicator**: Blue dot shows unsaved changes

### Query Management
- **Save Queries**: Save frequently used queries locally with names and descriptions
- **Saved Queries Tree**: Browse saved queries in the sidebar
- **Search Queries**: Find saved queries by name or SQL content
- **Load Queries**: Open saved queries in new tabs with one click

### Dataset Explorer
- **Tree View Navigation**: Browse datasets and tables in a collapsible tree
- **Table Types**: Visual indicators for TABLE, VIEW, MATERIALIZED_VIEW, and EXTERNAL tables
- **Quick Actions**: Right-click context menu for table operations
- **Search**: Filter datasets and tables

### Schema Inspection
- **Schema Sidebar**: View detailed table schemas in a dedicated panel
- **Column Details**: See column names, types, and modes (NULLABLE, REQUIRED, REPEATED)
- **Table Metadata**: View row count, table size, and creation time
- **View Definitions**: Inspect SQL definitions for views

### Query Results
- **High-Performance Table**: Canvas-based rendering for large datasets
- **Pagination**: Navigate through results with 200 rows per page (up to 100,000 total)
- **Column Sorting**: Sort results by any column
- **Column Resizing**: Adjust column widths by dragging
- **Copy Values**: Right-click to copy cell values
- **Results Caching**: Fast page navigation with cached results

### Sample Data
- **Quick Preview**: View sample data from any table
- **One-Click Access**: Right-click table and select "View Sample Data"

### UI Customization
- **Resizable Panels**: Adjust sidebar and editor/results split
- **Collapsible Sidebar**: Maximize editor space when needed
- **Persistent Layout**: Window size, position, and panel sizes persist across sessions
- **Dark Theme**: Modern dark interface

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account with BigQuery API enabled
- GCP project with BigQuery access
- Service account key file (JSON) OR Application Default Credentials configured

### Installing Node.js and npm

npm (Node Package Manager) comes bundled with Node.js. To install both:

1. **Download Node.js**: Visit [nodejs.org](https://nodejs.org/) and download the LTS (Long Term Support) version for your operating system
2. **Install Node.js**: Run the installer and follow the installation wizard
3. **Verify installation**: Open a terminal and run:
   ```bash
   node --version
   npm --version
   ```
   Both commands should display version numbers (Node.js 18+ and npm 9+)

Alternatively, you can use a package manager:
- **macOS**: `brew install node` (using Homebrew)
- **Linux**: `sudo apt install nodejs npm` (Ubuntu/Debian) or use your distribution's package manager
- **Windows**: Use the official installer from nodejs.org or `winget install OpenJS.NodeJS.LTS`

### Setting Up Google Application Default Credentials

Application Default Credentials (ADC) allow QueryForge to use your local Google Cloud credentials without needing to manage service account key files. This is the recommended authentication method for local development.

#### Option 1: Using gcloud CLI (Recommended)

1. **Install Google Cloud SDK**:
   - **macOS**: `brew install google-cloud-sdk`
   - **Linux**: Follow instructions at [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
   - **Windows**: Download installer from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

2. **Authenticate with your Google account**:
   ```bash
   gcloud auth login
   ```
   This will open a browser window for you to sign in with your Google account.

3. **Set your default project** (optional but recommended):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Set up Application Default Credentials**:
   ```bash
   gcloud auth application-default login
   ```
   This command will:
   - Open a browser for authentication
   - Store credentials in a well-known location that QueryForge can automatically find

#### Option 2: Using Service Account Key File

If you prefer to use a service account key file, you can set it as Application Default Credentials:

1. **Download a service account key** from the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)

2. **Set the environment variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

   **macOS/Linux**: Add this to your `~/.zshrc` or `~/.bashrc` to make it persistent:
   ```bash
   echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"' >> ~/.zshrc
   source ~/.zshrc
   ```

   **Windows (PowerShell)**:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('GOOGLE_APPLICATION_CREDENTIALS', 'C:\path\to\your\service-account-key.json', 'User')
   ```

#### Verifying Your Setup

To verify that Application Default Credentials are configured correctly:

```bash
gcloud auth application-default print-access-token
```

If configured correctly, this will print an access token. If you see an error, follow the setup steps above.

**Note**: When using Application Default Credentials in QueryForge, select "Application Default Credentials" as the authentication method in the connection dialog. You only need to provide your GCP Project ID.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd QueryForge
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Development

For development with hot reload:
```bash
npm run dev
```

## Usage

### Connecting to BigQuery

1. Launch the application 
2. Click "Configure Connection" in the header
3. Enter your GCP Project ID
4. Select authentication method:
   - **Service Account Key**: Provide path to JSON key file or paste key content
   - **Application Default Credentials**: Uses your local gcloud credentials
5. Click "Connect"

### Executing Queries

1. Type your SQL query in the editor
2. Click "Execute" or press Cmd/Ctrl+Enter
3. View results in the table below
4. Use "Cancel" to stop a running query
5. Format your SQL with Cmd/Ctrl+Shift+F

### Browsing Datasets

1. Connect to BigQuery
2. Browse datasets in the left sidebar
3. Click a dataset to expand and view tables
4. Right-click a table for options:
   - **Open in new tab**: Generate a SELECT * query
   - **View Schema**: Open schema details in sidebar
   - **View Sample Data**: Preview table contents
   - **View Definition**: See SQL for views

### Managing Tabs

- Click "+" button to create a new tab
- Click on a tab to switch between queries
- Drag tabs to reorder them
- Click "×" on a tab to close it
- Modified tabs show a blue dot indicator
- Use Cmd/Ctrl+1-9 to quickly switch tabs

### Saving Queries

1. Write your query in the editor
2. Click "Save" button
3. Enter a name and optional description
4. Click "Save" to persist the query

### Loading Saved Queries

1. Switch to "SAVED QUERIES" view in the sidebar
2. Search or browse your saved queries
3. Click a query to load it in a new tab
4. Right-click for additional options

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New Tab | Cmd+T | Ctrl+T |
| Switch to Tab 1-9 | Cmd+1-9 | Ctrl+1-9 |
| Execute Query | Cmd+Enter | Ctrl+Enter |
| Format Query | Cmd+Shift+F | Ctrl+Shift+F |
| Show Help | Cmd+? | Ctrl+? |
| Quit | Cmd+Q | Alt+F4 |

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── ipc/        # IPC handlers
│   └── storage/    # Local storage
├── renderer/       # React renderer process
│   ├── components/ # UI components
│   ├── hooks/      # React hooks
│   └── stores/     # State management
└── shared/         # Shared types/utilities
```

## Building for Production

Build for your platform:
```bash
npm run package
```

Build for specific platforms:
```bash
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

## Donate

If you find QueryForge useful, please consider supporting its development:

![Donation QR Code](donation_qr.png)

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=3MKGEKEWEHWPS&no_recurring=0&item_name=Inspire+development+of+BigQuery+Desktop+app&currency_code=SEK)

## License

MIT
````

## File: src/renderer/components/QueryEditor/QueryEditor.css
````css
.query-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
}

.query-editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
  align-items: center;
  height: 35px;
  position: relative;
  z-index: 1; /* Lower z-index to allow tooltips to appear above */
}

.query-editor-toolbar button {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background-color: #0e639c;
  color: #ffffff;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.query-editor-toolbar button:hover {
  background-color: #1177bb;
}

.query-editor-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #3e3e42;
}

.query-editor-toolbar .run-button {
  background-color: #0e639c;
}

.query-editor-toolbar .run-button:hover {
  background-color: #1177bb;
}

.query-editor-toolbar .arrow-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.query-editor-toolbar .format-button {
  background-color: #3e3e42;
  color: #cccccc;
}

.query-editor-toolbar .format-button:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.query-editor-toolbar .expand-button {
  background-color: #3e3e42;
  color: #cccccc;
}

.query-editor-toolbar .expand-button:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.query-editor-toolbar .dbtify-button {
  background-color: #ff694a;
  color: #ffffff;
}

.query-editor-toolbar .dbtify-button:hover:not(:disabled) {
  background-color: #ff8566;
}

.query-editor-toolbar .save-button {
  background-color: #0e7c3c;
}

.query-editor-toolbar .save-button:hover {
  background-color: #0f8f45;
}

.query-editor-toolbar .cancel-button {
  background-color: #a1260d;
}

.query-editor-toolbar .cancel-button:hover {
  background-color: #c72e0f;
}

.connection-warning {
  color: #dcdcaa;
  background-color: #3e3e42;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8125rem;
  margin-left: auto;
  border: 1px solid #6a6a6a;
}

.error-message {
  background-color: #3a1d1d;
  color: #f48771;
  padding: 0.75rem;
  margin: 0.5rem;
  border-radius: 3px;
  border: 1px solid #6a1f1f;
}

.editor-container {
  flex: 1;
  border: none;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow: visible; /* Allow tooltips to overflow container */
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  padding-top: 8px; /* Add padding to prevent tooltips from being hidden under toolbar */
  overflow: visible; /* Allow tooltips to overflow */
}

/* Ensure Monaco editor tooltips/hovers render above toolbar */
.editor-wrapper .monaco-editor .monaco-hover {
  z-index: 1000 !important;
}

.editor-wrapper .monaco-editor .monaco-editor-hover {
  z-index: 1000 !important;
}

/* Alternative: target Monaco's overflow widget container */
.editor-wrapper .monaco-editor .monaco-editor-overlaymessage {
  z-index: 1000 !important;
}

/* Error indicator in glyph margin - red dot */
.monaco-editor .error-glyph-margin {
  background-color: #f48771 !important;
  width: 3px !important;
  margin-left: 1px;
}

.monaco-editor .error-glyph-margin::before {
  content: '●';
  color: #f48771;
  font-size: 14px;
  line-height: 19px;
  display: inline-block;
  width: 16px;
  text-align: center;
  position: absolute;
  left: 0;
}

.editor-status-bar {
  background-color: #252526;
  border-top: 1px solid #3e3e42;
  padding: 0.375rem 0.75rem;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #858585;
  flex-shrink: 0;
}

.editor-status-bar .status-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.editor-status-bar .status-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.editor-status-bar .status-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
  margin-top: 5px;
}

.editor-status-bar .status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.editor-status-bar .status-indicator-valid {
  background-color: #4ec9b0;
}

.editor-status-bar .status-indicator-invalid {
  background-color: #f48771;
}

.editor-status-bar .status-valid {
  color: #4ec9b0;
}

.editor-status-bar .status-invalid {
  color: #f48771;
}

.editor-status-bar .status-error-message {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.8em; /* Approximately 2 lines at line-height 1.4 */
  word-break: break-word;
  line-height: 1.4;
}

.no-tab-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #858585;
  background-color: #1e1e1e;
}

.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.save-dialog {
  background: #252526;
  border-radius: 4px;
  padding: 1.5rem;
  min-width: 400px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border: 1px solid #3e3e42;
  color: #cccccc;
}

.save-dialog h3 {
  margin: 0 0 1rem 0;
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 400;
}

.save-dialog .form-group {
  margin-bottom: 1rem;
}

.save-dialog .form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 400;
  color: #cccccc;
  font-size: 0.8125rem;
}

.save-dialog .form-group input,
.save-dialog .form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  font-size: 0.8125rem;
  background-color: #3c3c3c;
  color: #cccccc;
}

.save-dialog .form-group input:focus,
.save-dialog .form-group textarea:focus {
  outline: 1px solid #007acc;
  outline-offset: -1px;
}

.save-dialog .form-group textarea {
  font-family: inherit;
  resize: vertical;
}

.save-dialog .dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.save-dialog .dialog-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background-color 0.15s ease;
}

.save-dialog .dialog-actions button:first-child {
  background-color: #3e3e42;
  color: #cccccc;
}

.save-dialog .dialog-actions button:first-child:hover {
  background-color: #4a4a4a;
}

.save-dialog .dialog-actions button:last-child {
  background-color: #0e639c;
  color: #ffffff;
}

.save-dialog .dialog-actions button:last-child:hover {
  background-color: #1177bb;
}

.save-dialog .dialog-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
````

## File: src/renderer/components/QueryResults/CanvasTable.tsx
````typescript
import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { QueryResult, ColumnMetadata } from '../../../shared/types/query';
import { ColumnSortMenu } from './ColumnSortMenu';

interface CanvasTableProps {
  results: QueryResult;
  columnWidths: { [key: number]: number };
  onColumnResize: (columnIndex: number, width: number) => void;
  onRowContextMenu: (e: React.MouseEvent, rowIndex: number, isRowNumberColumn?: boolean) => void;
  onColumnContextMenu: (e: React.MouseEvent, columnIndex: number) => void;
  formatValue: (value: any, columnType?: string, columnName?: string) => string;
  currentPage: number;
  rowsPerPage: number;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | null;
  onSortColumn: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const ROW_NUMBER_COLUMN_WIDTH = 80;
const MIN_COLUMN_WIDTH = 50;
const CELL_PADDING = 8;
const RESIZE_HANDLE_WIDTH = 4;
const SORT_ARROW_WIDTH = 16;
const SORT_ARROW_HEIGHT = 16;

export const CanvasTable: React.FC<CanvasTableProps> = ({
  results,
  columnWidths,
  onColumnResize,
  onRowContextMenu,
  onColumnContextMenu,
  formatValue,
  currentPage,
  rowsPerPage,
  sortColumn,
  sortDirection,
  onSortColumn,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Text selection state
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number; x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number; x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionOverlayRef = useRef<HTMLDivElement>(null);
  
  // Sort menu state
  const [sortMenu, setSortMenu] = useState<{
    columnIndex: number;
    x: number;
    y: number;
  } | null>(null);

  // Results already contain only the current page rows (loaded from cache)
  // Calculate startIndex for row numbering
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = useMemo(() => {
    // Results.rows already contains only the current page, so use it directly
    return results.rows || [];
  }, [results.rows]);

  // Memory management: Limit cache size and clear when data changes significantly
  const formattedCellsRef = useRef<Map<string, string>>(new Map());
  const MAX_FORMATTED_CACHE_SIZE = 10000; // Limit to 10k cells to prevent memory issues
  
  // Pre-format all cell values to avoid expensive formatting during render
  // This is the key optimization - format values once when data changes, not on every render
  const formattedCells = useMemo(() => {
    const formatted = new Map<string, string>();
    paginatedRows.forEach((row, rowIdx) => {
      row.values.forEach((value, colIdx) => {
        const column = results.columns[colIdx];
        const key = `${rowIdx}-${colIdx}`;
        // Only format if within cache size limit
        if (formatted.size < MAX_FORMATTED_CACHE_SIZE) {
          formatted.set(key, formatValue(value, column?.type, column?.name));
        }
      });
    });
    // Update ref for cleanup tracking
    formattedCellsRef.current = formatted;
    return formatted;
  }, [paginatedRows, results.columns, formatValue]);
  
  // Clear caches when results change significantly (new jobId)
  useEffect(() => {
    formattedCellsRef.current.clear();
    textMeasurementCache.current.clear();
  }, [results.jobId]);

  // Helper to get formatted value (with fallback for safety)
  const getFormattedValue = useCallback((rowIdx: number, colIdx: number, value: any, columnType?: string): string => {
    const key = `${rowIdx}-${colIdx}`;
    const column = results.columns[colIdx];
    return formattedCells.get(key) ?? formatValue(value, columnType, column?.name);
  }, [formattedCells, formatValue, results.columns]);

  // Calculate column widths
  const getColumnWidth = useCallback(
    (columnIndex: number): number => {
      if (columnIndex === -1) {
        return columnWidths[-1] || ROW_NUMBER_COLUMN_WIDTH;
      }
      return columnWidths[columnIndex] || 150;
    },
    [columnWidths]
  );

  // Calculate total width - ensure it's at least as wide as viewport to enable scrolling
  const totalWidth = useMemo(() => {
    let width = getColumnWidth(-1);
    results.columns.forEach((_, idx) => {
      width += getColumnWidth(idx);
    });
    // Ensure minimum width to enable horizontal scrolling when content is wide
    return Math.max(width, 100);
  }, [results.columns, getColumnWidth]);

  const totalHeight = HEADER_HEIGHT + paginatedRows.length * ROW_HEIGHT;

  // Track container dimensions to determine if scrolling is needed
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions when it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setContainerDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Cache for text measurements to avoid repeated measureText calls
  const textMeasurementCache = useRef<Map<string, number>>(new Map());
  const measureTextContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Measure text width with caching
  const measureText = useCallback((text: string, ctx: CanvasRenderingContext2D): number => {
    // Update context ref if changed
    if (measureTextContextRef.current !== ctx) {
      measureTextContextRef.current = ctx;
      // Clear cache when context changes (e.g., font changes)
      textMeasurementCache.current.clear();
    }

    // Use cache key based on text content
    const cacheKey = text;
    if (textMeasurementCache.current.has(cacheKey)) {
      return textMeasurementCache.current.get(cacheKey)!;
    }

    const width = ctx.measureText(text).width;
    // Limit cache size to prevent memory issues (keep last 1000 measurements)
    if (textMeasurementCache.current.size > 1000) {
      const firstKey = textMeasurementCache.current.keys().next().value;
      if (firstKey !== undefined) {
        textMeasurementCache.current.delete(firstKey);
      }
    }
    textMeasurementCache.current.set(cacheKey, width);
    return width;
  }, []);

  // Convert viewport coordinates to cell position
  const getCellFromCoordinates = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      // Don't allow selection in header
      if (y < HEADER_HEIGHT) return null;
      
      const row = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
      if (row < 0 || row >= paginatedRows.length) return null;

      // Find column
      let currentX = 0;
      
      // Check row number column
      const rowNumWidth = getColumnWidth(-1);
      if (x >= currentX && x < currentX + rowNumWidth) {
        return { row, col: -1 };
      }
      currentX += rowNumWidth;

      // Check data columns
      for (let idx = 0; idx < results.columns.length; idx++) {
        const colWidth = getColumnWidth(idx);
        if (x >= currentX && x < currentX + colWidth) {
          return { row, col: idx };
        }
        currentX += colWidth;
      }

      return null;
    },
    [paginatedRows.length, getColumnWidth, results.columns]
  );

  // Draw cell text with ellipsis - optimized with binary search for truncation
  const drawCellText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      color: string = '#cccccc',
      align: 'left' | 'right' = 'left'
    ) => {
      ctx.fillStyle = color;
      ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const maxWidth = width - CELL_PADDING * 2;
      const ellipsis = '...';
      const ellipsisWidth = measureText(ellipsis, ctx);
      
      // Quick check - if text fits, draw it directly
      const textWidth = measureText(text, ctx);
      if (textWidth <= maxWidth) {
        // Calculate x position based on alignment
        const textX = align === 'right' 
          ? x + width - CELL_PADDING - textWidth 
          : x + CELL_PADDING;
        ctx.fillText(text, textX, y + ROW_HEIGHT / 2 + 4);
        return;
      }
      
      // Binary search for optimal truncation point (much faster than linear character-by-character)
      let left = 0;
      let right = text.length;
      let bestFit = 0;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const testText = text.substring(0, mid);
        const testWidth = measureText(testText, ctx);
        
        if (testWidth + ellipsisWidth <= maxWidth) {
          bestFit = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      const truncated = text.substring(0, bestFit);
      const truncatedWidth = measureText(truncated + ellipsis, ctx);
      // Calculate x position based on alignment for truncated text
      const truncatedX = align === 'right'
        ? x + width - CELL_PADDING - truncatedWidth
        : x + CELL_PADDING;
      ctx.fillText(truncated + ellipsis, truncatedX, y + ROW_HEIGHT / 2 + 4);
    },
    [measureText]
  );

  // Render the canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    // Get viewport size from the scrolling container (accounts for scrollbars)
    // Use clientWidth/clientHeight which excludes scrollbar width
    const containerWidth = Math.max(1, container.clientWidth);
    const containerHeight = Math.max(1, container.clientHeight);
    
    // Early return if dimensions are invalid
    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    // Always set canvas size to match viewport exactly
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = Math.ceil(containerWidth * dpr);
    const canvasHeight = Math.ceil(containerHeight * dpr);
    
    // Set canvas internal resolution and display size
    // Only update if size actually changed to avoid unnecessary redraws
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    // Update canvas overlay size to match canvas (excludes scrollbar area)
    const canvasOverlay = canvasOverlayRef.current;
    if (canvasOverlay) {
      canvasOverlay.style.width = `${containerWidth}px`;
      canvasOverlay.style.height = `${containerHeight}px`;
    }
    
    // Update selection overlay size to match container
    const selectionOverlay = selectionOverlayRef.current;
    if (selectionOverlay) {
      selectionOverlay.style.width = `${containerWidth}px`;
      selectionOverlay.style.height = `${containerHeight}px`;
    }
    
    // Reset transform and scale for high DPI
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Clear canvas and fill with background color
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Colors
    const bgColor = '#1e1e1e';
    const headerBgColor = '#1a1a1a';
    const borderColor = '#3e3e42';
    const textColor = '#cccccc';
    const headerTextColor = '#cccccc';
    const hoverColor = '#2a2d2e';
    const evenRowColor = '#252526';
    const oddRowColor = '#1e1e1e';

    // Calculate visible area - account for header height
    // Only rows that would be visible below the header should be considered
    // Add small buffer (2 rows) for smoother scrolling
    const scrollableAreaHeight = containerHeight - HEADER_HEIGHT;
    const bufferRows = 2;
    const visibleStartRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - bufferRows);
    const visibleEndRow = Math.min(
      visibleStartRow + Math.ceil(scrollableAreaHeight / ROW_HEIGHT) + bufferRows * 2,
      paginatedRows.length
    );

    // Calculate column positions (relative to scroll position)
    let currentX = 0;
    const columnPositions: { [key: number]: number } = {};
    
    // Row number column
    columnPositions[-1] = currentX - scrollLeft;
    currentX += getColumnWidth(-1);

    results.columns.forEach((_, idx) => {
      columnPositions[idx] = currentX - scrollLeft;
      currentX += getColumnWidth(idx);
    });

    // Draw rows first - ensure they never draw above the header
    for (let rowIdx = visibleStartRow; rowIdx < visibleEndRow; rowIdx++) {
      const row = paginatedRows[rowIdx];
      if (!row) continue;

      // Calculate row Y position relative to the canvas
      const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollTop;
      const actualRowNumber = startIndex + rowIdx + 1;
      
      // Skip rows that would be drawn above or overlapping the header
      if (rowY < HEADER_HEIGHT) continue;

      // Row background
      const isEven = rowIdx % 2 === 0;
      const isHovered = hoveredRow === rowIdx;
      ctx.fillStyle = isHovered ? hoverColor : isEven ? evenRowColor : oddRowColor;
      ctx.fillRect(0, rowY, containerWidth, ROW_HEIGHT);

      // Row number cell
      const rowNumX = columnPositions[-1];
      if (rowNumX + getColumnWidth(-1) > 0 && rowNumX < containerWidth) {
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(rowNumX + getColumnWidth(-1), rowY);
        ctx.lineTo(rowNumX + getColumnWidth(-1), rowY + ROW_HEIGHT);
        ctx.stroke();

        ctx.fillStyle = textColor;
        drawCellText(
          ctx,
          actualRowNumber.toLocaleString(),
          rowNumX,
          rowY,
          getColumnWidth(-1),
          textColor,
          'right' // Right-align row numbers
        );
      }

      // Data cells - draw all columns that are at least partially visible
      row.values.forEach((value, colIdx) => {
        const colX = columnPositions[colIdx];
        const colWidth = getColumnWidth(colIdx);

        // Column is visible if any part of it is in the viewport
        // Check if right edge is to the right of left edge of viewport AND
        // left edge is to the left of right edge of viewport
        if (colX + colWidth > 0 && colX < containerWidth) {
          // Calculate visible portion of column
          const visibleX = Math.max(0, colX);
          const visibleWidth = Math.min(colX + colWidth, containerWidth) - visibleX;
          
          // Draw vertical border on the right side of the cell
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(colX + colWidth, rowY);
          ctx.lineTo(colX + colWidth, rowY + ROW_HEIGHT);
          ctx.stroke();

          // Draw left border if column starts off-screen
          if (colX < 0 && colIdx === 0) {
            ctx.beginPath();
            ctx.moveTo(0, rowY);
            ctx.lineTo(0, rowY + ROW_HEIGHT);
            ctx.stroke();
          }

          // Draw cell content - use pre-formatted value
          const column = results.columns[colIdx];
          const formattedValue = getFormattedValue(rowIdx, colIdx, value, column?.type);
          ctx.fillStyle = textColor;
          // Check if column is INTEGER type for right alignment
          const columnType = (column?.type || '').toUpperCase();
          const isIntegerColumn = columnType === 'INTEGER' || columnType === 'INT' || columnType.includes('INT');
          const textAlign = isIntegerColumn ? 'right' : 'left';
          drawCellText(ctx, formattedValue, colX, rowY, colWidth, textColor, textAlign);
        }
      });

      // Draw bottom border
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(0, rowY + ROW_HEIGHT);
      ctx.lineTo(containerWidth, rowY + ROW_HEIGHT);
      ctx.stroke();
    }

    // Draw selection highlights
    if (selectionStart && selectionEnd) {
      const startRow = Math.min(selectionStart.row, selectionEnd.row);
      const endRow = Math.max(selectionStart.row, selectionEnd.row);
      const startCol = Math.min(selectionStart.col, selectionEnd.col);
      const endCol = Math.max(selectionStart.col, selectionEnd.col);

      // Only draw selection for visible rows
      const visibleStart = Math.max(startRow, visibleStartRow);
      const visibleEnd = Math.min(endRow + 1, visibleEndRow);

      for (let rowIdx = visibleStart; rowIdx < visibleEnd; rowIdx++) {
        const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollTop;
        if (rowY < HEADER_HEIGHT) continue;

        // Draw selection for each selected column in this row
        for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
          const colX = columnPositions[colIdx];
          const colWidth = getColumnWidth(colIdx);

          // Only draw if column is visible
          if (colX + colWidth > 0 && colX < containerWidth) {
            ctx.fillStyle = 'rgba(0, 122, 204, 0.3)';
            ctx.fillRect(colX, rowY, colWidth, ROW_HEIGHT);
          }
        }
      }
    }

    // Draw header last so it's always on top (fixed position)
    // Draw header background
    ctx.fillStyle = headerBgColor;
    ctx.fillRect(0, 0, containerWidth, HEADER_HEIGHT);

    // Draw header border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(containerWidth, HEADER_HEIGHT);
    ctx.stroke();

    // Draw header cells
    ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = headerTextColor;

    // Row number header
    const rowNumX = columnPositions[-1];
    const rowNumWidth = getColumnWidth(-1);
    // Check if column is visible (any part of it is in viewport)
    if (rowNumX + rowNumWidth > 0 && rowNumX < containerWidth) {
      ctx.fillStyle = headerTextColor;
      ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      // Draw header text at correct vertical position, right-aligned
      const rowHeaderText = 'Row';
      const rowHeaderTextWidth = measureText(rowHeaderText, ctx);
      ctx.fillText(rowHeaderText, rowNumX + getColumnWidth(-1) - CELL_PADDING - rowHeaderTextWidth, HEADER_HEIGHT / 2 + 4);
      
      // Draw resize handle
      if (resizingColumn === -1 || hoveredColumn === -1) {
        ctx.fillStyle = resizingColumn === -1 ? '#007acc' : '#007acc80';
        ctx.fillRect(
          rowNumX + rowNumWidth - RESIZE_HANDLE_WIDTH / 2,
          0,
          RESIZE_HANDLE_WIDTH,
          HEADER_HEIGHT
        );
      }
    }

    // Column headers - draw all columns that are at least partially visible
    results.columns.forEach((col, idx) => {
      const colX = columnPositions[idx];
      const colWidth = getColumnWidth(idx);

      // Column is visible if any part of it is in the viewport
      // Check if right edge is to the right of left edge of viewport AND
      // left edge is to the left of right edge of viewport
      if (colX + colWidth > 0 && colX < containerWidth) {
        // Calculate visible portion of column
        const visibleX = Math.max(0, colX);
        const visibleWidth = Math.min(colX + colWidth, containerWidth) - visibleX;
        
        // Draw vertical border on the right side of the header
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX + colWidth, 0);
        ctx.lineTo(colX + colWidth, HEADER_HEIGHT);
        ctx.stroke();

        // Draw left border if column starts off-screen
        if (colX < 0) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, HEADER_HEIGHT);
          ctx.stroke();
        }

        ctx.fillStyle = headerTextColor;
        ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        // Column headers are always left-aligned regardless of data type
        const headerTextY = HEADER_HEIGHT / 2 + 4; // Same vertical position as row header
        
        // Draw header text directly with proper alignment and truncation
        // Reserve space for dropdown arrow
        const dropdownArrowSpace = SORT_ARROW_WIDTH + 4; // Arrow width + spacing
        const textWidth = measureText(col.name, ctx);
        const maxWidth = colWidth - CELL_PADDING * 2 - dropdownArrowSpace;
        
        if (textWidth <= maxWidth) {
          // Text fits - always left-aligned
          const textX = colX + CELL_PADDING;
          ctx.fillText(col.name, textX, headerTextY);
        } else {
          // Truncate with ellipsis
          const ellipsis = '...';
          const ellipsisWidth = measureText(ellipsis, ctx);
          let truncated = col.name;
          let truncatedWidth = textWidth;
          
          while (truncatedWidth + ellipsisWidth > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
            truncatedWidth = measureText(truncated, ctx);
          }
          
          const finalWidth = truncatedWidth + ellipsisWidth;
          // Always left-aligned
          const textX = colX + CELL_PADDING;
          ctx.fillText(truncated + ellipsis, textX, headerTextY);
        }
        
        // Draw dropdown arrow indicator (always visible)
        ctx.fillStyle = sortColumn === idx ? '#007acc' : '#858585';
        ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const dropdownIcon = sortColumn === idx 
          ? (sortDirection === 'asc' ? '↑' : '↓')
          : '▼';
        const dropdownIconX = colX + colWidth - CELL_PADDING - SORT_ARROW_WIDTH / 2;
        ctx.fillText(dropdownIcon, dropdownIconX, headerTextY);

        // Draw resize handle
        if (resizingColumn === idx || hoveredColumn === idx) {
          ctx.fillStyle = resizingColumn === idx ? '#007acc' : '#007acc80';
          const handleX = Math.max(0, colX + colWidth - RESIZE_HANDLE_WIDTH / 2);
          ctx.fillRect(
            handleX,
            0,
            RESIZE_HANDLE_WIDTH,
            HEADER_HEIGHT
          );
        }
      }
    });
  }, [
    paginatedRows,
    results.columns,
    scrollTop,
    scrollLeft,
    hoveredRow,
    hoveredColumn,
    resizingColumn,
    getColumnWidth,
    getFormattedValue,
    startIndex,
    drawCellText,
    selectionStart,
    selectionEnd,
  ]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
    // Close sort menu when scrolling (position would be incorrect)
    setSortMenu(null);
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      // Check if over header
      if (y >= 0 && y < HEADER_HEIGHT) {
        // Check which column
        let currentX = 0;
        let foundColumn: number | null = null;

        // Check row number column
        const rowNumWidth = getColumnWidth(-1);
        if (x >= currentX && x < currentX + rowNumWidth) {
          foundColumn = -1;
        }
        currentX += rowNumWidth;

        // Check data columns
        if (foundColumn === null) {
          results.columns.forEach((_, idx) => {
            const colWidth = getColumnWidth(idx);
            if (x >= currentX && x < currentX + colWidth) {
              foundColumn = idx;
            }
            currentX += colWidth;
          });
        }

        setHoveredColumn(foundColumn);
        setHoveredRow(null);

        // Update cursor for resize or sort
        if (foundColumn !== null) {
          let colX = 0;
          if (foundColumn === -1) {
            colX = 0;
          } else {
            colX = getColumnWidth(-1);
            for (let i = 0; i < foundColumn; i++) {
              colX += getColumnWidth(i);
            }
          }
          const colWidth = getColumnWidth(foundColumn);
          const handleX = colX + colWidth - RESIZE_HANDLE_WIDTH / 2;
          
          if (x >= handleX - 5 && x <= handleX + 5) {
            container.style.cursor = 'col-resize';
          } else if (foundColumn !== -1) {
            // Show pointer cursor for data column headers (to indicate sortable)
            container.style.cursor = 'pointer';
          } else {
            container.style.cursor = 'default';
          }
        } else {
          container.style.cursor = 'default';
        }
      } else if (y >= HEADER_HEIGHT) {
        // Check which row
        const rowIndex = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
        if (rowIndex >= 0 && rowIndex < paginatedRows.length) {
          setHoveredRow(rowIndex);
        } else {
          setHoveredRow(null);
        }
        setHoveredColumn(null);
        container.style.cursor = 'default';
      }
    },
    [scrollTop, scrollLeft, getColumnWidth, results.columns, paginatedRows.length]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredRow(null);
    setHoveredColumn(null);
    const container = containerRef.current;
    if (container) {
      container.style.cursor = 'default';
    }
  }, []);

  // Handle mouse down for resizing and selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't handle right-click (context menu) - let handleContextMenu deal with it
      if (e.button === 2) return;
      
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      // Handle selection in data area (not header)
      if (y >= HEADER_HEIGHT) {
        // Check if this is a data cell click (not a scrollbar click)
        const cell = getCellFromCoordinates(x, y);
        if (cell) {
          setIsSelecting(true);
          const cellPos = { ...cell, x, y };
          setSelectionStart(cellPos);
          setSelectionEnd(cellPos);
          // Don't prevent default - allow normal behavior
          return;
        } else {
          // Click outside cells - clear selection
          setSelectionStart(null);
          setSelectionEnd(null);
          return;
        }
      }

      // Handle sort menu click in header (but not on resize handle)
      if (y >= 0 && y < HEADER_HEIGHT) {
        let currentX = 0;
        let foundColumn: number | null = null;

        // Check row number column
        const rowNumWidth = getColumnWidth(-1);
        if (x >= currentX && x < currentX + rowNumWidth) {
          // Row number column doesn't have sort menu
          return;
        }
        currentX += rowNumWidth;

        // Check data columns
        results.columns.forEach((_, idx) => {
          const colWidth = getColumnWidth(idx);
          if (x >= currentX && x < currentX + colWidth) {
            // Check if click is on resize handle
            const handleX = currentX + colWidth - RESIZE_HANDLE_WIDTH / 2;
            if (x < handleX - 5 || x > handleX + 5) {
              // Not on resize handle - show sort menu for any click on header
              foundColumn = idx;
            }
          }
          currentX += colWidth;
        });

        if (foundColumn !== null) {
          e.preventDefault();
          e.stopPropagation();
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            // Calculate position for sort menu
            // colX is in scroll coordinates, need to convert to viewport coordinates
            let colX = getColumnWidth(-1);
            for (let i = 0; i < foundColumn; i++) {
              colX += getColumnWidth(i);
            }
            const colWidth = getColumnWidth(foundColumn);
            // Convert scroll coordinates to viewport coordinates
            const viewportColX = colX - scrollLeft;
            const menuX = rect.left + viewportColX + colWidth - CELL_PADDING - SORT_ARROW_WIDTH;
            const menuY = rect.top + HEADER_HEIGHT + 2;
            setSortMenu({
              columnIndex: foundColumn,
              x: menuX,
              y: menuY,
            });
          }
          return;
        }
      }

      // Only handle resize in header

      // Check which column
      let currentX = 0;
      let foundColumn: number | null = null;

      // Check row number column
      const rowNumWidth = getColumnWidth(-1);
      if (x >= currentX && x < currentX + rowNumWidth) {
        const handleX = currentX + rowNumWidth - RESIZE_HANDLE_WIDTH / 2;
        if (x >= handleX - 5 && x <= handleX + 5) {
          foundColumn = -1;
        }
      }
      currentX += rowNumWidth;

      // Check data columns
      if (foundColumn === null) {
        results.columns.forEach((_, idx) => {
          const colWidth = getColumnWidth(idx);
          const handleX = currentX + colWidth - RESIZE_HANDLE_WIDTH / 2;
          if (x >= handleX - 5 && x <= handleX + 5) {
            foundColumn = idx;
          }
          currentX += colWidth;
        });
      }

      if (foundColumn !== null) {
        e.preventDefault();
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = getColumnWidth(foundColumn);
        setResizingColumn(foundColumn);
        // Clear selection when starting resize
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsSelecting(false);
      } else {
        // Click on header but not on resize handle - clear selection
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsSelecting(false);
      }
    },
    [scrollLeft, getColumnWidth, results.columns, getCellFromCoordinates]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      if (y >= 0 && y < HEADER_HEIGHT) {
        // Header context menu
        let currentX = 0;
        let foundColumn: number | null = null;

        const rowNumWidth = getColumnWidth(-1);
        if (x >= currentX && x < currentX + rowNumWidth) {
          // Row number column doesn't have context menu
          return;
        }
        currentX += rowNumWidth;

        results.columns.forEach((_, idx) => {
          const colWidth = getColumnWidth(idx);
          if (x >= currentX && x < currentX + colWidth) {
            foundColumn = idx;
          }
          currentX += colWidth;
        });

        if (foundColumn !== null) {
          onColumnContextMenu(e, foundColumn);
        }
      } else if (y >= HEADER_HEIGHT) {
        // Row context menu
        const rowIndex = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
        if (rowIndex >= 0 && rowIndex < paginatedRows.length) {
          // Check if click is on the row number column
          const rowNumWidth = getColumnWidth(-1);
          const isRowNumberColumn = x >= 0 && x < rowNumWidth;
          onRowContextMenu(e, rowIndex, isRowNumberColumn);
        }
      }
    },
    [scrollTop, scrollLeft, getColumnWidth, results.columns, paginatedRows.length, onRowContextMenu, onColumnContextMenu]
  );

  // Extract selected text
  const getSelectedText = useCallback((): string => {
    if (!selectionStart || !selectionEnd) return '';

    const startRow = Math.min(selectionStart.row, selectionEnd.row);
    const endRow = Math.max(selectionStart.row, selectionEnd.row);
    const startCol = Math.min(selectionStart.col, selectionEnd.col);
    const endCol = Math.max(selectionStart.col, selectionEnd.col);

    const selectedCells: string[] = [];

    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
      const row = paginatedRows[rowIdx];
      if (!row) continue;

      const rowValues: string[] = [];
      for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
        if (colIdx === -1) {
          // Row number
          const actualRowNumber = startIndex + rowIdx + 1;
          rowValues.push(actualRowNumber.toLocaleString());
        } else {
          const value = row.values[colIdx];
          const formattedValue = getFormattedValue(rowIdx, colIdx, value, results.columns[colIdx]?.type);
          rowValues.push(formattedValue);
        }
      }
      selectedCells.push(rowValues.join('\t'));
    }

    return selectedCells.join('\n');
  }, [selectionStart, selectionEnd, paginatedRows, results.columns, formatValue, startIndex]);

  // Handle copy to clipboard
  useEffect(() => {
    const handleCopy = (e: KeyboardEvent) => {
      // Check for Ctrl+C (Windows/Linux) or Cmd+C (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectionStart && selectionEnd) {
          // Check if user is trying to copy from an input field or Monaco editor
          const target = e.target as HTMLElement;
          const isInputField = 
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable ||
            // Check if Monaco editor is focused (Monaco editor uses a textarea internally)
            target.closest('.monaco-editor') !== null ||
            target.closest('.editor-container') !== null;
          
          // Only handle copy from canvas if not copying from an input/editor
          if (!isInputField) {
            const text = getSelectedText();
            if (text) {
              e.preventDefault();
              navigator.clipboard.writeText(text).catch((err) => {
                console.error('Failed to copy to clipboard:', err);
              });
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleCopy);
    return () => window.removeEventListener('keydown', handleCopy);
  }, [selectionStart, selectionEnd, getSelectedText]);


  // Handle selection mouse move
  const handleSelectionMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting || resizingColumn !== null) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const x = viewportX + scrollLeft;
      const y = viewportY + scrollTop;

      // Allow scrolling when near edges (but don't prevent default to allow native scrolling)
      const edgeThreshold = 20;
      const isNearTop = viewportY < edgeThreshold;
      const isNearBottom = viewportY > rect.height - edgeThreshold;
      const isNearLeft = viewportX < edgeThreshold;
      const isNearRight = viewportX > rect.width - edgeThreshold;

      // Update selection if we can determine a cell
      const cell = getCellFromCoordinates(x, y);
      if (cell && selectionStart) {
        setSelectionEnd({ ...cell, x, y });
      } else if (selectionStart) {
        // If outside cells but still selecting, extend selection to edge
        // This allows selection to continue when dragging outside viewport
        const lastCell = selectionEnd || selectionStart;
        setSelectionEnd(lastCell);
      }
    },
    [isSelecting, resizingColumn, scrollLeft, scrollTop, getCellFromCoordinates, selectionStart, selectionEnd]
  );

  // Handle selection mouse up
  const handleSelectionMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Handle mouse up at document level to ensure selection ends even if mouse leaves component
  useEffect(() => {
    if (!isSelecting) return;

    const handleDocumentMouseUp = () => {
      setIsSelecting(false);
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, [isSelecting]);

  // Handle selection mouse leave
  const handleSelectionMouseLeave = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Handle resize mouse move
  useEffect(() => {
    if (resizingColumn === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const diff = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, resizeStartWidthRef.current + diff);
      onColumnResize(resizingColumn, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, onColumnResize]);

  // Initial render when component mounts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      render();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Render on changes (including scroll) with throttling to reduce CPU usage
  const renderTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    // Clear any pending render
    if (renderTimeoutRef.current !== null) {
      cancelAnimationFrame(renderTimeoutRef.current);
    }

    // Throttle renders during scrolling - use requestAnimationFrame for smooth updates
    // but batch rapid scroll events
    renderTimeoutRef.current = requestAnimationFrame(() => {
      render();
      renderTimeoutRef.current = null;
    });

    return () => {
      if (renderTimeoutRef.current !== null) {
        cancelAnimationFrame(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, [render, scrollTop, scrollLeft]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      render();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable container - this handles all scrolling */}
      {/* Ensure scrollbars are always visible when content overflows */}
      <div
        ref={containerRef}
        className="canvas-table-container"
        onScroll={handleScroll}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'scroll',
          overflowY: 'scroll',
          position: 'relative',
          // Ensure scrollbars are always visible
          scrollbarWidth: 'thin',
          scrollbarColor: '#424242 #1e1e1e',
          // Force scrollbars to be visible (especially on macOS)
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Spacer div to create scrollable area - this scrolls */}
        <div
          style={{
            width: totalWidth,
            height: totalHeight,
            position: 'relative',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* Canvas overlay - positioned fixed to outer container, does NOT scroll */}
      {/* pointerEvents: 'none' allows scrolling and scrollbar interaction to work through it */}
      {/* Size matches container.clientWidth/Height to exclude scrollbar area */}
      <div
        ref={canvasOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {/* Selection overlay - captures mouse events for text selection */}
      {/* Only active when actively selecting to allow scrolling otherwise */}
      {/* Positioned to match canvas overlay (excludes scrollbar area) */}
      <div
        ref={selectionOverlayRef}
        onMouseMove={handleSelectionMouseMove}
        onMouseUp={handleSelectionMouseUp}
        onMouseLeave={handleSelectionMouseLeave}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: resizingColumn !== null || !isSelecting ? 'none' : 'auto',
          cursor: isSelecting ? 'text' : 'default',
          userSelect: 'none',
        }}
      />
      {/* Sort menu */}
      {sortMenu && (
        <ColumnSortMenu
          x={sortMenu.x}
          y={sortMenu.y}
          columnIndex={sortMenu.columnIndex}
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onClose={() => setSortMenu(null)}
          onSort={onSortColumn}
        />
      )}
    </div>
  );
};
````

## File: src/renderer/App.tsx
````typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectionStore } from './stores/connection-store';
import { useTabsStore, initializeTabsStore } from './stores/tabs-store';
import { ConnectionDialog } from './components/ConnectionDialog/ConnectionDialog';
import { SavedQueries } from './components/SavedQueries/SavedQueries';
import { HelpDialog } from './components/HelpDialog/HelpDialog';
import { AboutDialog } from './components/AboutDialog/AboutDialog';
import { TabBar } from './components/TabBar/TabBar';
import { QueryEditor } from './components/QueryEditor/QueryEditor';
import { QueryResults } from './components/QueryResults/QueryResults';
import { DatasetTree } from './components/DatasetTree/DatasetTree';
import { SavedQueriesTree } from './components/SavedQueriesTree/SavedQueriesTree';
import { SchemaSidebar } from './components/SchemaSidebar/SchemaSidebar';
import { SidebarSwitcher, type SidebarView } from './components/SidebarSwitcher/SidebarSwitcher';
import { SidebarHeader } from './components/SidebarHeader/SidebarHeader';
import './App.css';

const App: React.FC = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [editorHeight, setEditorHeight] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingLeftSidebar, setIsResizingLeftSidebar] = useState(false);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(268);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const savedLeftSidebarWidthRef = useRef(268); // Store the width before collapse
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(350);
  const resizeStartXLeftRef = useRef(0);
  const resizeStartWidthLeftRef = useRef(250);
  const resizeStartXRightRef = useRef(0);
  const resizeStartWidthRightRef = useRef(300);
  const editorResultsRef = useRef<HTMLDivElement>(null);
  const connection = useConnectionStore((state) => state.connection);
  const { tabs, setActiveTab, activeTabId } = useTabsStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const sidebarRefreshFnRef = useRef<(() => void) | null>(null);
  const [sidebarIsLoading, setSidebarIsLoading] = useState(false);

  // Reset refresh function when switching views
  useEffect(() => {
    sidebarRefreshFnRef.current = null;
    setSidebarIsLoading(false);
  }, [sidebarView]);

  // Stable callback that invokes the current refresh function
  const handleSidebarRefresh = useCallback(() => {
    if (sidebarRefreshFnRef.current) {
      sidebarRefreshFnRef.current();
    }
  }, []);
  const [schemaSidebar, setSchemaSidebar] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);

  useEffect(() => {
    // Load saved sidebar widths on mount
    if (window.electronAPI) {
      window.electronAPI.uiSettings.getLeftSidebarWidth().then((width) => {
        // Ensure minimum width of 268px
        const validWidth = Math.max(268, width);
        setLeftSidebarWidth(validWidth);
        resizeStartWidthLeftRef.current = validWidth;
        savedLeftSidebarWidthRef.current = validWidth;
      });
      window.electronAPI.uiSettings.getRightSidebarWidth().then((width) => {
        setRightSidebarWidth(width);
        resizeStartWidthRightRef.current = width;
      });
    }
  }, []);

  // Handle sidebar collapse/expand
  const handleLeftSidebarToggle = useCallback(() => {
    if (leftSidebarCollapsed) {
      // Expanding - restore saved width, ensuring minimum of 268px
      setLeftSidebarCollapsed(false);
      const restoredWidth = Math.max(268, savedLeftSidebarWidthRef.current);
      setLeftSidebarWidth(restoredWidth);
      savedLeftSidebarWidthRef.current = restoredWidth;
    } else {
      // Collapsing - save current width and set to 0
      savedLeftSidebarWidthRef.current = Math.max(268, leftSidebarWidth);
      setLeftSidebarCollapsed(true);
      setLeftSidebarWidth(0);
    }
  }, [leftSidebarCollapsed, leftSidebarWidth]);

  const handleShowSchema = useCallback((projectId: string, datasetId: string, tableId: string) => {
    setSchemaSidebar({ projectId, datasetId, tableId });
  }, []);

  useEffect(() => {
    // Initialize tabs store (load saved tabs)
    initializeTabsStore();
  }, []);

  useEffect(() => {
    // Try to restore saved connection on mount
    if (window.electronAPI) {
      // First check if there's an active connection
      window.electronAPI.connection.getActive().then((activeConnection) => {
        if (activeConnection) {
          useConnectionStore.getState().setConnection(activeConnection);
        } else {
          // Try to restore saved connection
          window.electronAPI.connection.restore().then((restoredConnection) => {
            if (restoredConnection) {
              useConnectionStore.getState().setConnection(restoredConnection);
            } else {
              // No saved connection, show dialog
              setShowConnectionDialog(true);
            }
          }).catch((error) => {
            // Failed to restore (e.g., invalid credentials), show dialog
            console.error('Failed to restore saved connection:', error);
            setShowConnectionDialog(true);
          });
        }
      });
    } else {
      setShowConnectionDialog(true);
    }
  }, []);

  useEffect(() => {
    // Listen for menu events
    if (window.electronAPI?.menu) {
      const removeHelpListener = window.electronAPI.menu.onShowHelp(() => {
        setShowHelpDialog(true);
      });
      const removeAboutListener = window.electronAPI.menu.onShowAbout(() => {
        setShowAboutDialog(true);
      });
      const removeNewTabListener = window.electronAPI.menu.onNewTab(() => {
        useTabsStore.getState().createTab();
      });

      return () => {
        removeHelpListener();
        removeAboutListener();
        removeNewTabListener();
      };
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = editorHeight;
  }, [editorHeight]);

  const handleLeftSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeftSidebar(true);
    resizeStartXLeftRef.current = e.clientX;
    resizeStartWidthLeftRef.current = leftSidebarWidth;
  }, [leftSidebarWidth]);

  const handleRightSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRightSidebar(true);
    resizeStartXRightRef.current = e.clientX;
    resizeStartWidthRightRef.current = rightSidebarWidth;
  }, [rightSidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStartYRef.current;
      const newHeight = Math.max(200, Math.min(800, resizeStartHeightRef.current + diff)); // Min 200px, max 800px
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizingLeftSidebar) return;

    let currentWidth = resizeStartWidthLeftRef.current;
    let rafId: number | null = null;
    let pendingWidth: number | null = null;

    const updateWidth = () => {
      if (pendingWidth !== null) {
        setLeftSidebarWidth(pendingWidth);
        pendingWidth = null;
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartXLeftRef.current;
      const newWidth = Math.max(268, Math.min(600, resizeStartWidthLeftRef.current + diff)); // Min 268px, max 600px
      currentWidth = newWidth;
      pendingWidth = newWidth;
      
      // Throttle updates using requestAnimationFrame
      if (rafId === null) {
        rafId = requestAnimationFrame(updateWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeftSidebar(false);
      // Ensure final width is set
      if (pendingWidth !== null) {
        setLeftSidebarWidth(pendingWidth);
      } else {
        setLeftSidebarWidth(currentWidth);
      }
      // Save the final width
      if (window.electronAPI) {
        window.electronAPI.uiSettings.setLeftSidebarWidth(currentWidth);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isResizingLeftSidebar]);

  useEffect(() => {
    if (!isResizingRightSidebar) return;

    let currentWidth = resizeStartWidthRightRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = resizeStartXRightRef.current - e.clientX; // Inverted because we're resizing from the right
      currentWidth = Math.max(150, Math.min(600, resizeStartWidthRightRef.current + diff)); // Min 150px, max 600px
      setRightSidebarWidth(currentWidth);
    };

    const handleMouseUp = () => {
      setIsResizingRightSidebar(false);
      // Save the final width
      if (window.electronAPI) {
        window.electronAPI.uiSettings.setRightSidebarWidth(currentWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingRightSidebar]);

  useEffect(() => {
    // Handle keyboard shortcuts for tab navigation (CMD/CTRL + 1-9)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if CMD (Mac) or CTRL (Windows/Linux) is pressed
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      // Check if the key is a number between 1-9
      const keyCode = e.key;
      const numberMatch = keyCode.match(/^[1-9]$/);
      
      if (isModifierPressed && numberMatch) {
        // Don't trigger if user is typing in an input field
        const target = e.target as HTMLElement;
        const isInputField = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
        
        if (isInputField) {
          return;
        }
        
        // Prevent default browser behavior (e.g., browser tab switching)
        e.preventDefault();
        
        // Convert key to index (1-9 -> 0-8)
        const tabIndex = parseInt(keyCode, 10) - 1;
        
        // Only switch to query tabs (filter out Explorer/Saved Queries)
        const queryTabs = tabs.filter(tab => tab.type === 'query');
        if (tabIndex >= 0 && tabIndex < queryTabs.length) {
          setActiveTab(queryTabs[tabIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabs, setActiveTab]);

  return (
    <div className="app">
      <header className="app-header">
        <h1></h1>
        <div className="header-actions">
          {connection && (
            <div className="connection-status">
              <span className="status-indicator connected"></span>
              <span>{connection.projectId}</span>
            </div>
          )}
          <button onClick={() => setShowSavedQueries(true)}>Saved Queries</button>
          <button onClick={() => setShowConnectionDialog(true)}>Configure Connection</button>
        </div>
      </header>
      <main className="app-main">
        <TabBar />
        <div className="app-content">
          <div style={{ width: leftSidebarCollapsed ? '30px' : `${leftSidebarWidth}px`, flexShrink: 0, minWidth: 0, transition: isResizingLeftSidebar ? 'none' : 'width 0.2s ease', display: 'flex', flexDirection: 'column' }}>
            <SidebarHeader
              collapsed={leftSidebarCollapsed}
              onToggleCollapse={handleLeftSidebarToggle}
              onRefresh={sidebarRefreshFnRef.current ? handleSidebarRefresh : undefined}
              isLoading={sidebarIsLoading}
            />
            <SidebarSwitcher
              currentView={sidebarView}
              onViewChange={setSidebarView}
              collapsed={leftSidebarCollapsed}
            />
            {sidebarView === 'saved-queries' ? (
              <SavedQueriesTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onRefreshReady={(refreshFn, isLoading) => {
                  sidebarRefreshFnRef.current = refreshFn;
                  setSidebarIsLoading(isLoading);
                }}
              />
            ) : (
              <DatasetTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onShowSchema={handleShowSchema}
                onRefreshReady={(refreshFn, isLoading) => {
                  sidebarRefreshFnRef.current = refreshFn;
                  setSidebarIsLoading(isLoading);
                }}
              />
            )}
          </div>
          {!leftSidebarCollapsed && (
            <div
              className="resize-handle-vertical"
              onMouseDown={handleLeftSidebarResizeStart}
            />
          )}
          <div className="app-editor-results" ref={editorResultsRef}>
            <div className="query-section" style={{ height: `${editorHeight}px` }}>
              <QueryEditor />
            </div>
            <div
              className="resize-handle-horizontal"
              onMouseDown={handleResizeStart}
            />
            <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
              <QueryResults />
            </div>
          </div>
          {schemaSidebar && (
            <>
              <div
                className="resize-handle-vertical"
                onMouseDown={handleRightSidebarResizeStart}
              />
              <div style={{ width: `${rightSidebarWidth}px`, flexShrink: 0, minWidth: 0 }}>
                <SchemaSidebar
                  projectId={schemaSidebar.projectId}
                  datasetId={schemaSidebar.datasetId}
                  tableId={schemaSidebar.tableId}
                  onClose={() => setSchemaSidebar(null)}
                />
              </div>
            </>
          )}
        </div>
      </main>
      {showConnectionDialog && (
        <ConnectionDialog onClose={() => setShowConnectionDialog(false)} />
      )}
      {showSavedQueries && (
        <SavedQueries onClose={() => setShowSavedQueries(false)} />
      )}
      {showHelpDialog && (
        <HelpDialog onClose={() => setShowHelpDialog(false)} />
      )}
      {showAboutDialog && (
        <AboutDialog onClose={() => setShowAboutDialog(false)} />
      )}
    </div>
  );
};

export default App;
````

## File: package.json
````json
{
  "name": "query-forge",
  "version": "1.0.5",
  "description": "QueryForge - Desktop application for browsing Google Cloud Platform BigQuery",
  "main": "dist/main/main.js",
  "scripts": {
    "build": "tsc && webpack --config webpack.renderer.config.js --mode production",
    "build:main": "tsc",
    "build:renderer": "webpack --config webpack.renderer.config.js",
    "build:icon": "node -e \"if (process.platform === 'darwin') { require('child_process').execSync('mkdir -p build/icon.iconset && sips -z 16 16 queryforge_icon.png --out build/icon.iconset/icon_16x16.png && sips -z 32 32 queryforge_icon.png --out build/icon.iconset/icon_16x16@2x.png && sips -z 32 32 queryforge_icon.png --out build/icon.iconset/icon_32x32.png && sips -z 64 64 queryforge_icon.png --out build/icon.iconset/icon_32x32@2x.png && sips -z 128 128 queryforge_icon.png --out build/icon.iconset/icon_128x128.png && sips -z 256 256 queryforge_icon.png --out build/icon.iconset/icon_128x128@2x.png && sips -z 256 256 queryforge_icon.png --out build/icon.iconset/icon_256x256.png && sips -z 512 512 queryforge_icon.png --out build/icon.iconset/icon_256x256@2x.png && sips -z 512 512 queryforge_icon.png --out build/icon.iconset/icon_512x512.png && sips -z 1024 1024 queryforge_icon.png --out build/icon.iconset/icon_512x512@2x.png && iconutil -c icns build/icon.iconset -o build/icon.icns', {stdio: 'inherit', shell: true}) }\"",
    "start": "npm run build && electron .",
    "dev": "npm run build:main && concurrently \"webpack --config webpack.renderer.config.js --mode development --watch\" \"electron .\"",
    "package": "npm run build && npm run build:icon && electron-builder",
    "package:mac": "npm run build && npm run build:icon && electron-builder --mac",
    "package:win": "npm run build && electron-builder --win",
    "package:linux": "npm run build && electron-builder --linux",
    "run:packaged": "node -e \"const {execSync} = require('child_process'); const path = require('path'); if (process.platform === 'darwin') { execSync('open dist/mac-arm64/QueryForge.app', {stdio: 'inherit'}); } else if (process.platform === 'win32') { execSync('start dist\\\\win-unpacked\\\\QueryForge.exe', {stdio: 'inherit'}); } else { execSync('dist/linux-unpacked/query-forge', {stdio: 'inherit'}); }\"",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "test": "jest",
    "prepare": "husky"
  },
  "keywords": [
    "bigquery",
    "gcp",
    "electron",
    "desktop"
  ],
  "author": "",
  "license": "MIT",
  "overrides": {
    "inflight": "npm:inflight-lru@^1.0.0"
  },
  "dependencies": {
    "@google-cloud/bigquery": "^7.0.0",
    "@monaco-editor/react": "^4.6.0",
    "electron-store": "^10.0.0",
    "node-sql-parser": "^5.3.13",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-window": "^1.8.10",
    "sql-formatter": "^15.6.10",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/webpack-env": "^1.18.8",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "chokidar-cli": "^3.0.0",
    "concurrently": "^8.2.2",
    "css-loader": "^7.1.2",
    "electron": "^35.7.5",
    "electron-builder": "^24.9.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "html-webpack-plugin": "^5.6.5",
    "husky": "^9.1.7",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "prettier": "^3.2.4",
    "style-loader": "^4.0.0",
    "ts-jest": "^29.4.5",
    "ts-loader": "^9.5.4",
    "typescript": "^5.3.3",
    "webpack": "^5.103.0",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.2"
  },
  "build": {
    "appId": "com.query-forge",
    "productName": "QueryForge",
    "files": [
      "dist/**/*",
      "package.json"
    ],
    "mac": {
      "icon": "queryforge_icon.icns",
      "category": "public.app-category.developer-tools",
      "extendInfo": {
        "CFBundleName": "QueryForge",
        "CFBundleDisplayName": "QueryForge",
        "CFBundleExecutable": "QueryForge"
      },
      "hardenedRuntime": false,
      "gatekeeperAssess": false
    },
    "win": {
      "icon": "queryforge_icon.png"
    },
    "linux": {
      "icon": "queryforge_icon.png"
    }
  }
}
````

## File: src/renderer/components/QueryEditor/QueryEditor.tsx
````typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Parser } from 'node-sql-parser';
import { useBigQuery } from '../../hooks/useBigQuery';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useConnectionStore } from '../../stores/connection-store';
import { registerBigQueryLanguage, setMetadataStoreGetter } from '../../utils/bigquery-completions';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import './QueryEditor.css';

interface SqlNodeLocation {
  start?: { line: number; column: number };
  end?: { line: number; column: number };
  begin?: { line: number; column: number };
  finish?: { line: number; column: number };
}

interface ColumnRefInfo {
  alias: string | null;
  column: string;
  location?: SqlNodeLocation;
}

interface TableAliasInfo {
  alias: string;
  datasetId?: string;
  tableId?: string;
}

interface ColumnValidationIssue {
  message: string;
  line: number;
  column: number;
  length: number;
}

const stripIdentifierQuotes = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[`"']/g, '');
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const indexToLineColumn = (text: string, index: number): { line: number; column: number } => {
  let line = 1;
  let column = 1;

  for (let i = 0; i < index && i < text.length; i++) {
    const char = text[i];
    if (char === '\n') {
      line += 1;
      column = 1;
    } else if (char === '\r') {
      // Handle Windows-style line endings (\r\n)
      if (i + 1 < text.length && text[i + 1] === '\n') {
        i += 1;
      }
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

const getLocationPosition = (
  location: SqlNodeLocation | undefined,
  fallbackLength: number
): { line: number; column: number; length: number } | null => {
  if (!location) return null;

  const start = location.start || location.begin;
  const end = location.end || location.finish;

  if (!start || start.line === undefined || start.column === undefined) {
    return null;
  }

  let length = Math.max(1, fallbackLength);

  if (end && end.line !== undefined && end.column !== undefined) {
    if (end.line === start.line) {
      const computedLength = end.column - start.column;
      if (computedLength > 0) {
        length = computedLength;
      }
    }
  }

  return {
    line: start.line,
    column: start.column,
    length,
  };
};

const findPositionInText = (
  text: string,
  alias: string | null,
  column: string
): { line: number; column: number; length: number } | null => {
  const searchPatterns: Array<{ pattern: string; length: number }> = [];

  const sanitizedAlias = alias ? stripIdentifierQuotes(alias) : null;
  const sanitizedColumn = stripIdentifierQuotes(column);

  if (sanitizedAlias) {
    const aliasPattern = `${sanitizedAlias}.${sanitizedColumn}`;
    searchPatterns.push({ pattern: aliasPattern, length: aliasPattern.length });
  }

  if (sanitizedColumn) {
    searchPatterns.push({ pattern: sanitizedColumn, length: sanitizedColumn.length });
  }

    for (const { pattern, length } of searchPatterns) {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'i');
    const match = regex.exec(text);
    if (match && match.index !== undefined) {
      const { line, column: col } = indexToLineColumn(text, match.index);
      return { line, column: col, length: Math.max(1, length) };
    }
  }

  return null;
};

const collectColumnRefsFromExpression = (node: any, refs: ColumnRefInfo[]) => {
  if (!node) return;

  if (Array.isArray(node)) {
    for (const child of node) {
      collectColumnRefsFromExpression(child, refs);
    }
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  if (node.type === 'column_ref') {
    // Handle both string columns and object columns (BigQuery parser returns object for unqualified columns)
    let columnName: string;
    if (typeof node.column === 'string') {
      columnName = stripIdentifierQuotes(node.column);
    } else if (node.column && typeof node.column === 'object') {
      // Handle nested column structure: { expr: { type: 'default', value: 'ColumnName' }, offset: [] }
      if (node.column.expr && typeof node.column.expr.value === 'string') {
        columnName = stripIdentifierQuotes(node.column.expr.value);
      } else if (typeof node.column.column === 'string') {
        columnName = stripIdentifierQuotes(node.column.column);
      } else {
        columnName = '';
      }
    } else {
      columnName = '';
    }
    
    // Collect column refs for validation:
    // - Non-* columns: always collect for column name validation
    // - * columns with alias (e.g., da.*): collect to validate alias exists
    // - Bare * without alias: skip (no validation needed)
    const hasAlias = node.table ? true : false;
    const shouldCollect = columnName && (columnName !== '*' || hasAlias);
    
    if (shouldCollect) {
      refs.push({
        alias: node.table ? stripIdentifierQuotes(node.table) : null,
        column: columnName,
        location: node.location || node.loc,
      });
    }
    return;
  }

  // Recursively inspect child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc') {
      continue;
    }
    collectColumnRefsFromExpression(node[key], refs);
  }
};

const collectColumnRefsForSelect = (selectAst: any, includeCteBodies = false): ColumnRefInfo[] => {
  const refs: ColumnRefInfo[] = [];

  if (!selectAst || typeof selectAst !== 'object') {
    return refs;
  }

  const collect = (expr: any) => collectColumnRefsFromExpression(expr, refs);

  // Optionally collect from CTE bodies (for full query validation)
  if (includeCteBodies && Array.isArray(selectAst.with)) {
    for (const cte of selectAst.with) {
      const cteAst = cte?.stmt?.ast;
      if (cteAst) {
        // Recursively collect from CTE body (but not nested CTEs within CTEs)
        const cteRefs = collectColumnRefsForSelect(cteAst, false);
        refs.push(...cteRefs);
      }
    }
  }

  if (Array.isArray(selectAst.columns)) {
    for (const col of selectAst.columns) {
      collect(col?.expr ?? col);
    }
  }

  if (selectAst.where) {
    collect(selectAst.where);
  }

  if (Array.isArray(selectAst.groupby)) {
    for (const groupExpr of selectAst.groupby) {
      collect(groupExpr);
    }
  } else if (selectAst.groupby?.value && Array.isArray(selectAst.groupby.value)) {
    for (const groupExpr of selectAst.groupby.value) {
      collect(groupExpr);
    }
  }

  if (Array.isArray(selectAst.orderby)) {
    for (const orderItem of selectAst.orderby) {
      collect(orderItem?.expr ?? orderItem);
    }
  }

  if (selectAst.having) {
    collect(selectAst.having);
  }

  if (Array.isArray(selectAst.from)) {
    for (const fromItem of selectAst.from) {
      if (fromItem?.on) {
        collect(fromItem.on);
      }
    }
  }

  return refs;
};

const buildTableAliasMapFromSelect = (
  selectAst: any
): {
  aliasMap: Map<string, TableAliasInfo>;
  uniqueTables: Map<string, { datasetId?: string; tableId?: string }>;
} => {
  const aliasMap = new Map<string, TableAliasInfo>();
  const uniqueTables = new Map<string, { datasetId?: string; tableId?: string }>();

  const registerAlias = (aliasName: string | null | undefined, info: { datasetId?: string; tableId?: string }) => {
    const cleanAlias = stripIdentifierQuotes(aliasName);
    if (!cleanAlias) return;
    const key = cleanAlias.toLowerCase();
    const existing = aliasMap.get(key);
    if (!existing || (!existing.datasetId && info.datasetId) || (!existing.tableId && info.tableId)) {
      aliasMap.set(key, {
        alias: cleanAlias,
        datasetId: info.datasetId,
        tableId: info.tableId,
      });
    }
  };

  const processFromItem = (item: any) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    if (Array.isArray(item)) {
      for (const child of item) {
        processFromItem(child);
      }
      return;
    }

    // Handle subqueries - register alias name but skip schema mapping
    if (item.expr && item.expr.type === 'select') {
      registerAlias(item.as || item.alias, {});
      return;
    }

    let datasetId: string | undefined;
    let tableId: string | undefined;
    let projectId: string | undefined;

    if (typeof item.catalog === 'string') {
      projectId = stripIdentifierQuotes(item.catalog);
    }

    if (typeof item.db === 'string') {
      const dbValue = stripIdentifierQuotes(item.db);
      // node-sql-parser uses db for project in BigQuery dialects
      projectId = projectId ?? dbValue;
      if (!datasetId) {
        datasetId = dbValue;
      }
    }

    if (typeof item.schema === 'string') {
      datasetId = stripIdentifierQuotes(item.schema);
    }

    if (typeof item.dataset === 'string') {
      datasetId = stripIdentifierQuotes(item.dataset);
    }

    const registerTableName = (raw: string | undefined) => {
      if (!raw) return;
      const cleaned = stripIdentifierQuotes(raw);
      if (!cleaned) return;
      const parts = cleaned.split('.').filter(Boolean);

      let resolvedDataset = datasetId;
      let resolvedTable = tableId;

      if (parts.length >= 2) {
        const potentialDataset = parts[parts.length - 2];
        const potentialProject = parts.length >= 3 ? parts[parts.length - 3] : undefined;
        if (!resolvedDataset || resolvedDataset === potentialProject) {
          resolvedDataset = potentialDataset;
        }
        resolvedTable = parts[parts.length - 1];
      } else if (parts.length === 1) {
        resolvedTable = parts[0];
      }

      if (resolvedDataset) {
        datasetId = resolvedDataset;
      }
      if (resolvedTable) {
        tableId = resolvedTable;
      }

      if (resolvedDataset && resolvedTable) {
        const key = `${resolvedDataset}.${resolvedTable}`.toLowerCase();
        if (!uniqueTables.has(key)) {
          uniqueTables.set(key, { datasetId: resolvedDataset, tableId: resolvedTable });
        }
      }

      registerAlias(cleaned, { datasetId: resolvedDataset, tableId: resolvedTable });
    };

    if (typeof item.table === 'string') {
      registerTableName(item.table);
    } else if (item.table && typeof item.table === 'object') {
      if (typeof item.table.table === 'string') {
        registerTableName(item.table.table);
      }
      if (typeof item.table.name === 'string') {
        registerTableName(item.table.name);
      }
      if (typeof item.table.db === 'string' && !datasetId) {
        datasetId = stripIdentifierQuotes(item.table.db);
      }
    }

    // Register alias variations for lookup
    registerAlias(item.as || item.alias, { datasetId, tableId });

    if (tableId) {
      registerAlias(tableId, { datasetId, tableId });
    }

    if (datasetId && tableId) {
      registerAlias(`${datasetId}.${tableId}`, { datasetId, tableId });
    }
  };

  // Process CTEs (WITH clause) - register CTE names as valid aliases
  // Note: We only register the CTE name here, not the tables inside the CTE.
  // CTE bodies are validated separately with their own scope in validateColumnsForSelect.
  if (Array.isArray(selectAst?.with)) {
    for (const cte of selectAst.with) {
      // Register CTE name as a valid alias (without dataset/table since it's a virtual table)
      const cteName = cte?.name?.value || cte?.name;
      if (cteName) {
        registerAlias(cteName, {});
      }
    }
  }

  if (Array.isArray(selectAst?.from)) {
    for (const fromItem of selectAst.from) {
      processFromItem(fromItem);
    }
  } else {
    processFromItem(selectAst?.from);
  }

  return { aliasMap, uniqueTables };
};

export const QueryEditor: React.FC = () => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [sqlValidationStatus, setSqlValidationStatus] = useState<{
    isValid: boolean | null;
    errorMessage: string | null;
  }>({ isValid: null, errorMessage: null });
  const [expectedQuerySize, setExpectedQuerySize] = useState<number | null>(null);
  const [isLoadingQuerySize, setIsLoadingQuerySize] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [completedQueryText, setCompletedQueryText] = useState<string | null>(null);
  const [completedQueryExecutionTime, setCompletedQueryExecutionTime] = useState<number | null>(null);
  const editorRef = useRef<any>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(300);
  const executeHandlerRef = useRef<(() => void) | null>(null);
  const expandSelectStarHandlerRef = useRef<(() => void) | null>(null);
  const validateHandlerRef = useRef<(() => void) | null>(null);
  const selectionValidationTimeoutRef = useRef<number | null>(null);
  const isMouseSelectingRef = useRef(false);
  const validationRunIdRef = useRef(0);
  const schemaCacheRef = useRef<Map<string, Promise<string[] | null>>>(new Map());
    useEffect(() => {
      return () => {
        if (selectionValidationTimeoutRef.current !== null) {
          window.clearTimeout(selectionValidationTimeoutRef.current);
          selectionValidationTimeoutRef.current = null;
        }
        isMouseSelectingRef.current = false;
      };
    }, []);

    const scheduleSelectionValidation = (delay: number = 150) => {
      if (selectionValidationTimeoutRef.current !== null) {
        window.clearTimeout(selectionValidationTimeoutRef.current);
      }
      selectionValidationTimeoutRef.current = window.setTimeout(() => {
        selectionValidationTimeoutRef.current = null;
        if (validateHandlerRef.current) {
          validateHandlerRef.current();
        }
      }, delay);
    };
  const errorDecorationsRef = useRef<string[]>([]);
  const activeTab = useTabsStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab || null;
  });
  
  const queryText = activeTab?.queryText || '';
  const isExecuting = activeTab?.executionStatus === 'running';
  const error = activeTab?.error || null;
  const jobId = activeTab?.jobId || null;
  
  const { setTabQuery, setTabResults, setTabError, setTabStatus, updateTab } = useTabsStore();
  const { saveQuery, updateQuery } = useQueriesStore();
  const { executeQuery, cancelQuery, isConnected } = useBigQuery();
  const connection = useConnectionStore((state) => state.connection);
  
  const shouldDisableRunButton = isExecuting || !isConnected;

  const getTableFields = useCallback(async (datasetId: string, tableId: string): Promise<string[] | null> => {
    const cacheKey = `${datasetId}.${tableId}`.toLowerCase();
    const existing = schemaCacheRef.current.get(cacheKey);
    if (existing) {
      return existing;
    }

    const fetchPromise = (async () => {
      try {
        if (!window.electronAPI?.bigquery?.getTableSchema) {
          return null;
        }
        const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        if (!schemaResult || !Array.isArray(schemaResult.fields)) {
          return [];
        }
        return schemaResult.fields
          .map((field: any) => (typeof field?.name === 'string' ? field.name : null))
          .filter((name): name is string => Boolean(name));
      } catch (error) {
        // If the schema call fails (e.g., table not found), return null so other checks can handle it.
        return null;
      }
    })();

    schemaCacheRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  const validateColumnsForSelect = useCallback(async (
    selectAst: any,
    textToValidate: string,
    canFetchSchemas: boolean
  ): Promise<ColumnValidationIssue[]> => {
    const issues: ColumnValidationIssue[] = [];

    // Helper function to validate columns for a single SELECT scope
    const validateScope = async (
      scopeAst: any,
      scopeAliasMap: Map<string, TableAliasInfo>,
      scopeUniqueTables: Map<string, { datasetId?: string; tableId?: string }>
    ) => {
      const columnRefs = collectColumnRefsForSelect(scopeAst, false);
      const uniqueTableList = Array.from(scopeUniqueTables.values());

      for (const columnRef of columnRefs) {
        const baseColumnName = columnRef.column.split('.')[0];
        const lowerColumnName = baseColumnName.toLowerCase();
        const location =
          getLocationPosition(columnRef.location, columnRef.column.length) ||
          findPositionInText(textToValidate, columnRef.alias, columnRef.column) || {
            line: 1,
            column: 1,
            length: Math.max(1, columnRef.column.length),
          };

        const aliasKey = columnRef.alias ? columnRef.alias.toLowerCase() : null;
        const aliasInfo = aliasKey ? scopeAliasMap.get(aliasKey) : null;

        if (aliasKey && !aliasInfo) {
          issues.push({
            message: `Unknown table or alias "${columnRef.alias}" used in column reference`,
            line: location.line,
            column: location.column,
            length: location.length,
          });
          continue;
        }

        // For alias.* patterns (e.g., da.*), we've validated the alias exists above.
        // The * means "all columns" which is always valid syntax, so skip column validation.
        if (columnRef.column === '*') {
          continue;
        }

        if (!canFetchSchemas) {
          // Without schema access we can only report alias issues.
          continue;
        }

        // If aliasInfo exists but has no datasetId/tableId, it's a CTE or subquery.
        // We can't validate columns against CTEs since we don't know their output schema.
        // Skip validation for these cases.
        if (aliasInfo && (!aliasInfo.datasetId || !aliasInfo.tableId)) {
          continue;
        }

        if (aliasInfo && aliasInfo.datasetId && aliasInfo.tableId) {
          const fields = await getTableFields(aliasInfo.datasetId, aliasInfo.tableId);
          if (fields === null) {
            // Schema lookup failed (likely table not found). Skip detailed column checks.
            continue;
          }

          const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === lowerColumnName);
          if (!hasColumn) {
            const targetName = aliasInfo.alias || `${aliasInfo.datasetId}.${aliasInfo.tableId}`;
            issues.push({
              message: `Column "${columnRef.column}" not found in ${targetName}`,
              line: location.line,
              column: location.column,
              length: location.length,
            });
          }
          continue;
        }

        if (!aliasInfo) {
          // Check if any table in scope is a CTE/subquery (no schema).
          // If so, we can't reliably validate unqualified columns since they might come from the CTE.
          const hasCteOrSubquery = Array.from(scopeAliasMap.values()).some(
            info => !info.datasetId || !info.tableId
          );
          
          if (hasCteOrSubquery) {
            // Skip validation for unqualified columns when CTEs/subqueries are present
            // since we can't determine which table the column belongs to
            continue;
          }

          let columnFound = false;

          for (const tableInfo of uniqueTableList) {
            if (!tableInfo.datasetId || !tableInfo.tableId) {
              continue;
            }

            const fields = await getTableFields(tableInfo.datasetId, tableInfo.tableId);
            if (fields === null) {
              continue;
            }

            const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === lowerColumnName);
            if (hasColumn) {
              columnFound = true;
              break;
            }
          }

          if (!columnFound && uniqueTableList.length > 0) {
            issues.push({
              message: `Column "${columnRef.column}" not found in referenced tables`,
              line: location.line,
              column: location.column,
              length: location.length,
            });
          }
        }
      }
    };

    // First, validate each CTE body independently against its own FROM tables
    if (Array.isArray(selectAst?.with)) {
      for (const cte of selectAst.with) {
        const cteAst = cte?.stmt?.ast;
        if (cteAst) {
          // Build alias map for just this CTE's scope (its own FROM clause only)
          const { aliasMap: cteAliasMap, uniqueTables: cteUniqueTables } = buildTableAliasMapFromSelect({
            ...cteAst,
            with: null, // Don't process nested CTEs here, they'd be handled separately
          });
          await validateScope(cteAst, cteAliasMap, cteUniqueTables);
        }
      }
    }

    // Then validate the main query (excluding CTE bodies, but including CTE names as valid aliases)
    const { aliasMap, uniqueTables } = buildTableAliasMapFromSelect(selectAst);
    await validateScope(selectAst, aliasMap, uniqueTables);

    return issues;
  }, [getTableFields]);

  // Format bytes to human-readable string
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Format execution time to human-readable string
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // SQL parser instance for validation
  const parserRef = useRef<Parser | null>(null);
  
  // Initialize parser
  useEffect(() => {
    parserRef.current = new Parser();
  }, []);

  // Ensure Monaco editor tooltips render above toolbar
  useEffect(() => {
    // Add global style to ensure Monaco hover tooltips have high z-index
    const styleId = 'monaco-tooltip-z-index-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .monaco-editor .monaco-hover,
        .monaco-editor .monaco-editor-hover,
        .monaco-editor .monaco-editor-overlaymessage {
          z-index: 1000 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup: remove style when component unmounts
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Reset completion status when tab changes
  useEffect(() => {
    setCompletedQueryText(null);
    setCompletedQueryExecutionTime(null);
  }, [activeTab?.id]);

  // Calculate editor height based on container size
  useEffect(() => {
    if (!editorWrapperRef.current) return;

    const updateHeight = () => {
      if (editorWrapperRef.current) {
        const height = editorWrapperRef.current.clientHeight;
        setEditorHeight(height);
      }
    };

    // Initial height calculation
    updateHeight();

    // Use ResizeObserver to update height when container resizes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(editorWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]);

  // Helper function to count SELECT statements in SQL text (ignoring comments and strings)
  const countSelectStatements = (sql: string): number => {
    // Count only top-level SELECT statements (not CTEs or subqueries)
    // A top-level SELECT is one that starts a new statement, not inside parentheses
    
    // Remove comments first
    let cleanedSql = sql;
    
    // Remove single-line comments (--)
    cleanedSql = cleanedSql.replace(/--.*$/gm, '');
    
    // Remove multi-line comments (/* */)
    cleanedSql = cleanedSql.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove string literals (single quotes, double quotes, backticks)
    cleanedSql = cleanedSql.replace(/'([^'\\]|\\.)*'/g, "''");
    cleanedSql = cleanedSql.replace(/"([^"\\]|\\.)*"/g, '""');
    cleanedSql = cleanedSql.replace(/`([^`\\]|\\.)*`/g, '``');
    
    // Now count top-level statements by tracking parenthesis depth
    // A SELECT at depth 0 that is not preceded by WITH...AS is a top-level statement
    let depth = 0;
    let topLevelCount = 0;
    let i = 0;
    let inWithClause = false;
    
    // Normalize whitespace for easier matching
    cleanedSql = cleanedSql.replace(/\s+/g, ' ').trim();
    
    while (i < cleanedSql.length) {
      const char = cleanedSql[i];
      
      if (char === '(') {
        depth++;
        i++;
        continue;
      }
      
      if (char === ')') {
        depth--;
        // When we exit the outermost parenthesis after a WITH clause CTE definition,
        // we're still in the WITH clause until we hit the main SELECT
        i++;
        continue;
      }
      
      // Check for WITH keyword at depth 0 (start of CTE)
      if (depth === 0) {
        const remainingUpper = cleanedSql.substring(i).toUpperCase();
        
        // Check for WITH keyword (start of CTE)
        if (remainingUpper.match(/^WITH\b/)) {
          inWithClause = true;
          i += 4;
          continue;
        }
        
        // Check for SELECT keyword
        if (remainingUpper.match(/^SELECT\b/)) {
          if (inWithClause) {
            // This SELECT is the main query after WITH clause - count it
            topLevelCount++;
            inWithClause = false;
          } else {
            // This is a standalone SELECT statement
            topLevelCount++;
          }
          i += 6;
          continue;
        }
        
        // Check for semicolon (statement separator) - reset state for next statement
        if (char === ';') {
          inWithClause = false;
          i++;
          continue;
        }
      }
      
      i++;
    }
    
    return topLevelCount;
  };

  // Validate SQL syntax and set markers in Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !parserRef.current) {
      return;
    }

    const validateSQL = async () => {
      const model = editorRef.current?.getModel();
      if (!model || !(window as any).monaco) return;

      const currentRunId = ++validationRunIdRef.current;

      // Get current selection
      const selection = editorRef.current?.getSelection();
      const hasSelection = selection && !selection.isEmpty();
      
      // Determine which text to validate
      let textToValidate = queryText;
      if (hasSelection && selection && model) {
        textToValidate = model.getValueInRange(selection);
      }
      
      const trimmedQuery = textToValidate.trim();
      
      // Skip validation for empty or very short queries to avoid false positives
      if (!trimmedQuery || trimmedQuery.length < 3) {
        // Clear markers if query is empty or too short
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
        
        // Clear error decorations in glyph margin
        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            []
          );
        }
        
        // Update status bar - but preserve table not found errors if they exist
        setSqlValidationStatus((prev) => {
          // Only clear if there's no table not found error
          if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
            return prev;
          }
          return { isValid: null, errorMessage: null };
        });
        return;
      }

      // Check for multiple SELECT statements when no selection is active
      // Only check full query text, not selected text
      const selectCount = countSelectStatements(queryText);
      
      if (selectCount > 1 && !hasSelection) {
        // Multiple SELECT statements detected without selection - show error
        // Find the position of the second SELECT statement
        const lines = queryText.split('\n');
        let secondSelectLine = 1;
        let secondSelectColumn = 1;
        let selectFound = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Remove comments and strings for matching
          let cleanedLine = line.replace(/--.*$/, '').replace(/\/\*.*?\*\//g, '');
          cleanedLine = cleanedLine.replace(/'([^'\\]|\\.)*'/g, "''").replace(/"([^"\\]|\\.)*"/g, '""').replace(/`([^`\\]|\\.)*`/g, '``');
          
          const selectMatch = cleanedLine.match(/\bSELECT\b/i);
          if (selectMatch) {
            selectFound++;
            if (selectFound === 2) {
              secondSelectLine = i + 1;
              secondSelectColumn = (selectMatch.index || 0) + 1;
              break;
            }
          }
        }
        
        const markers: any[] = [
          {
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: secondSelectLine,
            startColumn: secondSelectColumn,
            endLineNumber: secondSelectLine,
            endColumn: Math.min(secondSelectColumn + 6, model.getLineLength(secondSelectLine) + 1), // Highlight "SELECT"
            message: 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.',
          },
        ];
        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
        
        // Add error indicator in glyph margin for multiple SELECT error
        if (editorRef.current) {
          const errorMsg = 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.';
          const decorations: any[] = [
            {
              range: new (window as any).monaco.Range(secondSelectLine, 1, secondSelectLine, 1),
              options: {
                glyphMarginClassName: 'error-glyph-margin',
                glyphMarginHoverMessage: { value: errorMsg },
                minimap: {
                  color: '#f48771',
                },
                overviewRuler: {
                  color: '#f48771',
                  position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                },
              },
            },
          ];
          
          // Update decorations (remove old ones, add new ones)
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }
        
        setSqlValidationStatus({ 
          isValid: false, 
          errorMessage: 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.' 
        });
        return;
      }

      // Validate the text (either selected or full query)
      let parsedAst: any;
      try {
        // Try to parse the SQL
        parsedAst = parserRef.current!.astify(trimmedQuery, {
          database: 'bigquery',
        });
        
        // Parsing succeeded - set valid status immediately
        // (column validation may change this to invalid later if issues are found)
        setSqlValidationStatus((prev) => {
          // Don't overwrite table not found errors - those are handled by calculateExpectedQuerySize
          if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
            return prev;
          }
          return { isValid: true, errorMessage: null };
        });
        
        // Clear markers
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
        
        // Clear error decorations in glyph margin
        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            []
          );
        }
      } catch (error: any) {
        if (currentRunId !== validationRunIdRef.current) {
          return;
        }
        // Parse error occurred, create marker
        const errorMessage = error.message || 'SQL syntax error';
        
        // First, check if there's an obvious syntax error on line 1
        // This helps catch errors that the parser might report as being on later lines
        const lines = textToValidate.split('\n');
        let firstLineError: { line: number; column: number } | null = null;
        
        if (lines.length > 0 && lines[0].trim()) {
          const firstLine = lines[0].trim();
          // Check for common first-line syntax errors
          const firstLineErrors = [
            /sel\s+ect/i,  // SEL ECT
            /fro\s+m/i,    // FRO M
            /wher\s+e/i,   // WHER E
            /orde\s+r/i,   // ORDE R
            /grou\s+p/i,   // GROU P
          ];
          
          for (const pattern of firstLineErrors) {
            const match = firstLine.match(pattern);
            if (match && match.index !== undefined) {
              firstLineError = { line: 1, column: match.index + 1 };
              break;
            }
          }
        }
        
        // Try to extract line and column from error object properties first
        let lineNumber = 1;
        let column = 1;
        
        // Check error object for position properties (node-sql-parser may provide these)
        if (error.loc) {
          lineNumber = error.loc.line || error.loc.start?.line || 1;
          column = error.loc.column || error.loc.start?.column || error.loc.start?.character || 1;
        } else if (error.location) {
          lineNumber = error.location.line || error.location.start?.line || 1;
          column = error.location.column || error.location.start?.column || error.location.start?.character || 1;
        } else if (error.line !== undefined) {
          lineNumber = error.line;
          column = error.column || 1;
        } else if (error.pos !== undefined) {
          // If we have a character position, convert it to line/column
          let charCount = 0;
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (charCount + lineLength > error.pos) {
              lineNumber = i + 1;
              column = error.pos - charCount + 1;
              break;
            }
            charCount += lineLength;
          }
        } else {
          // Try to extract line and column from error message string
          // Common error message patterns from node-sql-parser
          const lineMatch = errorMessage.match(/line (\d+)/i) || 
                           errorMessage.match(/at line (\d+)/i) ||
                           errorMessage.match(/line: (\d+)/i) ||
                           errorMessage.match(/Line (\d+)/i);
          const columnMatch = errorMessage.match(/column (\d+)/i) || 
                             errorMessage.match(/at column (\d+)/i) ||
                             errorMessage.match(/column: (\d+)/i) ||
                             errorMessage.match(/Column (\d+)/i) ||
                             errorMessage.match(/col (\d+)/i);
          
          if (lineMatch) {
            lineNumber = parseInt(lineMatch[1], 10);
          }
          if (columnMatch) {
            column = parseInt(columnMatch[1], 10);
          }
        }
        
        // If we found an error on line 1, prioritize it over parser's reported line
        // (parser might report where it gave up, not where the first error occurred)
        if (firstLineError && lineNumber > 1) {
          lineNumber = firstLineError.line;
          column = firstLineError.column;
        }

        // If we still can't extract position, try to find it in the query text
        if (lineNumber === 1 && column === 1) {
            const lines = textToValidate.split('\n');
            
            // Extract potential error tokens from error message
            // Common patterns: "Unexpected token X", "Syntax error near X", etc.
            const errorLower = errorMessage.toLowerCase();
            
            // Try to find tokens mentioned in the error message
            // Look for quoted strings or specific keywords in the error
            const quotedMatch = errorMessage.match(/['"`]([^'"`]+)['"`]/);
            const unexpectedMatch = errorMessage.match(/unexpected\s+(\w+)/i);
            const nearMatch = errorMessage.match(/near\s+['"`]?(\w+)['"`]?/i);
            
            const searchTokens: string[] = [];
            if (quotedMatch) searchTokens.push(quotedMatch[1]);
            if (unexpectedMatch) searchTokens.push(unexpectedMatch[1]);
            if (nearMatch) searchTokens.push(nearMatch[1]);
            
            // Also try to extract meaningful words from error message
            const errorWords = errorLower.match(/\b(select|from|where|join|insert|update|delete|create|alter|drop|table|view|index|syntax|error|unexpected|token)\b/g);
            if (errorWords) {
              searchTokens.push(...errorWords);
            }
            
            // Find the FIRST occurrence of any token across ALL lines
            let earliestMatch: { line: number; column: number } | null = null;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const lineLower = line.toLowerCase();
              
              // Check each search token
              for (const token of searchTokens) {
                if (token && token.length > 1) {
                  const tokenLower = token.toLowerCase();
                  // Look for the token in the line
                  // Try exact word match first (with word boundaries)
                  const wordBoundaryRegex = new RegExp(`\\b${tokenLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                  let tokenIndex = lineLower.search(wordBoundaryRegex);
                  
                  // If not found as whole word, try substring match
                  if (tokenIndex === -1) {
                    tokenIndex = lineLower.indexOf(tokenLower);
                  }
                  
                  if (tokenIndex !== -1) {
                    // Found a match - check if it's earlier than previous matches
                    if (!earliestMatch || i + 1 < earliestMatch.line || 
                        (i + 1 === earliestMatch.line && tokenIndex + 1 < earliestMatch.column)) {
                      earliestMatch = { line: i + 1, column: tokenIndex + 1 };
                    }
                  }
                }
              }
            }
            
            // Use the earliest match if found
            if (earliestMatch) {
              lineNumber = earliestMatch.line;
              column = earliestMatch.column;
            }
            
            // If still not found, look for lines that contain syntax errors
            // Check for common syntax error patterns like "SEL ECT" (space in keyword)
            if (lineNumber === 1 && column === 1) {
              let earliestMalformed: { line: number; column: number } | null = null;
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Check for malformed SQL keywords (space in the middle)
                const malformedKeywords = [
                  /sel\s+ect/i,  // SEL ECT
                  /fro\s+m/i,    // FRO M
                  /wher\s+e/i,   // WHER E
                  /orde\s+r/i,   // ORDE R
                  /grou\s+p/i,   // GROU P
                ];
                
                for (const pattern of malformedKeywords) {
                  if (pattern.test(line)) {
                    const match = line.match(pattern);
                    if (match && match.index !== undefined) {
                      // Found a malformed keyword - check if it's earlier than previous matches
                      if (!earliestMalformed || i + 1 < earliestMalformed.line ||
                          (i + 1 === earliestMalformed.line && match.index + 1 < earliestMalformed.column)) {
                        earliestMalformed = { line: i + 1, column: match.index + 1 };
                      }
                    }
                  }
                }
              }
              
              // Use the earliest malformed keyword match if found
              if (earliestMalformed) {
                lineNumber = earliestMalformed.line;
                column = earliestMalformed.column;
              }
            }
            
            // Last resort: if we still haven't found anything, default to line 1, column 1
            // (the error is likely at the start of the query)
            if (lineNumber === 1 && column === 1) {
              // Check if first line has content
              if (lines.length > 0 && lines[0].trim()) {
                lineNumber = 1;
                column = 1;
              }
            }
        }

        // Adjust line number if we're validating a selection
        let actualLineNumber = lineNumber;
        if (hasSelection && selection) {
          // Error line numbers are relative to the selected text, adjust to document line numbers
          actualLineNumber = selection.startLineNumber + lineNumber - 1;
        }

        // Ensure line number is within bounds
        const totalLines = model.getLineCount();
        if (actualLineNumber > totalLines) {
          actualLineNumber = totalLines;
        }
        if (actualLineNumber < 1) {
          actualLineNumber = 1;
        }

        // Get line length to ensure column is within bounds
        const lineLength = model.getLineLength(actualLineNumber);
        if (column > lineLength) {
          column = Math.max(1, lineLength);
        }
        if (column < 1) {
          column = 1;
        }

        // Create marker for the error
        const markers: any[] = [
          {
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: actualLineNumber,
            startColumn: column,
            endLineNumber: actualLineNumber,
            endColumn: Math.min(column + 10, lineLength + 1),
            message: errorMessage,
          },
        ];

        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
        
        // Add error indicator in glyph margin
        if (editorRef.current) {
          const decorations: any[] = [
            {
              range: new (window as any).monaco.Range(actualLineNumber, 1, actualLineNumber, 1),
              options: {
                glyphMarginClassName: 'error-glyph-margin',
                glyphMarginHoverMessage: { value: errorMessage },
                minimap: {
                  color: '#f48771',
                },
                overviewRuler: {
                  color: '#f48771',
                  position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                },
              },
            },
          ];
          
          // Update decorations (remove old ones, add new ones)
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }
        
        // Update status bar - invalid SQL syntax (this takes precedence over table not found)
        setSqlValidationStatus({ isValid: false, errorMessage });
        return;
      }

      if (currentRunId !== validationRunIdRef.current) {
        return;
      }

      const statements = Array.isArray(parsedAst) ? parsedAst : [parsedAst];
      const selectStatements = statements.filter((stmt) => stmt?.type === 'select');

      let columnIssues: ColumnValidationIssue[] = [];

      if (selectStatements.length > 0) {
        const canFetchSchemas = Boolean(isConnected && window.electronAPI?.bigquery?.getTableSchema);
        for (const statement of selectStatements) {
          const issues = await validateColumnsForSelect(statement, textToValidate, canFetchSchemas);
          if (issues.length > 0) {
            columnIssues = columnIssues.concat(issues);
          }
        }
      }

      if (currentRunId !== validationRunIdRef.current) {
        return;
      }

      if (columnIssues.length > 0) {
        const markers: any[] = [];
        const decorations: any[] = [];

        for (const issue of columnIssues) {
          let lineNumber = issue.line;
          let column = issue.column;

          if (hasSelection && selection) {
            lineNumber = selection.startLineNumber + lineNumber - 1;
          }

          lineNumber = Math.max(1, Math.min(lineNumber, model.getLineCount()));
          const lineLength = model.getLineLength(lineNumber);
          const startColumn = Math.max(1, Math.min(column, lineLength + 1));
          const endColumn = Math.max(startColumn, Math.min(column + issue.length, lineLength + 1));

          markers.push({
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn,
            endLineNumber: lineNumber,
            endColumn,
            message: issue.message,
          });

          decorations.push({
            range: new (window as any).monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              glyphMarginClassName: 'error-glyph-margin',
              glyphMarginHoverMessage: { value: issue.message },
              minimap: {
                color: '#f48771',
              },
              overviewRuler: {
                color: '#f48771',
                position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
              },
            },
          });
        }

        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);

        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }

        setSqlValidationStatus({
          isValid: false,
          errorMessage: columnIssues[0]?.message ?? 'Column validation failed',
        });
        return;
      }

      // Update status bar - valid SQL syntax (no column issues)
      setSqlValidationStatus((prev) => {
        if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
          return prev;
        }
        return { isValid: true, errorMessage: null };
      });
    };

    // Store validation function in ref so it can be called from selection change listener
    validateHandlerRef.current = () => {
      void validateSQL();
    };

    // Debounce validation to avoid excessive parsing
    const timeoutId = setTimeout(() => {
      void validateSQL();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [queryText, isConnected, validateColumnsForSelect]);

  const handleExecute = async () => {
    const currentTab = useTabsStore.getState().tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (!currentTab) return;

    const currentIsConnected = useConnectionStore.getState().connection !== null;

    if (!currentIsConnected) {
      setTabError(currentTab.id, 'Not connected to BigQuery. Please configure a connection first.');
      return;
    }

    // Get the query text to execute - use selection if available, otherwise use entire query
    let queryTextToExecute = '';
    
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      
      // Check if there's a non-empty selection
      if (selection && !selection.isEmpty() && model) {
        queryTextToExecute = model.getValueInRange(selection);
      } else {
        // No selection, use entire query text
        queryTextToExecute = currentTab.queryText || '';
      }
    } else {
      // Editor not available, use entire query text
      queryTextToExecute = currentTab.queryText || '';
    }

    if (!queryTextToExecute.trim()) {
      setTabError(currentTab.id, 'Please enter a query or select text to execute');
      return;
    }

    // Set status to running and clear previous results in a single update
    useTabsStore.getState().updateTab(currentTab.id, {
      executionStatus: 'running',
      error: '',
      results: undefined,
    });
    
      // Reset completion status when starting a new query
    setCompletedQueryText(null);
    setCompletedQueryExecutionTime(null);
    
    // Clear cache for this tab when starting a new query
    if (window.electronAPI?.resultsCache) {
      await window.electronAPI.resultsCache.delete(currentTab.id).catch((err: unknown) => {
        console.error('Failed to clear cache:', err);
      });
    }

    try {
      const result = await executeQuery(queryTextToExecute);
      useTabsStore.getState().updateTab(currentTab.id, { jobId: result.jobId });
      
      // Save results to cache for this tab BEFORE updating tab state
      // This ensures cache is ready when QueryResults component reloads
      if (window.electronAPI?.resultsCache) {
        await window.electronAPI.resultsCache.save(currentTab.id, result);
      }
      
      // Update tab state after cache is saved
      setTabResults(currentTab.id, result);
      
      // Mark query as completed successfully - store the executed query text and execution time
      setCompletedQueryText(queryTextToExecute);
      setCompletedQueryExecutionTime(result.executionTimeMs);
    } catch (err: any) {
      // Extract error message from various possible error formats
      let errorMessage = 'Query execution failed';
      
      if (err) {
        // Handle Error objects (most common case from Electron IPC)
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        // Handle plain objects
        else if (typeof err === 'object') {
          // First try to get the message property
          if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
          }
          // If details is an array, try to extract message from first item
          else if (err.details) {
            if (Array.isArray(err.details) && err.details.length > 0) {
              const firstDetail = err.details[0];
              if (typeof firstDetail === 'object' && firstDetail.message) {
                errorMessage = firstDetail.message;
              } else if (typeof firstDetail === 'string') {
                errorMessage = firstDetail;
              } else {
                errorMessage = JSON.stringify(firstDetail);
              }
            } else if (typeof err.details === 'string') {
              errorMessage = err.details;
            } else if (typeof err.details === 'object') {
              errorMessage = err.details.message || JSON.stringify(err.details);
            }
          }
          // Fallback to code if available
          else if (err.code) {
            errorMessage = err.code;
          }
          // Last resort: stringify the whole object
          else {
            try {
              errorMessage = JSON.stringify(err);
            } catch {
              errorMessage = String(err);
            }
          }
        }
        // Handle string errors
        else if (typeof err === 'string') {
          errorMessage = err;
        }
        // Handle other types
        else {
          errorMessage = String(err);
        }
      }
      
      // Remove Electron IPC error prefix if present
      const electronPrefix = /^Error: Error invoking remote method 'bigquery:execute':\s*/i;
      errorMessage = errorMessage.replace(electronPrefix, '');
      
      setTabError(currentTab.id, errorMessage);
    }
  };

  // Update the refs whenever handlers change
  useEffect(() => {
    executeHandlerRef.current = handleExecute;
  }, [executeQuery, setTabError, setTabStatus, setTabResults]);

  useEffect(() => {
    expandSelectStarHandlerRef.current = handleExpandSelectStar;
  }, [activeTab, queryText, connection, setTabQuery, setTabError]);

  const handleCancel = async () => {
    if (!activeTab || !jobId) return;

    try {
      await cancelQuery(jobId);
      setTabStatus(activeTab.id, 'cancelled');
    } catch (err: any) {
      setTabError(activeTab.id, err.message || 'Failed to cancel query');
    }
  };

  const handleQueryChange = (value: string | undefined) => {
    if (activeTab) {
      const newQueryText = value || '';
      setTabQuery(activeTab.id, newQueryText);
      
      // If query text has changed from the completed query, reset completion status
      if (completedQueryText !== null && newQueryText !== completedQueryText) {
        setCompletedQueryText(null);
        setCompletedQueryExecutionTime(null);
      }
    }
  };

  const handleSave = async () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }

    if (!saveName.trim()) {
      alert('Please enter a name for the query');
      return;
    }

    try {
      if (activeTab.savedQueryId) {
        // Update existing query
        await updateQuery(activeTab.savedQueryId, {
          name: saveName.trim(),
          sqlText: queryText,
          description: saveDescription.trim() || undefined,
        });
      } else {
        // Save new query
        const saved = await saveQuery({
          name: saveName.trim(),
          sqlText: queryText,
          description: saveDescription.trim() || undefined,
        });
        updateTab(activeTab.id, {
          savedQueryId: saved.id,
          title: saved.name,
          isModified: false,
        });
      }
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
    } catch (error: any) {
      alert(`Failed to save query: ${error.message || error.code || 'Unknown error'}`);
    }
  };

  const handleOpenSaveDialog = () => {
    if (activeTab) {
      setSaveName(activeTab.savedQueryId ? activeTab.title : '');
      setSaveDescription('');
      setShowSaveDialog(true);
    }
  };

  const handleFormat = () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }

    try {
      const formatted = format(queryText, {
        language: 'bigquery',
        tabWidth: 2,
        useTabs: false,
        keywordCase: 'upper',
        indentStyle: 'standard',
      });
      setTabQuery(activeTab.id, formatted);
    } catch (err: any) {
      setTabError(activeTab.id, `Formatting failed: ${err.message || 'Invalid SQL syntax'}`);
    }
  };

  const handleExpandSelectStar = async () => {
    if (!activeTab || !queryText.trim() || !connection || !window.electronAPI) {
      return;
    }

    try {
      const trimmedQuery = queryText.trim();
      
      // Check if query contains SELECT *
      const selectStarMatch = trimmedQuery.match(/SELECT\s+\*\s+FROM/i);
      if (!selectStarMatch) {
        setTabError(activeTab.id, 'No SELECT * FROM statement found');
        return;
      }

      // Extract table reference using regex (more reliable than AST parsing)
      // Match: FROM table_ref [AS alias] [WHERE|JOIN|...]
      // Handle backticks, quoted identifiers, and different formats
      const fromMatch = trimmedQuery.match(/FROM\s+([^\s]+(?:\s+AS\s+\w+)?)(?:\s|$|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|ORDER|HAVING|LIMIT)/i);
      if (!fromMatch) {
        setTabError(activeTab.id, 'Could not find table reference in FROM clause');
        return;
      }

      // Extract table reference (remove AS alias if present)
      let tableRef = fromMatch[1].trim();
      // Remove AS alias
      tableRef = tableRef.replace(/\s+AS\s+\w+$/i, '');
      // Remove backticks
      tableRef = tableRef.replace(/`/g, '');

      // Parse table reference
      // Could be: table, dataset.table, or project.dataset.table
      const parts = tableRef.split('.');
      let datasetId: string;
      let tableId: string;

      if (parts.length === 1) {
        // Just table name - cannot determine dataset
        setTabError(activeTab.id, 'Cannot determine dataset from table name. Please use dataset.table or project.dataset.table format.');
        return;
      } else if (parts.length === 2) {
        // dataset.table
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        // project.dataset.table
        datasetId = parts[1];
        tableId = parts[2];
      } else {
        setTabError(activeTab.id, 'Invalid table reference format. Expected: dataset.table or project.dataset.table');
        return;
      }

      // Fetch table schema
      const schemaResult = await window.electronAPI.bigquery.getTableSchema(
        datasetId,
        tableId
      );

      if (!schemaResult.fields || schemaResult.fields.length === 0) {
        setTabError(activeTab.id, 'No columns found in table schema');
        return;
      }

      // Extract column names (only top-level columns, not nested fields)
      const columnNames = schemaResult.fields.map((field: any) => {
        // Escape column names that need escaping (contain special characters or are reserved words)
        const name = field.name;
        // Check if column name needs escaping
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
          return name;
        } else {
          return `\`${name}\``;
        }
      });

      // Replace SELECT * with SELECT column1, column2, ...
      // Use a more precise regex to only replace the first SELECT * in the query
      const columnList = columnNames.join(', ');
      const expandedQuery = trimmedQuery.replace(/SELECT\s+\*/i, `SELECT ${columnList}`);

      // Format the query after expansion
      try {
        const formatted = format(expandedQuery, {
          language: 'bigquery',
          tabWidth: 2,
          useTabs: false,
          keywordCase: 'upper',
          indentStyle: 'standard',
        });
        setTabQuery(activeTab.id, formatted);
      } catch (formatError: any) {
        // If formatting fails, still set the expanded query without formatting
        setTabQuery(activeTab.id, expandedQuery);
        setTabError(activeTab.id, `Expanded SELECT * but formatting failed: ${formatError.message || 'Invalid SQL syntax'}`);
      }
    } catch (err: any) {
      setTabError(activeTab.id, `Failed to expand SELECT *: ${err.message || 'Unknown error'}`);
    }
  };

  // Strip SQL comments from query text
  // Handles both single-line (--) and multi-line (/* */) comments
  // Preserves comments inside string literals
  const stripComments = (sql: string): string => {
    let result = '';
    let i = 0;
    const len = sql.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = sql[i];
      const nextChar = i + 1 < len ? sql[i + 1] : '';

      // Handle string literals - don't process comments inside strings
      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        result += char;
        i++;
        continue;
      }

      // If we're inside a string literal, just copy the character
      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      // Handle single-line comments (--)
      if (char === '-' && nextChar === '-') {
        // Skip until end of line
        while (i < len && sql[i] !== '\n' && sql[i] !== '\r') {
          i++;
        }
        // Include the newline character if present
        if (i < len && sql[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && sql[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && sql[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      // Handle multi-line comments (/* */)
      if (char === '/' && nextChar === '*') {
        i += 2; // Skip /*
        // Skip until */
        while (i < len) {
          if (sql[i] === '*' && i + 1 < len && sql[i + 1] === '/') {
            i += 2; // Skip */
            break;
          }
          i++;
        }
        // Replace with a space to preserve word boundaries
        result += ' ';
        continue;
      }

      // Regular character
      result += char;
      i++;
    }

    return result;
  };

  // Extract table references from SQL query
  const extractTableReferences = (sql: string): Array<{ datasetId: string; tableId: string }> => {
    const tableRefsMap = new Map<string, { datasetId: string; tableId: string }>();
    
    // Strip comments before extracting table references
    const sqlWithoutComments = stripComments(sql);
    const trimmedSql = sqlWithoutComments.trim();
    
    if (!trimmedSql) return [];

    // Match FROM and JOIN clauses (including LEFT JOIN, RIGHT JOIN, INNER JOIN, etc.)
    // This pattern matches: FROM/JOIN/LEFT JOIN/etc followed by table reference
    // Handles: backticked identifiers (with dots inside OR separate backticks for each part),
    // quoted identifiers, and regular identifiers
    // Pattern explanation:
    // - Matches FROM or any JOIN type
    // - Captures table reference which can be:
    //   - Backticked with dots inside: `project.dataset.table`
    //   - Backticked separately: `project`.`dataset`.`table`
    //   - Quoted: "project.dataset.table" or 'project.dataset.table'
    //   - Regular: project.dataset.table or dataset.table
    // - Handles AS aliases
    // The pattern now handles `part1`.`part2`.`part3` format used by BigQuery
    const fromJoinPattern = /(?:FROM|(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+JOIN|JOIN)\s+((?:`[^`]+`(?:\.`[^`]+`){0,2}|`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))(?:\s+AS\s+[\w\-]+)?/gi;
    const matches = Array.from(trimmedSql.matchAll(fromJoinPattern));

    for (const match of matches) {
      let tableRef = match[1].trim();
      
      // Remove quotes/backticks
      tableRef = tableRef.replace(/[`"']/g, '');

      // Parse table reference
      // Could be: table, dataset.table, or project.dataset.table
      const parts = tableRef.split('.').filter(p => p.length > 0);
      
      let datasetId: string | null = null;
      let tableId: string | null = null;
      
      if (parts.length === 2) {
        // dataset.table
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        // project.dataset.table
        datasetId = parts[1];
        tableId = parts[2];
      }
      
      // Only add if we have both dataset and table
      if (datasetId && tableId) {
        // Use a key to deduplicate - same table won't be counted twice
        const key = `${datasetId}.${tableId}`;
        if (!tableRefsMap.has(key)) {
          tableRefsMap.set(key, { datasetId, tableId });
        }
      }
    }

    return Array.from(tableRefsMap.values());
  };

  // Convert SQL to dbt syntax by replacing table references with {{ source('DATASET', 'TABLE') }}
  const convertToDbtSyntax = (sql: string): string => {
    let result = sql;
    
    // Only match table references that come after FROM or JOIN keywords
    // This prevents matching column references like alias.column
    // Pattern matches: FROM/JOIN followed by table reference (with optional backticks)
    const fromJoinTablePattern = /(\b(?:FROM|JOIN)\s+)((?:`[^`]+`|[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2}))(\s|$|,|\))/gi;
    
    const matches = Array.from(result.matchAll(fromJoinTablePattern));
    
    // Process matches in reverse order to preserve positions when replacing
    const processedMatches: Array<{ start: number; end: number; replacement: string }> = [];
    
    for (const match of matches) {
      const prefix = match[1]; // FROM or JOIN with trailing space
      const tableRef = match[2]; // The table reference
      const suffix = match[3]; // Trailing whitespace or delimiter
      
      // Remove backticks if present
      const cleanRef = tableRef.replace(/`/g, '');
      
      // Split by dots
      const parts = cleanRef.split('.');
      
      let datasetId: string | null = null;
      let tableId: string | null = null;
      
      if (parts.length === 2) {
        // dataset.table
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        // project.dataset.table
        datasetId = parts[1];
        tableId = parts[2];
      } else {
        // Not a valid table reference (single part or more than 3 parts)
        continue;
      }
      
      // Skip if this looks like it's inside a string literal
      const beforeMatch = result.substring(0, match.index);
      const openSingleQuotes = (beforeMatch.match(/'/g) || []).length;
      const openDoubleQuotes = (beforeMatch.match(/"/g) || []).length;
      
      // If odd number of quotes, we're inside a string - skip
      if (openSingleQuotes % 2 !== 0 || openDoubleQuotes % 2 !== 0) {
        continue;
      }
      
      // Create dbt source syntax
      const dbtSource = `{{ source('${datasetId}', '${tableId}') }}`;
      
      // Replace just the table reference part, keeping the FROM/JOIN prefix and suffix
      processedMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        replacement: `${prefix}${dbtSource}${suffix}`,
      });
    }
    
    // Apply replacements in reverse order to preserve positions
    processedMatches.sort((a, b) => b.start - a.start);
    
    for (const { start, end, replacement } of processedMatches) {
      result = result.substring(0, start) + replacement + result.substring(end);
    }
    
    return result;
  };

  // Check if the query contains dbt source/ref syntax
  const hasDbtSyntax = queryText.includes("{{ source('") || queryText.includes("{{ ref('");

  // Convert dbt source syntax back to BigQuery table references
  const convertFromDbtSyntax = (sql: string): string => {
    // Get project ID from connection
    const projectId = connection?.projectId || 'project';
    
    // Get all cached tables for ref() lookup
    const allTables = useBigQueryMetadataStore.getState().getAllTables();
    
    // Pattern to match {{ source('DATASET', 'TABLE') }}
    const dbtSourcePattern = /\{\{\s*source\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)\s*\}\}/g;
    
    // Pattern to match {{ ref('TABLE') }} - search in cached tables to find the dataset
    const dbtRefPattern = /\{\{\s*ref\s*\(\s*'([^']+)'\s*\)\s*\}\}/g;
    
    let result = sql.replace(dbtSourcePattern, (_, datasetId, tableId) => {
      return `${projectId}.${datasetId}.${tableId}`;
    });
    
    result = result.replace(dbtRefPattern, (match, tableId) => {
      // Search for the table in cached metadata
      const tableIdLower = tableId.toLowerCase();
      const foundTable = allTables.find(
        (t) => t.table.id.toLowerCase() === tableIdLower
      );
      
      if (foundTable) {
        // Found the table - return full path with project, dataset, and table
        return `${projectId}.${foundTable.dataset}.${foundTable.table.id}`;
      }
      
      // Table not found in cache - keep original ref syntax as a warning
      // or return just the table name as fallback
      return tableId;
    });
    
    return result;
  };

  // Handle dbtify/de-dbtify button click
  const handleDbtify = () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }
    
    if (hasDbtSyntax) {
      // De-dbtify: convert from dbt syntax to BigQuery
      const bigQuerySyntax = convertFromDbtSyntax(queryText);
      setTabQuery(activeTab.id, bigQuerySyntax);
    } else {
      // Dbtify: convert from BigQuery to dbt syntax
      if (sqlValidationStatus.isValid !== true) {
        return;
      }
      const dbtSyntax = convertToDbtSyntax(queryText);
      setTabQuery(activeTab.id, dbtSyntax);
    }
  };

  // Calculate expected query size from table/view metadata
  useEffect(() => {
    const calculateExpectedQuerySize = async () => {
      // Use selected text if available, otherwise use full query text
      const textToAnalyze = selectedText.trim() || queryText.trim();
      
      if (!textToAnalyze || !isConnected || !connection?.projectId || !window.electronAPI) {
        setExpectedQuerySize(null);
        return;
      }

      // Skip table validation if SQL syntax is invalid (syntax errors take precedence)
      // But still allow clearing previous table not found errors
      const shouldSkipTableCheck = sqlValidationStatus.isValid === false && 
        (!sqlValidationStatus.errorMessage || !sqlValidationStatus.errorMessage.includes('Table not found'));
      
      if (shouldSkipTableCheck) {
        setExpectedQuerySize(null);
        return;
      }

      setIsLoadingQuerySize(true);
      
      try {
        const tableRefs = extractTableReferences(textToAnalyze);
        
        if (tableRefs.length === 0) {
          setExpectedQuerySize(null);
          setIsLoadingQuerySize(false);
          return;
        }

        // Helper function to get size for a table or view
        // For views, recursively fetches the underlying table sizes
        // visitedViews tracks already processed views to prevent infinite loops
        const getTableOrViewSize = async (
          datasetId: string,
          tableId: string,
          visitedViews: Set<string>
        ): Promise<{ bytes: number; hasMetadata: boolean; error?: { message: string; tableRef: string } }> => {
          const tableKey = `${datasetId}.${tableId}`;
          
          // Prevent infinite recursion for views that reference each other
          if (visitedViews.has(tableKey)) {
            return { bytes: 0, hasMetadata: false };
          }
          
          try {
            const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
            
            // If numBytes exists and is > 0, this is a regular table with data
            if (schemaResult.metadata?.numBytes !== undefined && schemaResult.metadata.numBytes > 0) {
              return { bytes: schemaResult.metadata.numBytes, hasMetadata: true };
            }
            
            // If numBytes is 0 or undefined, this might be a view
            // Try to get the view definition and extract underlying tables
            try {
              const viewResult = await window.electronAPI.bigquery.getViewDefinition(datasetId, tableId);
              if (viewResult.definition) {
                // Mark this view as visited before processing its definition
                visitedViews.add(tableKey);
                
                // Extract table references from the view definition
                const viewTableRefs = extractTableReferences(viewResult.definition);
                
                // If no table references found in view definition, return 0 bytes but mark as having metadata
                // so the user sees "0 bytes" rather than hiding the estimate
                if (viewTableRefs.length === 0) {
                  return { bytes: 0, hasMetadata: true };
                }
                
                let viewTotalBytes = 0;
                let viewHasMetadata = false;
                
                // Recursively get sizes for all tables referenced in the view
                for (const ref of viewTableRefs) {
                  const result = await getTableOrViewSize(ref.datasetId, ref.tableId, visitedViews);
                  if (result.error) {
                    // Propagate the first error encountered
                    return result;
                  }
                  if (result.hasMetadata) {
                    viewTotalBytes += result.bytes;
                    viewHasMetadata = true;
                  }
                }
                
                // If we successfully processed a view, always mark as having metadata
                // so the estimate is shown (even if 0 bytes)
                return { bytes: viewTotalBytes, hasMetadata: true };
              }
            } catch {
              // Not a view, or view definition couldn't be fetched
              // This is normal for empty tables, just return no bytes
            }
            
            // Regular table with no data, or couldn't determine view definition
            return { bytes: 0, hasMetadata: schemaResult.metadata?.numBytes !== undefined };
          } catch (err: any) {
            // Handle table not found errors - will be processed below
            throw err;
          }
        };

        // Fetch metadata for each table/view and sum up numBytes
        // This includes all tables from FROM and JOIN clauses
        let totalBytes = 0;
        let hasMetadata = false;
        let tableNotFoundError: { message: string; tableRef: string } | null = null;
        // Track visited views to prevent infinite loops when views reference each other
        const visitedViews = new Set<string>();

        for (const { datasetId, tableId } of tableRefs) {
          try {
            const result = await getTableOrViewSize(datasetId, tableId, visitedViews);
            if (result.error) {
              tableNotFoundError = result.error;
              break;
            }
            if (result.hasMetadata) {
              totalBytes += result.bytes;
              hasMetadata = true;
            }
          } catch (err: any) {
            // Electron IPC wraps errors, so we need to extract the actual error
            // The error structure can be:
            // 1. Direct error object with code/message/details
            // 2. Error object with nested details
            // 3. Error message string containing "[object Object]" that needs parsing
            
            let actualError = err;
            let errorCode: string | undefined;
            let errorMessage: string = '';
            let errorDetails: any = null;
            
            // Try to extract the actual error from Electron IPC wrapper
            // Electron IPC errors often have the real error nested in various places
            if (err instanceof Error) {
              errorMessage = err.message;
              // Check if message contains "[object Object]" - means nested error
              if (errorMessage.includes('[object Object]')) {
                // Try to get the actual error from various possible locations
                actualError = (err as any).cause || (err as any).details || (err as any).error || err;
              } else {
                actualError = err;
              }
            } else if (typeof err === 'object' && err !== null) {
              actualError = err;
            }
            
            // Extract error properties from the actual error object
            // Try multiple possible locations for the error code and message
            // The error thrown from main process is: { code: 'BIGQUERY_ERROR', message: 'Table not found', details: '...' }
            // But Electron IPC wraps it, so we need to check the error object itself
            errorCode = actualError?.code || 
                       (actualError as any)?.error?.code ||
                       (err as any)?.code;
            
            // Check if errorMessage is just "[object Object]" - if so, try to get real message from error object
            if (!errorMessage || errorMessage.includes('[object Object]')) {
              errorMessage = actualError?.message || 
                            (actualError as any)?.error?.message || 
                            (actualError as any)?.details?.message ||
                            (err as any)?.message ||
                            '';
            }
            
            // For errorDetails, check if it's the actual error object or a string
            errorDetails = actualError?.details || 
                          (actualError as any)?.error?.details ||
                          (actualError as any)?.error ||
                          actualError?.message || 
                          errorMessage;
            
            // If errorDetails is still "[object Object]", the actual error might be in err itself
            if (String(errorDetails).includes('[object Object]')) {
              // Try to access the error properties directly from err
              if ((err as any)?.code) errorCode = (err as any).code;
              if ((err as any)?.message && !(err as any).message.includes('[object Object]')) {
                errorMessage = (err as any).message;
              }
              if ((err as any)?.details) {
                errorDetails = (err as any).details;
              }
            }
            
            // If we still have "[object Object]", try to extract nested error properties
            if (errorMessage.includes('[object Object]') || String(errorDetails).includes('[object Object]')) {
              try {
                // Try to access nested error properties directly
                // Electron IPC might nest the error in different ways
                const nestedError = (actualError as any)?.error || 
                                   (actualError as any)?.details ||
                                   (actualError as any)?.cause ||
                                   actualError;
                
                if (nestedError && nestedError !== actualError) {
                  errorCode = nestedError?.code;
                  errorMessage = nestedError?.message || errorMessage;
                  errorDetails = nestedError?.details || nestedError?.message || errorMessage;
                }
                
                // Try to stringify to see the structure
                try {
                  const errorStr = JSON.stringify(actualError, null, 2);
                  const parsed = JSON.parse(errorStr);
                  if (parsed.error || parsed.details) {
                    const extracted = parsed.error || parsed.details;
                    errorCode = extracted?.code || errorCode;
                    errorMessage = extracted?.message || errorMessage;
                    errorDetails = extracted?.details || extracted?.message || errorMessage;
                  }
                } catch (e) {
                  // Silently handle stringify errors
                }
              } catch (e) {
                // Silently handle extraction errors
              }
            }
            
            // If errorDetails is an object, try to extract message from it
            if (typeof errorDetails === 'object' && errorDetails !== null) {
              if (errorDetails.message) {
                errorMessage = errorDetails.message;
                errorDetails = errorDetails.message;
              } else if (Array.isArray(errorDetails) && errorDetails.length > 0) {
                const firstDetail = errorDetails[0];
                if (typeof firstDetail === 'object' && firstDetail.message) {
                  errorMessage = firstDetail.message;
                  errorDetails = firstDetail.message;
                } else if (typeof firstDetail === 'string') {
                  errorMessage = firstDetail;
                  errorDetails = firstDetail;
                }
              } else {
                // Try to stringify to get readable error
                try {
                  errorDetails = JSON.stringify(errorDetails);
                } catch {
                  errorDetails = String(errorDetails);
                }
              }
            }
            
            // Convert errorDetails to string for checking
            const errorDetailsStr = typeof errorDetails === 'string' ? errorDetails : String(errorDetails);
            const errorMessageStr = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
            
            // Check for table not found error - can be identified by:
            // 1. code === 'BIGQUERY_ERROR' and message === 'Table not found'
            // 2. message/details containing 'Table not found' or 'Not found: Table'
            // 3. error code 404 (BigQuery returns 404 for not found)
            // 4. Check error object properties directly (even if message is "[object Object]")
            // 5. If error is from getTableSchema and contains "[object Object]", it's likely table not found
            const actualErrorCode = actualError?.code || (err as any)?.code;
            const actualErrorMessage = actualError?.message || (err as any)?.message || errorMessageStr;
            
            // Check if this is an IPC error from getTableSchema - if so, check error properties
            const isGetTableSchemaError = errorMessageStr.includes('bigquery:getTableSchema');
            
            // Check both the extracted strings and the error object properties directly
            const isTableNotFound = 
              (errorCode === 'BIGQUERY_ERROR' && errorMessageStr === 'Table not found') ||
              (actualErrorCode === 'BIGQUERY_ERROR' && actualErrorMessage === 'Table not found') ||
              (errorMessageStr.includes('Table not found')) ||
              (errorMessageStr.includes('Not found: Table')) ||
              (actualErrorMessage.includes('Table not found')) ||
              (actualErrorMessage.includes('Not found: Table')) ||
              (errorDetailsStr.includes('Table not found')) ||
              (errorDetailsStr.includes('Not found: Table')) ||
              (actualErrorCode === 404 || actualErrorCode === '404') ||
              ((err as any)?.code === 404) ||
              // Fallback: if it's a getTableSchema error and we can't extract details, assume table not found
              (isGetTableSchemaError && errorMessageStr.includes('[object Object]'));
            
            if (isTableNotFound) {
              const tableRef = `${datasetId}.${tableId}`;
              // Extract table name from error details if available
              let displayMessage = `Table not found: ${tableRef}`;
              
              // Try to extract the full table reference from error details
              const fullMatch = errorDetailsStr.match(/Not found: Table ([^\s]+)/);
              if (fullMatch) {
                displayMessage = `Table not found: ${fullMatch[1]}`;
              } else {
                // Try to extract from project.dataset.table format in error message
                const tableMatch = errorMessageStr.match(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/);
                if (tableMatch) {
                  displayMessage = `Table not found: ${tableMatch[1]}`;
                }
              }
              
              tableNotFoundError = {
                message: displayMessage,
                tableRef,
              };
              // Break on first table not found error to show it in status bar
              break;
            } else {
              // Silently skip other errors (permissions, etc.)
              console.debug(`Could not fetch metadata for ${datasetId}.${tableId}:`, {
                err,
                errorCode,
                errorMessage: errorMessageStr,
                errorDetails: errorDetailsStr,
              });
            }
          }
        }

        // If a table was not found, update SQL validation status to show error
        if (tableNotFoundError) {
          setSqlValidationStatus((prev) => {
            // Only set table not found error if SQL syntax is valid (syntax errors take precedence)
            if (prev.isValid === true || prev.isValid === null) {
              return {
                isValid: false,
                errorMessage: tableNotFoundError.message,
              };
            }
            // Keep syntax error if it exists
            return prev;
          });
          setExpectedQuerySize(null);
        } else {
          // Clear any previous table not found errors if all tables are valid
          setSqlValidationStatus((prev) => {
            // Only clear if the current error is a table not found error
            if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
              // Clear table not found error, restore to valid if syntax was valid
              return { isValid: true, errorMessage: null };
            }
            // Keep other errors (syntax errors)
            return prev;
          });
          setExpectedQuerySize(hasMetadata ? totalBytes : null);
        }
      } catch (err) {
        console.error('Failed to calculate expected query size:', err);
        setExpectedQuerySize(null);
      } finally {
        setIsLoadingQuerySize(false);
      }
    };

    // Debounce calculation to avoid excessive API calls
    const timeoutId = setTimeout(calculateExpectedQuerySize, 500);
    return () => clearTimeout(timeoutId);
  }, [queryText, selectedText, isConnected, connection?.projectId, sqlValidationStatus.isValid]);

  // Listen for table reference insertion from DatasetTree
  useEffect(() => {
    const handleInsertTableReference = (event: CustomEvent) => {
      if (activeTab) {
        const tableRef = event.detail as string;
        const currentText = activeTab.queryText || '';
        const newText = currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + tableRef + ' ';
        setTabQuery(activeTab.id, newText);
        
        // Focus editor and move cursor to end
        if (editorRef.current) {
          editorRef.current.focus();
          const model = editorRef.current.getModel();
          if (model) {
            const lineCount = model.getLineCount();
            const lastLineLength = model.getLineLength(lineCount);
            editorRef.current.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
          }
        }
      }
    };

    window.addEventListener('insertTableReference', handleInsertTableReference as EventListener);
    return () => {
      window.removeEventListener('insertTableReference', handleInsertTableReference as EventListener);
    };
  }, [activeTab, setTabQuery]);

  return (
    <div className="query-editor">
      <div className="query-editor-toolbar">
        <button onClick={handleExecute} disabled={shouldDisableRunButton} className="run-button">
          {isExecuting ? 'Executing...' : (
            <>
              Run <span className="arrow-icon">→</span>
            </>
          )}
        </button>
        {isExecuting && <button onClick={handleCancel} className="cancel-button">Cancel</button>}
        <button
          onClick={handleFormat}
          disabled={!activeTab || !queryText.trim()}
          className="format-button"
          title="Format SQL query"
        >
          Format
        </button>
        <button
          onClick={handleExpandSelectStar}
          disabled={!activeTab || !queryText.trim() || !isConnected}
          className="expand-button"
          title="Expand SELECT * to columns (Cmd+B / Ctrl+B)"
        >
          Expand *
        </button>
        {connection?.enableDbtSupport && (
          <button
            onClick={handleDbtify}
            disabled={!activeTab || !queryText.trim() || (!hasDbtSyntax && sqlValidationStatus.isValid !== true)}
            className="dbtify-button"
            title={hasDbtSyntax ? "Convert dbt source/ref syntax back to BigQuery table references" : "Convert table references to dbt source syntax"}
          >
            {hasDbtSyntax ? 'de-dbtify' : 'dbtify'}
          </button>
        )}
        <button onClick={handleOpenSaveDialog} disabled={!activeTab || !queryText.trim()} className="save-button">
          {activeTab?.savedQueryId ? 'Update' : 'Save'}
        </button>
        {!isConnected && <span className="connection-warning">Not connected</span>}
      </div>
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{activeTab?.savedQueryId ? 'Update Query' : 'Save Query'}</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Query name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button onClick={handleSave} disabled={!saveName.trim()}>
                {activeTab?.savedQueryId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="editor-container">
        {activeTab ? (
          <>
            <div className="editor-wrapper" ref={editorWrapperRef}>
              <Editor
                height={`${editorHeight}px`}
                defaultLanguage="sql"
                theme="vs-dark"
                value={queryText}
                onChange={handleQueryChange}
              beforeMount={(monaco) => {
                // Register BigQuery language support before editor mounts
                // Provide a function to get the current project ID
                const getProjectId = () => {
                  const currentConnection = useConnectionStore.getState().connection;
                  return currentConnection?.projectId || null;
                };
                
                // Store project ID getter on window for completion provider
                (window as any).__bigqueryGetProjectId = getProjectId;
                
                // Set metadata store getter for completion provider
                setMetadataStoreGetter(() => useBigQueryMetadataStore.getState());
                
                registerBigQueryLanguage(monaco as typeof import('monaco-editor'), getProjectId);
              }}
              onMount={(editor) => {
                editorRef.current = editor;
                
                // Add keyboard shortcut for running query (Cmd+Enter on Mac, Ctrl+Enter on Windows/Linux)
                editor.addCommand(
                  (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.Enter,
                  () => {
                    if (executeHandlerRef.current) {
                      executeHandlerRef.current();
                    }
                  }
                );

                // Add keyboard shortcut for expanding SELECT * (Cmd+B on Mac, Ctrl+B on Windows/Linux)
                editor.addCommand(
                  (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyB,
                  () => {
                    if (expandSelectStarHandlerRef.current) {
                      expandSelectStarHandlerRef.current();
                    }
                  }
                );

                // Listen for selection changes to re-validate
                editor.onMouseDown(() => {
                  isMouseSelectingRef.current = true;
                  if (selectionValidationTimeoutRef.current !== null) {
                    window.clearTimeout(selectionValidationTimeoutRef.current);
                    selectionValidationTimeoutRef.current = null;
                  }
                });

                editor.onMouseUp(() => {
                  isMouseSelectingRef.current = false;
                  scheduleSelectionValidation(200);
                  // Update selected text state
                  const selection = editor.getSelection();
                  const model = editor.getModel();
                  if (selection && !selection.isEmpty() && model) {
                    setSelectedText(model.getValueInRange(selection));
                  } else {
                    setSelectedText('');
                  }
                });

                editor.onDidChangeCursorSelection(() => {
                  if (isMouseSelectingRef.current) {
                    return;
                  }
                  scheduleSelectionValidation();
                  // Update selected text state
                  const selection = editor.getSelection();
                  const model = editor.getModel();
                  if (selection && !selection.isEmpty() && model) {
                    setSelectedText(model.getValueInRange(selection));
                  } else {
                    setSelectedText('');
                  }
                });
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggestSelection: 'first',
                tabCompletion: 'on',
                hover: {
                  enabled: true,
                  delay: 300,
                  sticky: true,
                },
                // Ensure tooltips can render above the editor
                fixedOverflowWidgets: true,
                // Enable glyph margin for error indicators
                glyphMargin: true,
              }}
              />
            </div>
            <div className="editor-status-bar">
              <div className="status-left">
                {completedQueryText !== null && queryText === completedQueryText ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    Query completed{completedQueryExecutionTime !== null ? ` in ${formatExecutionTime(completedQueryExecutionTime)}` : ''}
                  </span>
                ) : sqlValidationStatus.isValid === null ? (
                  <span className="status-text">✦ Type a query to get started</span>
                ) : sqlValidationStatus.isValid ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    SQL Syntax is valid
                  </span>
                ) : (
                  <span className="status-text status-invalid">
                    <span className="status-indicator status-indicator-invalid"></span>
                    <span className="status-error-message">{sqlValidationStatus.errorMessage || 'SQL syntax error'}</span>
                  </span>
                )}
              </div>
              {expectedQuerySize !== null && (
                <div className="status-right">
                  <span className="status-text">
                    Estimated query size: {formatBytes(expectedQuerySize)}
                  </span>
                </div>
              )}
              {isLoadingQuerySize && expectedQuerySize === null && (
                <div className="status-right">
                  <span className="status-text">Calculating query size...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-tab-message">No active tab</div>
        )}
      </div>
    </div>
  );
};
````
