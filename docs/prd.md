# React Table CSV Product Requirements

## Overview
React Table CSV is a React component for viewing and manipulating CSV data in-browser. It offers filtering, sorting, grouping, column management, styling, and export utilities to explore structured datasets without a backend.

## Props
- **csvString** (`string`): CSV content to render. Defaults to an embedded sample dataset.
- **downloadFilename** (`string`): Suggested filename for exported CSV downloads.
- **storageKey** (`string`): `localStorage` key used for persisting user settings.
- **defaultSettings** (`string`): Optional JSON string with initial settings to apply on load.

## Data Handling
- CSV parsing uses PapaParse with header detection, dynamic typing, and value trimming.
- Each row receives a stable `_id` for keying.

## Table Features
### Display
- Renders a table for all columns and rows in the parsed CSV.
- Columns are reorderable via drag-and-drop.
- Columns can be hidden or restored from a "Hidden Columns" list.
- Optional row numbers column.
- Columns can be pinned to stay on the left.

### Filtering
- Toggleable filter row beneath headers.
- Text filters support comparison operators (`>`, `<`, `>=`, `<=`, `=`, `<>`).
- Dropdown filters provide searchable, multi-select value lists per column.
- Filters can be cleared or persisted through settings.

### Sorting
- Multi-column sorting with modes: `up`, `down`, `up numbers`, `down numbers`.
- Sorting state is stored per column and applied to table view and CSV export.

### Grouping & Aggregation
- Columns can be marked for grouping, collapsing rows that share the same grouped values.
- Supported reducer functions per column: `first`, `last`, `cnt`, `rowcnt`, `unique cnt`, `unique rowcnt`, `sum`, `avg`, `min`, `max`, `min-max`, `concat`, `unique concat`.

### Split Tables
- Columns can split the dataset into multiple tables based on unique value combinations.

### Column Styling
- Per-column controls for:
  - Text color and background color (with transparent reset).
  - Bold toggle.
  - Alignment (left, center, right).
  - Width with `px` or `%` units.
  - No-wrap option.
  - Data type hint (`auto`, `text`, `number`).
  - Number formatting (`int`, `fixed2`, `thousand`, `thousand2`, `currency`, `currency-red`, `currency-paren-red`, `paren-red`, `general`).

### Row Numbers
- Option to display sequential row numbers.

## Settings Management
- User configuration includes column order, visibility, filters, dropdown selections, filter modes, style settings, pinned columns, row numbers, and customize mode.
- Settings auto-save to `localStorage` under `storageKey`.
- Export settings to clipboard as JSON, import from JSON prompt, or reset to defaults.
- Generate shareable URL containing serialized settings.

## CSV Export
- Exports the current view (visible columns, applied filters, sorts, and grouping) as a CSV file.
- Output includes UTF-8 BOM and CRLF line endings for compatibility.

## Customize Mode
- A "Customize" checkbox toggles advanced controls like filter row, style panel, settings management, and pinning.

## Non-Functional Requirements
- Implemented in React with CSS Modules.
- Relies on PapaParse for CSV parsing and Intl APIs for number formatting.
- All interactions occur client-side with no server dependency.

