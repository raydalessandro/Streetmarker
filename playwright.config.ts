import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for StreetMark PWA
 *
 * - Base URL: http://localhost:5173 (Vite dev server)
 * - Browser: Chromium only (fast, consistent)
 * - Mode: Headless
 * - Captures: Screenshots on failure, traces on first retry
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially for IndexedDB consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to avoid IndexedDB conflicts

  // Reporter config
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests (Vite dev server default)
    baseURL: 'http://localhost:3000',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Trace on first retry
    trace: 'on-first-retry',

    // Video capture
    video: 'retain-on-failure',
  },

  // Configure single project (Chromium only)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration (Vite dev server)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
