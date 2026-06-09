import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    // Default: local build. Set E2E_PROD=true for production tests
    baseURL: process.env.E2E_PROD
      ? 'https://spontaneous-churros-891640.netlify.app'
      : 'http://localhost:5200',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        launchOptions: {
          executablePath: '/opt/data/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
        },
      },
    },
  ],
});
