import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config — targets the REAL React app in src/.
 *
 * History: this suite previously pointed at a hand-written HTML/JS app in
 * tests/mock-app/ on port 5188, which meant 115 tests could pass with src/
 * deleted entirely. See AUDIT.md Finding 1. The original design document
 * (.agents/sub_orch_e2e_testing/proposed_test_infra.md) specified the real
 * app; the implementation deviated. This restores that intent.
 *
 * The gate runs against `vite preview` over dist/, not the dev server, so
 * that E2E depends on `npm run build` succeeding and no HMR flake reaches
 * parallel workers. Use `npm run test:e2e:ui` against the dev server for
 * the inner edit loop.
 */

const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'test-results/results.json' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mock-frontend',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
