# ReactTableCSV shadcn/ui Demo

A Vite + React + Tailwind demo that wraps the existing ReactTableCSV demo pages with a shadcn/ui‑style shell (buttons, cards, theme toggle, sidebar). Uses Tailwind CSS and a small set of locally provided shadcn‑compatible components.

## Features
- Tailwind CSS configured with dark mode (class) and sensible design tokens.
- Minimal shadcn/ui style components: `Button`, `Card`, and a `ThemeToggle`.
- Hash‑based routing (`#/dash0` … `#/dash3`) with a collapsible sidebar.
- Reuses the demo pages from `../demo/src` so you can compare shells.

## Getting Started

1. Install deps (from this folder):

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the app in your browser (Vite will print the URL). Use the left navigation to switch between the demo dashboards. The sun/moon button toggles dark/light theme.

## Structure

- `src/components/ui/` – shadcn‑compatible UI primitives.
- `src/components/theme-toggle.tsx` – toggles the `dark` class on `<html>` and persists in `localStorage`.
- `src/App.tsx` – two‑pane layout with sidebar and content area.
- `src/main.tsx` – Tailwind CSS entry and initial theme wiring.

You can add additional shadcn components (e.g. `navigation-menu`, `sheet`, `separator`) as needed, or replace the local primitives with generated components from `shadcn/ui` when installing into a real project.

