# QueryForge

A desktop application for browsing and querying Google Cloud Platform BigQuery data. Built with Electron, React, and TypeScript.

## Features

- **Connect to BigQuery**: Configure connection using service account credentials or application default credentials
- **Execute Queries**: Write and execute SQL queries with syntax highlighting
- **Multiple Tabs**: Work with multiple queries simultaneously in separate tabs
- **Save Queries**: Save frequently used queries locally for reuse
- **Query Management**: Search, update, and delete saved queries

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account with BigQuery API enabled
- GCP project with BigQuery access
- Service account key file (JSON) OR Application Default Credentials configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bq_browser
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
2. Click "Execute" or use keyboard shortcut
3. View results in the table below
4. Use "Cancel" to stop a running query

### Managing Tabs

- Click "+" button to create a new tab
- Click on a tab to switch between queries
- Click "×" on a tab to close it
- Modified tabs show a blue dot indicator

### Saving Queries

1. Write your query in the editor
2. Click "Save" button
3. Enter a name and optional description
4. Click "Save" to persist the query

### Loading Saved Queries

1. Click "Saved Queries" in the header
2. Search or browse your saved queries
3. Click "Load" to open a query in a new tab
4. Click "Delete" to remove a saved query

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

## License

MIT

