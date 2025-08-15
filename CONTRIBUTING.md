# Contributing to react-table-csv

Thanks for your interest in contributing! This repo contains a small, framework‑agnostic React component in `src/` and a Vite demo app in `demo/` used for local development and showcasing. The package is published to npm as `@poserjs/react-table-csv`.

Please read this guide before opening an issue or pull request.

## Code of Conduct
By participating, you agree to uphold a respectful, inclusive environment. Be kind, assume good intent, and focus on technical merits.

---

## Project Structure
- `src/` – component source (plain JSX/CSS)
  - `src/ReactTableCsv.jsx` – root component
  - `src/ReactTableCsv.module.css` – component styles
  - `src/components/` – internal UI pieces (`DataTable.jsx`, `FilterDropdown.jsx`, `SettingsPanel.jsx`, `Toolbar.jsx`)
  - `src/hooks/` – shared hooks (`useCsvData.js`, `useTableState.js`)
  - `src/index.js` (entry that re-exports the component)
  - `src/__tests__/` – unit tests
- `dist/` – transpiled output published to npm (generated)
- `demo/` – Vite SPA
  - `demo/src/**/*` app code
  - `demo/package.json` with scripts: `dev`, `build`, `lint`, `preview`
- Root configs: `.babelrc.json`, `.eslintrc.json`, `package.json`

## Prerequisites
- Node.js 18+ (16+ supported per `engines`, 18+ recommended)
- npm 8+
- Git

Optional:
- `nvm` for Node version management
- 2FA on npm for publishing

---

## Getting Started
1. Fork and clone the repo.
2. Install root dependencies (build/lint tooling):
   ```bash
   npm install
   ```
3. Install demo app dependencies:
   ```bash
   cd demo && npm install
   ```

## Local Development
- Run the demo (recommended for iterative UI work):
  ```bash
  cd demo
  npm run dev  # http://localhost:5173
  ```
  The demo imports the component directly from `src/` for rapid iteration.

- Build the library (transpile `src` → `dist` with Babel):
  ```bash
  npm run build
  ```
  Output goes to `dist/`. This is what consumers import when installing from npm.

## Linting
- Lint the component sources:
  ```bash
  npm run lint
  ```
- Lint the demo app:
  ```bash
  cd demo
  npm run lint
  ```

## Testing
This repository currently ships with a placeholder test script. We recommend Jest + React Testing Library for unit tests around:
- CSV parsing and formatting (quotes, delimiters, BOM, CRLF)
- Filtering (operators), reducers, grouping, pinning
- Split tables and CSV export formatting

Suggested layout:
- `src/__tests__/*.test.jsx` or colocated `*.test.jsx` next to files

Run tests (placeholder for now):
```bash
npm test
```

If you add tests, update `package.json` to run them (e.g., with Jest) and ensure CI passes.

## Commit Style
Use concise, imperative commit messages. Conventional Commits are encouraged:
- `feat: add custom delimiter`
- `fix: escape quotes in fields`
- `docs: add CSV export notes`
- `refactor: simplify filter pipeline`

## Branching & PRs
- Create feature branches from `main`.
- Keep PRs focused and include:
  - Purpose/scope with a minimal repro (rows/columns example)
  - Before/after behavior and screenshots or attached CSV when UI/format changes
  - Notes on performance impact for large tables
- Ensure `npm run lint` and (if added) tests pass.
- Copy the contents of the src subdirectory into the demo app and verify the component is working in the app
  - `cp -p src/*.js src/*.jsx src/*.css demo/src`
  - `cd demo && npm run dev`
  - check no errors are reported by the nextjs platform
  - check no errors are reported on the web page (http://localhost:3000)

---

## Build & Release
The package is built with Babel from `src/` to `dist/`. The root `package.json` includes:
- `main`/`module`: `./dist/index.js`
- `files`: `dist`, `src`, `README.md`, `LICENSE*`
- Script `prepare`: runs `npm run build` automatically during publish and when installing from Git.

### Build locally
```bash
npm run build
```

### Verify package contents before publishing
```bash
npm pack --dry-run
```
Check that only expected files are included (notably, `dist/`).

### Versioning
Follow semver and Conventional Commits to choose the bump:
```bash
# choose one: patch | minor | major
npm version patch -m "chore(release): %s"
# pushes a git tag locally; remember to push later
```

### Publish to npm
Make sure you are logged in and have publish rights:
```bash
npm login   # once
npm whoami  # verify
```
Then publish (package is public and unscoped):
```bash
npm publish
```
Notes:
- The `prepare` script runs automatically and builds `dist/` before publish.
- If you use npm 2FA, be ready to enter your OTP.

### Post‑publish
```bash
git push origin main --tags
```
Create a GitHub release with the changelog summary.

---

## Coding Style & Guidelines
- Language: JavaScript/JSX; indentation: 2 spaces; ~100 char lines
- Components: PascalCase (e.g., `ReactTableCsv`); variables/functions: camelCase
- Props: clear, data‑oriented names (`rows`, `columns`, `filename`) with sensible defaults
- Prefer pure functions and immutable updates; do not mutate input data before CSV generation
- Keep the component framework‑agnostic; demo‑specific concerns stay in `demo/`

## Security & CSV Handling
- Escape quotes, delimiters; end rows with `\r\n` for Excel compatibility; consider UTF‑8 BOM for Excel
- Guard against CSV injection: when exporting, optionally sanitize or document opt‑in behavior for cells starting with `=`, `+`, `-`, `@`
- Avoid embedding secrets in sample data
- For large datasets, avoid unbounded DOM growth (virtualization may be added later)

---

## Issue Guidelines
When filing an issue, include:
- Expected vs. actual behavior
- Minimal repro snippet (CSV rows/columns/settings)
- Environment details (OS, Node, browser, React/Next versions)
- Screenshots or a sample CSV if relevant

---

## FAQ
- Q: Do I need to build to run the demo?
  - A: No. The demo imports the component directly from `src/`.
- Q: Do I need to build before publishing?
  - A: `npm publish` will run `prepare`, which builds `dist/` automatically.

Thanks again for contributing! 🎉
