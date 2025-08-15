import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Use the library source directly for instant HMR
      '@poserjs/react-table-csv': path.resolve(__dirname, '../src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  // Allow Vite dev server to access the workspace root when following symlinks
  server: {
    watch: {
      // Useful on some filesystems/editors where change events are missed
      // usePolling: true,
      // interval: 100,
    },
    fs: {
      allow: ['..']
    }
  }
})
