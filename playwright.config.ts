import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://spontaneous-churros-891640.netlify.app',
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
