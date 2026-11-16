// Regression suite for the portfolio site. Run: npm test
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4, // more parallel browsers starve the animations and cause timing flakes
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'python3 -m http.server 5174 --bind 127.0.0.1',
    url: 'http://127.0.0.1:5174/index.html',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
