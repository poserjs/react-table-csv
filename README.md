# ReactTableCSV

A React component for exploring CSV data with a rich, spreadsheet‑like UI. It parses CSV (via PapaParse), renders a flexible table, and supports filtering, multi‑column sorting, grouping with reducers, column pinning, split views, per‑column styling, row numbers, and persistent settings (export/import/localStorage). It also provides an optional dashboard wrapper powered by `duckdb-wasm` for querying one or more CSV datasets and rendering multiple views.

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
- Optional dashboard mode with multiple datasets and SQL views via `duckdb-wasm`.

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

### Dashboard Mode (duckdb-wasm or none)
Use `ReactDashboardCSV` to register one or more CSV datasets and define views that render as tables. Dataset keys become DuckDB table names.

Set `db` to `'duckdb'` (default) to enable SQL queries via `duckdb-wasm`, or `'none'` to render datasets directly without DuckDB.

Peer dependency: `@duckdb/duckdb-wasm` (installed by the app). The component handles multiple versions of the API.

```jsx
import { ReactDashboardCSV } from "@poserjs/react-table-csv";

export default function Page() {
  return (
    <ReactDashboardCSV
      db="duckdb" // or 'none'
      datasets={{
        capitals: { title: "US State Capitals", csvURL: "/us-state-capitals.csv", format: { type: 'csv', header: true } },
        cities:   { title: "US Cities (multi‑year)", csvURL: "/us-cities-top-1k-multi-year.csv", format: { type: 'csv', header: true } },
        // Or: raw CSV string
        // inlineData: { csvString: "col1,col2\nA,1\nB,2" },
        // Or: pre-parsed data (Papa.parse result or { headers, data })
        // preParsed: { csvData: { headers: ["A","B"], data: [{ A: 1, B: 2 }] } },
      }}
      views={{
        byInitial: {
          title: "States by Initial",
          sql: `SELECT substr(t.state,1,1) AS Initial, t.state AS StateName, t.capital AS CapitalCity FROM capitals AS t ORDER BY 1, 2`,
          props: { downloadFilename: "capitals-by-initial.csv" },
        },
        topCities2014: {
          title: "Top US Cities by Population (2014)",
          sql: `SELECT State, City, year AS Year, Population FROM cities WHERE year = 2014 ORDER BY Population DESC LIMIT 15`,
          props: { /* any ReactTableCSV props */ },
        },
      }}
    />
  );
}
```

Notes
- Datasets: exactly one of `csvURL`, `csvString`, or `csvData` should be provided per dataset.
- Dataset keys are used as DuckDB table names in SQL; quote if using special characters, e.g. `SELECT * FROM "my-table"`.
- The dashboard normalizes DuckDB proxy rows using `toJSON()` internally and serializes Date values to ISO strings for stable display/export.

## Props
- `csvString?: string` CSV text to render.
- `csvURL?: string` URL to fetch CSV data from. Non-OK responses surface an error with the HTTP status and message.
- `csvData?: object` Result of `Papa.parse` (`{ data, meta: { fields } }`) to use directly.
  One of `csvString`, `csvURL`, or `csvData` must be provided.
- `downloadFilename?: string` Filename for exports. Default `"data.csv"`.
- `storageKey?: string` localStorage key for settings. Default `"react-table-csv-key"`.
- `defaultSettings?: string` JSON string (same schema as exported) used as defaults and fallback if localStorage is missing/corrupt.
- `title?: string` Optional title displayed in a themed header above the table.
- `collapsed?: boolean` Render the table initially collapsed with a toggle in the header.
- `maxHeight?: string` Limit table height (e.g., `'400px'`, `'50vh'`). Use `'unlimited'` for no limit.
- `maxWidth?: string` Limit table width (e.g., `'400px'`, `'80%'`). Use `'unlimited'` for no limit.
- `fontSize?: number` Font size for table values in pixels. Default `13`.
- Theme selection is managed inside the component's settings. Use the Settings panel to cycle themes; the current theme is saved to `localStorage` and included when exporting settings.

### ReactDashboardCSV Props
- `datasets?: Record<string, { title?: string; csvURL?: string; csvString?: string; csvData?: any; format?: { type?: 'csv' | 'json'; header?: boolean; separator?: string; escape?: string; columns?: string[] } }>`
  - One of `csvURL`, `csvString`, or `csvData` must be set for each dataset.
  - `format` defaults to CSV with `header: true`, `separator: ','`, and `escape: '"'`. When `header` is `false`, provide `columns` names.
- `views?: Record<string, { title?: string; sql?: string; dataset?: string; props?: ReactTableCSVProps }>`
  - With `db="duckdb"` (default): each view runs its `sql` against the registered datasets and renders a table. If `sql` is omitted, the view shows `SELECT *` from the specified `dataset`, or from the only dataset if exactly one is provided.
  - With `db="none"`: DuckDB is not loaded. Each view must reference a `dataset` (or the only dataset is used) and the component passes that dataset directly to `ReactTableCSV` (via `csvURL`, `csvString`, or `csvData`). In this mode, omit `sql`.
  - Optional `title` shows above the table; optional `collapsed` renders the view initially collapsed with a toggle.

## Exported/Imported Settings (high‑level)
- `{ version, theme, columnStyles, columnOrder, hiddenColumns, filters, dropdownFilters, filterMode, showFilterRow, pinnedAnchor, showRowNumbers, customize, tableMaxHeight, tableMaxWidth, fontSize }`

## Resetting Settings
Call `resetSettings()` to revert the table to its initial configuration. The reset also turns off customize mode (or respects a `customize` value from provided defaults) and returns the applied settings object.

## Development
See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details.

## License
Licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
