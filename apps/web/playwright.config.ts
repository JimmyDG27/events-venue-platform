import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test configuration.
 *
 * Both servers must be running before running these tests:
 *   pnpm dev:api   → NestJS API on http://localhost:3001
 *   pnpm dev:web   → Next.js on http://localhost:3000  (started automatically below)
 *
 * Run: pnpm --filter web test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // keep serial to avoid race conditions on shared DB state
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? 'dot' : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    // Give pages a bit longer to hydrate (Next.js + next-intl)
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start Next.js dev server automatically; API must be started separately.
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
