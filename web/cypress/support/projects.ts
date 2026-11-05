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

export interface ProjectDates {
  start_date: string
  end_date: string
}

export function createProject(
  name: string,
  dates: ProjectDates = { start_date: '2026-11-05', end_date: '2026-12-12' },
): Cypress.Chainable<string> {
  return cy
    .request<{ id: string }>('POST', PROJECTS_URL, { name, client: 'Clicksign', ...dates })
    .its('body.id')
}

/** A date relative to today in São Paulo, the "today" of the API (ADR-0029). */
export function dayFromToday(offset: number): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  )
  const date = new Date(`${today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export interface ProjectList {
  items: { id: string; name: string; favorite: boolean; cover_url: string | null }[]
  total: number
}

export function markFavorite(id: string): void {
  cy.request('PUT', `${PROJECTS_URL}/${id}/favorite`)
}

export function listProjects(): Cypress.Chainable<ProjectList> {
  return cy.request<ProjectList>(PROJECTS_URL).its('body')
}
