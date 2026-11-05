import { fakePngFile, MAX_COVER_BYTES, pdfFile, pngFile } from '../support/files'
import { createProject, listProjects, resetProjects } from '../support/projects'

function field(label: string) {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get(`[id="${id}"]`))
}

function fillRequiredFields(name = 'Projeto Iridium'): void {
  field('Nome do projeto').type(name)
  field('Cliente').type('Clicksign')
  field('Data de Início').type('2026-11-05')
  field('Data Final').type('2026-12-12')
}

function chooseCover(file: Cypress.FileReferenceObject): void {
  // The input is hidden behind the "Selecionar" button.
  field('Capa do projeto').selectFile(file, { force: true })
}

function saveButton() {
  return cy.contains('button', 'Salvar projeto')
}

function expectLoaded(selector: string): void {
  cy.get<HTMLImageElement>(selector)
    .first()
    .should('be.visible')
    .and(($image) => expect($image[0]!.naturalWidth).to.be.greaterThan(0))
}

describe('project creation', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('creates a project without a cover and shows its card', () => {
    cy.visit('/')
    cy.contains('a', 'Novo projeto').click()

    saveButton().should('be.disabled')
    fillRequiredFields()
    saveButton().should('be.enabled').click()

    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Projetos (1)').should('be.visible')

    cy.get('article').within(() => {
      cy.contains('h2', 'Projeto Iridium').should('be.visible')
      cy.contains('Cliente: Clicksign').should('be.visible')
      cy.contains('05 de novembro de 2026').should('be.visible')
      cy.contains('12 de dezembro de 2026').should('be.visible')
      expectLoaded('img')
      cy.get('img').first().should('have.attr', 'src').and('include', 'data:image/svg')
    })
  })

  it('creates a project with a cover and shows the image in the card', () => {
    cy.visit('/projetos/novo')
    fillRequiredFields()

    chooseCover(pngFile())
    expectLoaded('img[alt="Prévia da capa"]')

    saveButton().click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    cy.get('article img')
      .first()
      .should('have.attr', 'src')
      .and('match', /^\/api\/v1\/projects\/[0-9a-f-]+\/cover\?v=\d+$/)
    expectLoaded('article img')

    listProjects().then(({ items }) => {
      cy.request(items[0]!.cover_url!).then((response) => {
        expect(response.headers['content-type']).to.eq('image/png')
        expect(response.headers['cache-control']).to.include('immutable')
      })
    })
  })

  it('accepts a cover of exactly 5 MB through the whole stack', () => {
    cy.visit('/projetos/novo')
    fillRequiredFields()

    chooseCover(pngFile(MAX_COVER_BYTES))
    saveButton().click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    listProjects().then(({ items }) => {
      expect(items[0]!.cover_url).to.be.a('string')
    })
  })

  it('removes the chosen cover before saving', () => {
    cy.visit('/projetos/novo')
    fillRequiredFields()

    chooseCover(pngFile())
    cy.get('button[aria-label="Remover capa"]').click()

    cy.get('img[alt="Prévia da capa"]').should('not.exist')
    cy.focused().should('contain.text', 'Selecionar')

    saveButton().click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    listProjects().then(({ items }) => {
      expect(items[0]!.cover_url).to.eq(null)
    })
  })

  it('refuses files that are not accepted images', () => {
    cy.visit('/projetos/novo')

    chooseCover(pdfFile())
    cy.contains('p.error', 'Escolha uma imagem .jpg ou .png').should('be.visible')

    chooseCover(pngFile(MAX_COVER_BYTES + 1))
    cy.contains('p.error', 'A imagem deve ter até 5 MB').should('be.visible')

    chooseCover(fakePngFile())
    cy.contains('p.error', 'Escolha uma imagem .jpg ou .png').should('be.visible')
    cy.get('img[alt="Prévia da capa"]').should('not.exist')
  })

  it('shows the messages of the design and keeps the save button disabled', () => {
    cy.visit('/projetos/novo')

    field('Nome do projeto').type('Iridium').blur()
    cy.contains('Por favor, digite ao menos duas palavras').should('be.visible')

    field('Cliente').focus().blur()
    cy.contains('Por favor, digite ao menos uma palavra').should('be.visible')

    field('Data de Início').type('2026-11-05').blur()
    field('Data Final').type('2026-11-05').blur()
    cy.get('p.error').filter(':contains("Selecione uma data válida")').should('have.length', 2)

    saveButton().should('be.disabled')

    field('Nome do projeto').clear().type('Projeto Iridium')
    field('Cliente').type('Clicksign')
    field('Data Final').clear().type('2026-11-06')

    cy.get('p.error').should('not.exist')
    saveButton().should('be.enabled')
  })

  it('keeps the data when saving fails, and trying again creates a single project', () => {
    cy.intercept({ method: 'POST', url: '/api/v1/projects', times: 1 }, { statusCode: 500 })
    cy.visit('/projetos/novo')
    fillRequiredFields()

    saveButton().click()

    cy.contains('[role="alert"]', 'Não foi possível salvar o projeto. Tente novamente.').should(
      'be.visible',
    )
    cy.location('pathname').should('eq', '/projetos/novo')
    field('Nome do projeto').should('have.value', 'Projeto Iridium')

    saveButton().click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    listProjects().its('total').should('eq', 1)
  })

  it('reaches the form from the list, and hides the search only on the form', () => {
    createProject('Projeto Alfa')

    cy.visit('/')
    cy.get('button[aria-label="Buscar projetos"]').should('be.visible')

    cy.contains('a', 'Novo projeto').click()
    cy.get('button[aria-label="Buscar projetos"]').should('not.exist')

    cy.contains('a', 'Voltar').click()
    cy.location('pathname').should('eq', '/')
    cy.get('button[aria-label="Buscar projetos"]').should('be.visible')
  })

  it('does not scroll sideways at the supported widths', () => {
    createProject('Projeto Alfa')

    for (const width of [1366, 1440, 1920]) {
      cy.viewport(width, 900)

      for (const path of ['/', '/projetos/novo']) {
        cy.visit(path)
        cy.get('h1').should('be.visible')
        cy.document().then((document) => {
          const { scrollWidth, clientWidth } = document.documentElement
          expect(scrollWidth, `${path} at ${width}`).to.be.at.most(clientWidth)
        })
      }
    }
  })
})
