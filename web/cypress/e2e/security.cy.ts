import { pngFile } from '../support/files'
import { fillRequiredFields, saveButton } from '../support/form'
import { resetProjects } from '../support/projects'

const PROJECTS_URL = '/api/v1/projects'

/** A client address from a range reserved for tests, new in each test, as Caddy would send it. */
function clientIp(): string {
  const part = () => Cypress._.random(1, 254)
  return `198.18.${part()}.${part()}`
}

function asCaddy(ip: string) {
  return { 'X-Forwarded-For': ip }
}

/** Sends the requests one after another and yields every response. */
function sendInSequence(count: number, options: Partial<Cypress.RequestOptions>) {
  const responses: Cypress.Response<unknown>[] = []
  Cypress._.times(count, () => {
    cy.request({ failOnStatusCode: false, log: false, ...options }).then((response) => {
      responses.push(response)
    })
  })
  return cy.wrap(responses)
}

/** Sends the requests at once, from the browser, and yields every status. */
function sendTogether(count: number, url: string, headers: (index: number) => HeadersInit) {
  return cy
    .window()
    .then({ timeout: 30_000 }, (win) =>
      Promise.all(
        Cypress._.times(count, (index) =>
          win
            .fetch(url, { headers: headers(index), cache: 'no-store' })
            .then(({ status }) => status),
        ),
      ),
    )
}

/** Creates the projects from the browser, at once and without the limits of Caddy. */
function createProjects(count: number, { withCover = false } = {}) {
  const cover = new Uint8Array(pngFile().contents as ArrayLike<number>)
  cy.visit('/')
  cy.window().then({ timeout: 60_000 }, (win) =>
    Promise.all(
      Cypress._.times(count, (index) => {
        const form = new win.FormData()
        form.set('name', `Projeto ${String(index + 1).padStart(3, '0')}`)
        form.set('client', 'Clicksign')
        form.set('start_date', '2026-11-05')
        form.set('end_date', '2026-12-12')
        if (withCover) {
          form.set('cover', new win.Blob([cover], { type: 'image/png' }), 'capa.png')
        }
        return win.fetch(PROJECTS_URL, { method: 'POST', body: form }).then(({ status }) => {
          expect(status, 'create a project').to.eq(201)
        })
      }),
    ),
  )
}

function problemOf(response: Cypress.Response<unknown>): Record<string, unknown> {
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
  return body as Record<string, unknown>
}

function expectSecurityHeaders(headers: Record<string, string | string[]>) {
  expect(headers['content-security-policy'])
    .to.include("default-src 'self'")
    .and.include("img-src 'self' data: blob:")
    .and.include("frame-ancestors 'none'")
  expect(headers['x-content-type-options']).to.eq('nosniff')
  expect(headers['x-frame-options']).to.eq('DENY')
  expect(headers['referrer-policy']).to.eq('strict-origin-when-cross-origin')
  expect(headers['permissions-policy']).to.eq('camera=(), microphone=(), geolocation=()')
}

