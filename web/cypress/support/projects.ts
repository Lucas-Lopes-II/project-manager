const PROJECTS_URL = '/api/v1/projects'
const TEST_STACK_URL = 'http://localhost:3100'

/** Deletes every project, so it refuses to run outside the disposable test stack. */
export function resetProjects(): void {
  const baseUrl = Cypress.config('baseUrl')
  if (baseUrl !== TEST_STACK_URL) {
    throw new Error(`resetProjects only runs on ${TEST_STACK_URL}, not on ${baseUrl}`)
  }

  cy.request<{ items: { id: string }[] }>(PROJECTS_URL).then(({ body }) => {
    body.items.forEach(({ id }) => {
      cy.request('DELETE', `${PROJECTS_URL}/${id}`)
    })
  })
}

export function createProject(name: string): void {
  cy.request('POST', PROJECTS_URL, {
    name,
    client: 'Clicksign',
    start_date: '2026-11-05',
    end_date: '2026-12-12',
  })
}
