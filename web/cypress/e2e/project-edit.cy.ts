import { pngFile } from '../support/files'
import { chooseCover, expectLoaded, field, fillRequiredFields, saveButton } from '../support/form'
import { createProject, listProjects, resetProjects } from '../support/projects'

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'

function createWithCoverThroughTheForm(): void {
  cy.visit('/projetos/novo')
  fillRequiredFields()
  chooseCover(pngFile())
  saveButton().click()
  cy.contains('h1', 'Projetos (1)').should('be.visible')
}

function openEditFromTheCard(): void {
  cy.get('button[aria-haspopup="menu"]').click()
  cy.contains('[role="menuitem"]', 'Editar').click()
  cy.contains('h1', 'Editar projeto').should('be.visible')
}

function coverUrl(): Cypress.Chainable<string | null> {
  return listProjects().then(({ items }) => items[0]!.cover_url) as Cypress.Chainable<string | null>
}

describe('project edition', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('opens from the menu of the card with the current data', () => {
    createWithCoverThroughTheForm()

    openEditFromTheCard()

    cy.location('pathname').should('match', /^\/projetos\/[0-9a-f-]+\/editar$/)
    cy.get('button[aria-label="Buscar projetos"]').should('not.exist')
    field('Nome do projeto').should('have.value', 'Projeto Iridium')
    field('Cliente').should('have.value', 'Clicksign')
    field('Data de Início').should('have.value', '2026-11-05')
    field('Data Final').should('have.value', '2026-12-12')
    expectLoaded('img[alt="Prévia da capa"]')
    saveButton().should('be.enabled')
  })

  it('opens the menu with the keyboard and closes it without losing the focus', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    cy.get('button[aria-haspopup="menu"]').focus()
    cy.focused().type('{enter}')
    cy.focused().should('have.attr', 'role', 'menuitem').and('contain.text', 'Editar')

    cy.focused().type('{esc}')
    cy.get('[role="menu"]').should('not.exist')
    cy.focused().should('have.attr', 'aria-haspopup', 'menu')
  })

  it('closes the menu with a click outside', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    cy.get('button[aria-haspopup="menu"]').click()
    cy.get('[role="menu"]').should('be.visible')

    cy.get('h1').click()
    cy.get('[role="menu"]').should('not.exist')
  })

  it('saves the changes and shows them in the card', () => {
    createProject('Projeto Alfa')
    cy.visit('/')
    openEditFromTheCard()

    field('Nome do projeto').clear().type('Projeto Beta')
    field('Cliente').clear().type('Outro cliente')
    field('Data Final').clear().type('2027-01-20')
    saveButton().click()

    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Projetos (1)').should('be.visible')
    cy.get('article').within(() => {
      cy.contains('h2', 'Projeto Beta').should('be.visible')
      cy.contains('Cliente: Outro cliente').should('be.visible')
      cy.contains('20 de janeiro de 2027').should('be.visible')
    })
  })

  it('applies the same rules of the creation', () => {
    createProject('Projeto Alfa')
    cy.visit('/')
    openEditFromTheCard()

    field('Nome do projeto').clear().type('Iridium').blur()

    cy.contains('Por favor, digite ao menos duas palavras').should('be.visible')
    saveButton().should('be.disabled')
  })

  it('keeps the cover when saving without touching it', () => {
    createWithCoverThroughTheForm()
    coverUrl().then((before) => {
      openEditFromTheCard()
      field('Nome do projeto').clear().type('Projeto Beta')
      saveButton().click()

      cy.contains('h2', 'Projeto Beta').should('be.visible')
      coverUrl().should('eq', before)
    })
  })

  it('replaces the cover, and the card shows the new image', () => {
    createWithCoverThroughTheForm()
    coverUrl().then((before) => {
      openEditFromTheCard()

      cy.get('button[aria-label="Remover capa"]').click()
      chooseCover(pngFile(2048))
      expectLoaded('img[alt="Prévia da capa"]')
      saveButton().click()

      cy.contains('h1', 'Projetos (1)').should('be.visible')
      coverUrl().then((after) => {
        expect(after).to.be.a('string').and.not.eq(before)
        cy.get('article img').first().should('have.attr', 'src', after!)
        cy.request(after!).its('headers.content-length').should('eq', '2048')
      })
      expectLoaded('article img')
    })
  })

  it('removes the cover, and the card shows the placeholder', () => {
    createWithCoverThroughTheForm()
    openEditFromTheCard()

    cy.get('button[aria-label="Remover capa"]').click()
    cy.focused().should('contain.text', 'Selecionar')
    saveButton().click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    coverUrl().should('eq', null)
    cy.get('article img').first().should('have.attr', 'src').and('include', 'data:image/svg')
  })

  it('discards the changes when going back', () => {
    createWithCoverThroughTheForm()
    coverUrl().then((before) => {
      openEditFromTheCard()

      field('Nome do projeto').clear().type('Projeto Beta')
      cy.get('button[aria-label="Remover capa"]').click()
      cy.contains('a', 'Voltar').click()

      cy.contains('h2', 'Projeto Iridium').should('be.visible')
      coverUrl().should('eq', before)
    })
  })

  it('changes nothing when saving fails, and allows trying again', () => {
    createWithCoverThroughTheForm()
    coverUrl().then((before) => {
      cy.intercept({ method: 'PUT', url: '/api/v1/projects/*', times: 1 }, { statusCode: 500 })
      openEditFromTheCard()

      field('Nome do projeto').clear().type('Projeto Beta')
      saveButton().click()

      cy.contains('[role="alert"]', 'Não foi possível salvar o projeto. Tente novamente.').should(
        'be.visible',
      )
      field('Nome do projeto').should('have.value', 'Projeto Beta')
      coverUrl().should('eq', before)

      saveButton().click()
      cy.contains('h2', 'Projeto Beta').should('be.visible')
      listProjects().its('total').should('eq', 1)
    })
  })

  it('opens by a direct link and when reloading', () => {
    createProject('Projeto Alfa').then((id) => {
      cy.visit(`/projetos/${id}/editar`)
      field('Nome do projeto').should('have.value', 'Projeto Alfa')

      cy.reload()
      field('Nome do projeto').should('have.value', 'Projeto Alfa')
    })
  })

  for (const [description, id] of [
    ['that does not exist', UNKNOWN_ID],
    ['with a malformed id', 'abc'],
  ] as const) {
    it(`reports a project ${description}`, () => {
      cy.visit(`/projetos/${id}/editar`)

      cy.contains('h1', 'Projeto não encontrado').should('be.visible')
      cy.contains('Ele pode ter sido removido.').should('be.visible')
      cy.get('form').should('not.exist')

      cy.contains('a', 'Voltar para a lista').click()
      cy.location('pathname').should('eq', '/')
    })
  }

  it('reports a project removed during the edition', () => {
    createProject('Projeto Alfa').then((id) => {
      cy.visit(`/projetos/${id}/editar`)
      field('Nome do projeto').should('have.value', 'Projeto Alfa')

      cy.request('DELETE', `/api/v1/projects/${id}`)
      saveButton().click()

      cy.contains('h1', 'Projeto não encontrado').should('be.visible')
    })
  })

  it('reports a failure when loading and recovers when trying again', () => {
    createProject('Projeto Alfa').then((id) => {
      cy.intercept({ method: 'GET', url: '/api/v1/projects/*', times: 1 }, { statusCode: 500 })
      cy.visit(`/projetos/${id}/editar`)

      cy.contains('[role="alert"]', 'Não foi possível carregar o projeto.').should('be.visible')
      cy.contains('button', 'Tentar novamente').click()

      field('Nome do projeto').should('have.value', 'Projeto Alfa')
      cy.get('[role="alert"]').should('not.exist')
    })
  })

  it('does not scroll sideways at the supported widths', () => {
    createProject('Projeto Alfa').then((id) => {
      for (const width of [1366, 1440, 1920]) {
        cy.viewport(width, 900)
        cy.visit(`/projetos/${id}/editar`)
        cy.contains('h1', 'Editar projeto').should('be.visible')
        cy.document().then((document) => {
          const { scrollWidth, clientWidth } = document.documentElement
          expect(scrollWidth, `at ${width}`).to.be.at.most(clientWidth)
        })
      }
    })
  })
})
