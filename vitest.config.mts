import { defineConfig } from 'vitest/config'

const alias = { '@': new URL('./src', import.meta.url).pathname }

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias },
  test: {
    coverage: {
      include: ['src/lib/**', 'src/server/**', 'src/core/**'],
      exclude: ['**/*.test.ts'],
      thresholds: { statements: 70 },
    },
    projects: [
      {
        oxc: { jsx: { runtime: 'automatic' } },
        resolve: { alias },
        test: { name: 'unit', include: ['src/**/*.test.ts'], exclude: ['src/**/*.int.test.ts'] },
      },
      ...(process.env.TEST_DATABASE_URL
        ? [
            {
              oxc: { jsx: { runtime: 'automatic' as const } },
              resolve: { alias },
              test: {
                name: 'integration',
                include: ['src/**/*.int.test.ts'],
                globalSetup: ['tests/global-setup.ts'],
                setupFiles: ['tests/setup.ts'],
                fileParallelism: false,
                testTimeout: 20_000,
                hookTimeout: 60_000,
              },
            },
          ]
        : []),
    ],
  },
})
