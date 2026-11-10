import { defineConfig, devices } from '@playwright/test';

// Root Playwright config. Site and extension suites join in later phases.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  reporter: process.env.CI ? 'github' : 'list',
  use: { ...devices['Desktop Chrome'] },
  webServer: [
    {
      // Lumo fixture shop (Hitline, Serpline): example.com etc. are mapped to it by host rules.
      command: 'pnpm --filter @line/fixture start',
      url: 'http://localhost:4400/__lumo/scenarios.json',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @line/ui preview',
      url: 'http://localhost:4310',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Serves apps/site/dist: run `pnpm build` first.
      command: 'pnpm --filter @line/site preview',
      url: 'http://localhost:4321',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
