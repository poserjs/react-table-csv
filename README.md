# ReactTableCSV

ReactTableCSV is a lightweight React component for exploring tabular data with a rich, spreadsheet‑like UI. It parses CSV (via PapaParse), renders a flexible table, and supports filtering, multi‑column sorting, grouping with reducers, pinning, splitting, per‑column styling, row numbers, and persistent settings (export/import/localStorage). It also ships with an optional dashboard wrapper powered by `duckdb-wasm` to query one or more datasets (or attached DuckDB database files) and render multiple views.

## Key Features
- CSV parsing with PapaParse (`header: true`, numeric typing, BOM/Excel‑friendly export).
- Filters: substring and operator filters (`>`, `<`, `>=`, `<=`, `=`, `<>`) with per‑column type (auto/text/number).
- Sorting: multi‑column (text/number) via Settings or header toggles.
- Grouping: group by selected columns, reduce others via reducers:
  - Counts: `cnt` (non-empty only), `rowcnt` (all rows), `unique cnt` (non-empty unique), `unique rowcnt` (all unique)
  - Aggregates: `sum`, `avg`, `min`, `max`, `min - max`, `concat`, `unique concat`, `first`, `last`.
- Column pinning (sticky), drag re‑ordering, hide/show, width, alignment, text/background color, bold, nowrap.
- Column resizing with a drag handle on headers when Customize mode is on. Widths persist in settings.
- Split tables by selected columns (one table per unique combination) with filters rendered on the first split table.
- Row numbers (resets per table) and stable internal row IDs for React keys.
- Settings: export/import JSON (with clipboard copy and a modal to copy manually), autosave to `localStorage`, Copy URL with embedded `defaultSetting` query param.
- Themes: lite, dark, solarized, dracula, monokai, and gruvbox (local CSS Modules; no Tailwind dependency).
- Optional dashboard mode with multiple datasets and SQL views via `duckdb-wasm` (and support for attaching external DuckDB database files).
- Safer layout defaults: a minimum component width is enforced; Max‑width accepts `px`, `%`, and `vh` units.
- Dashboard layout packs multiple tables per row when limited widths are provided, or uses full width for `unlimited`.

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
        defaultSettings={{ theme: "lite", showFilterRow: true }}
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
Use `ReactDashboardCSV` to register one or more CSV datasets and define views that render as tables. Dataset keys become DuckDB table names. Whole DuckDB database files can also be attached via the `dbs` prop and referenced in SQL using the provided keys as database names.

Set `db` to `'duckdb'` (default) to enable SQL queries via `duckdb-wasm`, or `'none'` to render datasets directly without DuckDB.

Peer dependency: `@duckdb/duckdb-wasm` (installed by the app). The component handles multiple versions of the API.

```jsx
import { ReactDashboardCSV } from "@poserjs/react-table-csv";

export default function Page() {
  return (
    <ReactDashboardCSV
      db="duckdb" // or 'none'
      layout={[2, 1]} // optional: number of tables per row
      dbs={{
        stats: { dbURL: "/stats.duckdb" },
      }}
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
          props: { downloadFilename: "capitals-by-initial.csv", defaultSettings: { tableMaxWidth: "480px" } },
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

## ReactTableCSV Props
- `csvString?: string` CSV text to render.
- `csvURL?: string` URL to fetch CSV data from. Non-OK responses surface an error with the HTTP status and message.
- `csvData?: object` Result of `Papa.parse` (`{ data, meta: { fields } }`) to use directly.
  One of `csvString`, `csvURL`, or `csvData` must be provided.
- `downloadFilename?: string` Filename for exports. Default `"data.csv"`.
- `storageKey?: string` localStorage key for settings. Default `"react-table-csv-key"`.
- `defaultSettings?: string | object` Either a JSON string or a plain object with the same schema as exported settings. Used as defaults and as fallback if localStorage is missing/corrupt.
- `title?: string` Optional title displayed in a themed header above the table.
- `collapsed?: boolean` Render the table initially collapsed with a toggle in the header.
- `maxHeight?: string` Limit table height (e.g., `'400px'`, `'50vh'`). Use `'unlimited'` for no limit.
- `maxWidth?: string` Limit table width (e.g., `'400px'`, `'80%'`). Use `'unlimited'` for no limit.
- `fontSize?: number` Font size for table values in pixels. Default `13`.
- Theme selection is managed inside the component's settings. Use the Settings panel to cycle themes; the current theme is saved to `localStorage` and included when exporting settings.

## ReactDashboardCSV Props
- `datasets?: Record<string, { title?: string; csvURL?: string; csvString?: string; csvData?: any; format?: { type?: 'csv' | 'json'; header?: boolean; separator?: string; escape?: string; columns?: string[] } }>`
  - One of `csvURL`, `csvString`, or `csvData` must be set for each dataset.
  - `format` defaults to CSV with `header: true`, `separator: ','`, and `escape: '"'`. When `header` is `false`, provide `columns` names.
- `dbs?: Record<string, { title?: string; dbURL: string }>`
  - Attach external DuckDB database files by URL. The key becomes the database name for queries, e.g. `stats.my_table`.
- `views?: Record<string, { title?: string; sql?: string; dataset?: string; props?: ReactTableCSVProps }>`
  - With `db="duckdb"` (default): each view runs its `sql` against the registered datasets and renders a table. If `sql` is omitted, the view shows `SELECT *` from the specified `dataset`, or from the only dataset if exactly one is provided.
  - With `db="none"`: DuckDB is not loaded. Each view must reference a `dataset` (or the only dataset is used) and the component passes that dataset directly to `ReactTableCSV` (via `csvURL`, `csvString`, or `csvData`). In this mode, omit `sql`.
  - Optional `title` shows above the table; optional `collapsed` renders the view initially collapsed with a toggle.
- `layout?: number[]` Optional array indicating how many views to place per row, e.g., `[2, 1, 3]`. Extra views beyond the array are rendered one per row.

## Exported/Imported Settings (high‑level)
- `{ version, theme, columnStyles, columnOrder, hiddenColumns, filters, dropdownFilters, filterMode, showFilterRow, pinnedAnchor, showRowNumbers, customize, tableMaxHeight, tableMaxWidth, fontSize }`

Notes about settings
- Settings export attempts to copy to clipboard and also opens a modal with the JSON so the value can be read or copied manually.
- Settings used in `defaultSettings` can be provided as a string or as a plain object.
- Entering Customize mode automatically shows the Settings panel.

## Resetting Settings
Call `resetSettings()` to revert the table to its initial configuration. The reset also turns off customize mode (or respects a `customize` value from provided defaults) and returns the applied settings object.

## Development
See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details.

## License
Licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
