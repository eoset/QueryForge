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

