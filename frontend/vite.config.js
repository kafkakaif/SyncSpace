import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.api.js': resolve(
        __dirname,
        'node_modules/monaco-editor/esm/vs/editor/editor.api.js'
      ),
      'y-protocols/awareness': resolve(
        __dirname,
        'node_modules/y-protocols/awareness.js'
      ),
    },
  },
  optimizeDeps: {
    include: ['y-protocols/awareness', 'y-monaco'],
  },
  server: {
    port: 3000,
  },
})

