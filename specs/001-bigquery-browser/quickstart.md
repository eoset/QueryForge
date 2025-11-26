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

