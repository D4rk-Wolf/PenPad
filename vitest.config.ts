import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // Node environment for server-side logic (actions, lib utilities).
    // Use 'jsdom' per-file with @vitest/environment-jsdom for component tests.
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/__tests__/**',
        'src/lib/db/database.types.ts',
        'node_modules/**',
      ],
      thresholds: {
        lines:     40,
        functions: 40,
        branches:  40,
      },
    },
  },
})