describe('security', () => {
  after(() => {
    resetProjects()
  })

  it('sends the security headers in every response, without the version of the server', () => {
    cy.request('/').then(({ headers, body }) => {
      expectSecurityHeaders(headers)
      expect(headers.server).to.eq('nginx')

      const script = /src="(\/assets\/[^"]+\.js)"/.exec(body as string)?.[1]
      expect(script, 'script of the page').to.be.a('string')
      cy.request(script!).its('headers').then(expectSecurityHeaders)
    })

    cy.request(PROJECTS_URL).its('headers').then(expectSecurityHeaders)
    cy.request({ url: `${PROJECTS_URL}/inexistente`, failOnStatusCode: false }).then((response) => {
      expect(response.status).to.eq(404)
      expectSecurityHeaders(response.headers)
    })
  })

  it('blocks content from other sites in the browser', () => {
    cy.visit('/')
    cy.document().then((document) => {
      const image = document.createElement('img')
      image.src = 'https://example.com/imagem.png'
      document.body.append(image)
    })

    cy.wrap(null).should(() => {
      expect(Cypress.cspViolations).to.have.length(1)
      expect(Cypress.cspViolations[0]).to.match(/^img-src https:\/\/example\.com/)
    })
    cy.then(() => {
      Cypress.cspViolations = []
    })
  })

  it('limits the writes of an address, answering in the error format of the API', () => {
    const ip = clientIp()

    sendInSequence(25, {
      method: 'POST',
      url: PROJECTS_URL,
      body: {},
      headers: asCaddy(ip),
    }).then((responses) => {
      const statuses = responses.map(({ status }) => status)
      // The first request and a burst of 20 pass at once.
      expect(statuses.slice(0, 21)).to.deep.equal(Array(21).fill(422))
      expect(statuses.slice(21)).to.include(429)

      const limited = responses.find(({ status }) => status === 429)!
      expect(limited.headers['content-type']).to.eq('application/problem+json')
      const problem = problemOf(limited)
      expect(problem).to.include({ type: 'about:blank', title: 'Too Many Requests', status: 429 })
      expect(problem.request_id).to.be.a('string').and.have.length.greaterThan(0)
    })

    // The reads of the same address and the writes of another one go on.
    cy.request({ url: PROJECTS_URL, headers: asCaddy(ip) })
      .its('status')
      .should('eq', 200)
    cy.request({
      method: 'POST',
      url: PROJECTS_URL,
      body: {},
      headers: asCaddy(clientIp()),
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 422)
  })

  it('limits the reads by the address of the client, not by one sent by the browser', () => {
    const ip = clientIp()
    cy.visit('/')

    // Caddy appends the address it sees to what the browser sent.
    sendTogether(150, PROJECTS_URL, (index) => asCaddy(`203.0.113.${index % 250}, ${ip}`)).then(
      (statuses) => {
        const passed = statuses.filter((status) => status === 200).length
        expect(passed, 'requests that passed').to.be.within(101, 130)
        expect(statuses.filter((status) => status !== 200)).to.satisfy((others: number[]) =>
          others.every((status) => status === 429),
        )
      },
    )

    cy.request({ url: PROJECTS_URL, headers: asCaddy(clientIp()) })
      .its('status')
      .should('eq', 200)
  })

  it('limits the pages and files of an address', () => {
    const ip = clientIp()
    cy.visit('/')

    sendTogether(200, '/', () => asCaddy(ip)).then((statuses) => {
      expect(statuses).to.include(200)
      expect(statuses).to.include(429)
    })

    cy.request({ url: '/', headers: asCaddy(clientIp()) })
      .its('status')
      .should('eq', 200)
  })

  it('does not limit the normal use of a list with many covers', () => {
    resetProjects()
    createProjects(60, { withCover: true })

    const ip = clientIp()
    const statuses: number[] = []
    cy.intercept('**', (request) => {
      request.headers['x-forwarded-for'] = ip
      request.on('response', (response) => {
        statuses.push(response.statusCode)
      })
    })

    cy.viewport(1920, 1080)
    cy.visit('/')
    cy.get('article')
      .should('have.length', 60)
      .each(($card) => cy.wrap($card).scrollIntoView())
    cy.get<HTMLImageElement>('article img').should(($images) => {
      $images.each((_, image) => {
        expect(image.naturalWidth, image.src).to.be.greaterThan(0)
      })
    })
    cy.then(() => {
      expect(statuses).not.to.include(429)
    })
  })

  it('stops at 200 projects and explains it in the form', () => {
    resetProjects()
    createProjects(200)

    cy.visit('/projetos/novo')
    fillRequiredFields('Projeto Excedente')
    saveButton().click()

    cy.get('[role="alert"]').should(
      'have.text',
      'Limite de 200 projetos atingido. Remova um projeto para criar outro.',
    )
    cy.location('pathname').should('eq', '/projetos/novo')

    cy.request({
      method: 'POST',
      url: PROJECTS_URL,
      body: {
        name: 'Projeto Excedente',
        client: 'Clicksign',
        start_date: '2026-11-05',
        end_date: '2026-12-12',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(problemOf(response)).to.include({ status: 409, code: 'project_limit' })
    })
  })
})
