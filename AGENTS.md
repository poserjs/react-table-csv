# Repository Guidelines

## Project Structure & Module Organization
- `src/` – component source (framework‑agnostic)
  - `src/ReactTableCsv.jsx`
  - `src/ReactTableCsv.module.css`
- `demo/` – Next.js demo (App Router) for local testing and showcasing
  - `demo/app/**/*` pages and layout
  - `demo/package.json` (scripts: `dev`, `build`, `start`, `lint`)

## Build, Lint, and Demo Commands
- Run the Next.js demo (recommended):
  - `cd demo && npm install`
  - Dev: `npm run dev` (http://localhost:3000)
  - Lint: `npm run lint`
  - Prod build: `npm run build` then `npm start`
- Component source (src/) build: not required — the component is plain JSX/CSS and can be imported directly.
- Lint src/ (optional):
  - If ESLint is available: `npx eslint "src/**/*.{js,jsx}" --max-warnings=0`
  - Or add a root ESLint config and wire `demo` lint to include `../src`.

## Coding Style & Naming Conventions
- Language: JavaScript/JSX; indentation: 2 spaces; line width ~100.
- Components: PascalCase (`ReactTableCsv`); variables/functions: camelCase; constants: UPPER_SNAKE_CASE.
- Props: use clear, data-oriented names (`rows`, `columns`, `filename`). Provide sensible defaults.
- Exports: default export for the component; named exports for helpers if split.
- Prefer pure functions and immutable updates; avoid mutating input data before CSV generation.

## Testing Guidelines
- Recommended stack: Jest + React Testing Library.
- Place tests near `src/ReactTableCsv.jsx` or under `__tests__/`.
- Cover: parsing, filtering (operators), reducers, grouping, pinning, split tables, and CSV export formatting.

## Commit & Pull Request Guidelines
- Commits: use concise, imperative messages; recommended Conventional Commits (e.g., `feat: add custom delimiter`, `fix: escape quotes in fields`).
- PRs must include:
  - Purpose and scope; linked issue if applicable.
  - Before/after behavior and a minimal repro snippet (rows/columns example).
  - Screenshots or attached CSV when UI/format changes.
  - Notes on performance impact for large tables.

## Security & Configuration Tips
- Sanitize fields for CSV injection (prefix `=`, `+`, `-`, `@` when needed or document opt-in behavior).
- Escape quotes and delimiters; always end rows with `\r\n` for Excel compatibility; consider UTF-8 BOM for Excel.
- Avoid embedding secrets in sample data; guard against unbounded DOM size by virtualizing large tables if added later.
