// Every test fails when the Content Security Policy blocks something of the application (ADR-0035).

declare global {
  // The type of the global Cypress object.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Cypress {
      /** The violations of the current test, as "directive blocked-uri". */
      cspViolations: string[]
    }
  }
}

Cypress.cspViolations = []

Cypress.on('window:before:load', (win) => {
  win.addEventListener('securitypolicyviolation', (event) => {
    Cypress.cspViolations.push(`${event.effectiveDirective} ${event.blockedURI}`)
  })
})

beforeEach(() => {
  Cypress.cspViolations = []
})

afterEach(() => {
  expect(Cypress.cspViolations, 'Content Security Policy violations').to.deep.equal([])
})

export {}
