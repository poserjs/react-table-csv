import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

// Attempt to load TypeScript ESLint tooling if installed; otherwise, skip TS-specific config
let tsParser = null;
let tsPlugin = null;
try {
  // @ts-ignore - optional deps in demo
  tsParser = (await import('@typescript-eslint/parser')).default;
  // @ts-ignore - optional deps in demo
  tsPlugin = (await import('@typescript-eslint/eslint-plugin')).default;
} catch {
  // TS ESLint not installed; linting will still work for JS/JSX
}

const tsBlocks = tsParser && tsPlugin ? [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs?.recommended?.rules || {}),
    },
  },
] : [];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  ...tsBlocks,
]);
