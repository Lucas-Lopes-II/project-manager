import { defineConfig } from 'cypress'

export default defineConfig({
  // Keeps the Content Security Policy of the application in the tests, which fail on a violation.
  experimentalCspAllowList: true,
  e2e: {
    baseUrl: 'http://localhost:3100',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
  },
})
