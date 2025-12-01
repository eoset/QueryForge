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
- **Dark/Light Mode**: Toggle between dark and light themes to suit your preference

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

