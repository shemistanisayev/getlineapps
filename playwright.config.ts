import { defineConfig, devices } from '@playwright/test';

// Root Playwright config. Site and extension suites join in later phases.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  reporter: process.env.CI ? 'github' : 'list',
  use: { ...devices['Desktop Chrome'] },
  webServer: [
    {
      command: 'pnpm --filter @line/ui preview',
      url: 'http://localhost:4310',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
