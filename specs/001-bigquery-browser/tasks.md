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

