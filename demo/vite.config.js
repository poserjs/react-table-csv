import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Keep imports under node_modules (symlink) instead of realpath outside project
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  // Allow Vite dev server to access the workspace root when following symlinks
  server: {
    fs: {
      allow: ['..']
    }
  }
})
