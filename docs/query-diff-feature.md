# Query Diff / Compare Feature

## Overview
The Query Diff feature allows you to compare two SQL queries side-by-side using Monaco's built-in diff editor. This is useful for:
- Debugging changes between query versions
- Reviewing modifications before saving
- Understanding differences between saved queries or examples

## Usage

### Access Points

#### 1. Keyboard Shortcut
Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux) to open the Compare Queries dialog.

#### 2. Saved Queries Context Menu
1. Navigate to the "Saved Queries" sidebar
2. Right-click on any saved query
3. Select "Compare with..."
4. The left side will be pre-populated with the selected saved query

#### 3. Tab Context Menu
1. Click the dropdown arrow (▾) on any tab in the tab bar
2. Select "Compare with Another Tab"
3. The left side will be pre-populated with the selected tab's query

#### 4. Menu Bar
1. Navigate to Edit menu
2. Click "Compare Queries..."

## Features

### Source Selection
Choose what to compare from three source types:
- **Tab**: Compare queries from open tabs
- **Saved Query**: Compare saved queries from your library
- **Clipboard**: Paste and compare query text from your clipboard

### View Modes
- **Side-by-Side (default)**: Traditional two-pane diff layout showing changes side-by-side
- **Inline**: Single pane with additions/deletions highlighted inline

### Options
- **Swap Sides (⇄)**: Quickly toggle left ↔ right sides
- **Ignore Whitespace**: Toggle visibility of whitespace-only changes
- **Copy Left to New Tab**: Copy the left query to a new editor tab
- **Copy Right to New Tab**: Copy the right query to a new editor tab

### Syntax Highlighting
SQL syntax highlighting is preserved in both diff views, making it easy to read and understand the differences.

## Tips

1. **Comparing tab versions**: Use the compare feature to see what changed in a query before saving
2. **Learning from examples**: Compare your query with a saved example to understand best practices
3. **Debugging**: Quickly spot differences when a query that used to work now fails
4. **Keyboard navigation**: Use `Escape` to close the diff modal at any time

## Technical Details

- Built using `@monaco-editor/react` DiffEditor component
- Supports all Monaco editor themes configured in QueryForge
- Read-only view (editing is done in the main editor tabs)
- Automatically adapts to dark/light themes
