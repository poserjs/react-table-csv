# ReactTableCSV

A React component for exploring CSV data with a rich, spreadsheet‑like UI. It parses CSV (via PapaParse), renders a flexible table, and supports filtering, multi‑column sorting, grouping with reducers, column pinning, split views, per‑column styling, row numbers, and persistent settings (export/import/localStorage).

## Key Features
- CSV parsing with PapaParse (`header: true`, numeric typing, BOM/Excel friendly export).
- Filters: substring and operator filters (`>`, `<`, `>=`, `<=`, `=`, `<>`) with per-column type (auto/text/number).
- Sorting: multi-column (text/number) via Settings or header toggles.
- Grouping: group by selected columns, reduce others via reducers:
  - Counts: `cnt` (non-empty only), `rowcnt` (all rows), `unique cnt` (non-empty unique), `unique rowcnt` (all unique)
  - Aggregates: `sum`, `avg`, `min`, `max`, `min - max`, `concat`, `unique concat`, `first`, `last`.
- Column pinning (sticky), drag re-ordering, hide/show, width, align, text/background color, bold, nowrap.
- Split tables by selected columns (one table per unique combination) with filters rendered on the first split table.
- Row numbers (resets per table) and stable internal row IDs for React keys.
- Settings: export/import JSON, autosave to `localStorage`, Copy URL with embedded `defaultSetting` query param.
- lite, dark, solarized, dracula, monokai, and gruvbox themes using local CSS Modules (no Tailwind dependency).

## Using the Component in Your App

### Usage (Next.js App Router example)
```jsx
"use client";
import React from "react";
import { ReactTableCSV } from "@poserjs/react-table-csv";

const csv = `Name,Department,Salary\nAlice,Engineering,120000\nBob,Sales,90000`;

export default function Page() {
  return (
    <main>
      <ReactTableCSV
        csvString={csv}
        downloadFilename="data.csv"
        storageKey="react-table-csv-key"
        defaultSettings=""
      />
    </main>
  );
}

// Load from a remote file
// <ReactTableCSV csvURL="/path/to/data.csv" />

// Or pass pre-parsed PapaParse output
// const parsed = Papa.parse(csvText, { header: true });
// <ReactTableCSV csvData={parsed} />
```

## Props
- `csvString?: string` CSV text to render.
- `csvURL?: string` URL to fetch CSV data from. Non-OK responses surface an error with the HTTP status and message.
- `csvData?: object` Result of `Papa.parse` (`{ data, meta: { fields } }`) to use directly.
  One of `csvString`, `csvURL`, or `csvData` must be provided.
- `downloadFilename?: string` Filename for exports. Default `"data.csv"`.
- `storageKey?: string` localStorage key for settings. Default `"react-table-csv-key"`.
- `defaultSettings?: string` JSON string (same schema as exported) used as defaults and fallback if localStorage is missing/corrupt.
- Theme selection is managed inside the component's settings. Use the Settings panel to cycle themes; the current theme is saved to `localStorage` and included when exporting settings.

## Exported/Imported Settings (high‑level)
- `{ version, theme, columnStyles, columnOrder, hiddenColumns, filters, dropdownFilters, filterMode, showFilterRow, pinnedAnchor, showRowNumbers, customize }`

## Resetting Settings
Call `resetSettings()` to revert the table to its initial configuration. The reset also turns off customize mode (or respects a `customize` value from provided defaults) and returns the applied settings object.

## Development
See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details.

## License
Licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
