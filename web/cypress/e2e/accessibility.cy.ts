import { checkAccessibility } from '../support/accessibility'
import { field, fillRequiredFields, saveButton } from '../support/form'
import { createProject, markFavorite, resetProjects } from '../support/projects'

const HISTORY_KEY = 'project-manager:search-history'
const APP_NAME = 'Gerenciador de Projetos'

function openSearch() {
  cy.get('button[aria-label="Buscar projetos"]').click()
  return cy.get('input[type="search"]')
}

describe('accessibility', () => {
  beforeEach(() => {
    resetProjects()
  })

  describe('with projects', () => {
    beforeEach(() => {
      createProject('Projeto Alfa').then(markFavorite)
      createProject('Projeto Beta')
      createProject('Área Norte')
    })

    it('checks the list, its controls and the removal', () => {
      cy.visit('/')
      cy.get('article').should('have.length', 3)
      checkAccessibility('list')

      cy.get('[role="combobox"]').click()
      cy.get('[role="listbox"]').should('be.visible')
      checkAccessibility('sort options')
      cy.get('[role="combobox"]').type('{esc}')

      cy.get('button[aria-haspopup="menu"]').first().click()
      cy.get('[role="menu"]').should('be.visible')
      checkAccessibility('card menu')

      cy.contains('[role="menuitem"]', 'Remover').click()
      cy.get('dialog').should('be.visible')
      checkAccessibility('removal dialog')
    })

    it('checks the search, its history and the result', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem(HISTORY_KEY, JSON.stringify(['projeto', 'área']))
        },
      })
      openSearch()
      cy.get('ul[aria-label="Buscas recentes"]').should('be.visible')
      checkAccessibility('search history')

      cy.get('input[type="search"]').type('projeto')
      cy.get('article mark').should('have.length', 2)
      checkAccessibility('search result')

      cy.get('input[type="search"]').clear()
      cy.get('input[type="search"]').type('pr')
      cy.contains('Digite ao menos 3 caracteres para buscar.').should('be.visible')
      checkAccessibility('short term')

      cy.get('input[type="search"]').type('ojeto inexistente')
      cy.contains('Nenhum projeto encontrado').should('be.visible')
      checkAccessibility('nothing found')
    })

    it('checks the edition', () => {
      cy.visit('/')
      cy.contains('article', 'Projeto Beta').find('button[aria-haspopup="menu"]').click()
      cy.contains('[role="menuitem"]', 'Editar').click()
      field('Nome do projeto').should('have.value', 'Projeto Beta')
      checkAccessibility('edition')
    })

    it('keeps the removal within reach with the zoom at 200%', () => {
      // 1366 x 768 with the zoom at 200%.
      cy.viewport(683, 384)
      cy.visit('/')
      cy.get('button[aria-haspopup="menu"]').first().click()
      cy.contains('[role="menuitem"]', 'Remover').click()

      cy.contains('dialog button', 'Confirmar').scrollIntoView()
      cy.contains('dialog button', 'Confirmar').then(($button) => {
        expect($button[0]!.getBoundingClientRect().bottom).to.be.at.most(384)
      })
      checkAccessibility('removal dialog with zoom')
    })

    it('checks the phone width', () => {
      cy.viewport(375, 740)
      cy.visit('/')
      cy.get('article').should('have.length', 3)
      checkAccessibility('list on a phone')

      openSearch()
      checkAccessibility('search on a phone')
      cy.get('input[type="search"]').type('{esc}')

      cy.contains('a', 'Novo projeto').click()
      cy.contains('h1', 'Novo projeto').should('be.visible')
      checkAccessibility('form on a phone')
    })
  })

  it('checks the empty states and the failure', () => {
    cy.visit('/')
    cy.contains('Nenhum projeto').should('be.visible')
    checkAccessibility('empty list')

    createProject('Projeto Alfa')
    cy.visit('/?favoritos=true')
    cy.contains('Nenhum projeto favorito').should('be.visible')
    checkAccessibility('no favorites')

    cy.intercept('GET', '/api/v1/projects*', { statusCode: 500 })
    cy.visit('/')
    cy.contains('Não foi possível carregar os projetos.').should('be.visible')
    checkAccessibility('failure')
  })

  it('checks the form with errors and a cover', () => {
    cy.visit('/projetos/novo')
    field('Nome do projeto').type('Projeto').blur()
    field('Data de Início').type('2026-12-12')
    field('Data Final').type('2026-11-05').blur()
    cy.contains('Por favor, digite ao menos duas palavras').should('be.visible')
    checkAccessibility('form with errors')

    field('Capa do projeto').selectFile(
      {
        contents: Cypress.Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'base64',
        ),
        fileName: 'capa.png',
        mimeType: 'image/png',
      },
      { force: true },
    )
    cy.get('form img[src^="blob:"], form img[src^="data:"]').should('exist')
    checkAccessibility('form with a cover')
  })

  it('names each page and moves the focus to it', () => {
    cy.visit('/')
    cy.title().should('eq', `Projetos · ${APP_NAME}`)

    cy.contains('a', 'Novo projeto').click()
    cy.title().should('eq', `Novo projeto · ${APP_NAME}`)
    cy.focused().should('match', 'h1').and('have.text', 'Novo projeto')

    fillRequiredFields('Projeto Gama')
    saveButton().click()
    cy.title().should('eq', `Projetos · ${APP_NAME}`)
    cy.focused().should('match', 'main, h1')

    // Typing opens the result page and keeps the focus in the field.
    openSearch().type('gama')
    cy.location('pathname').should('eq', '/busca')
    cy.title().should('eq', `Resultado da busca · ${APP_NAME}`)
    cy.focused().should('have.attr', 'type', 'search')

    cy.contains('a', 'Voltar').click()
    cy.location('pathname').should('eq', '/')
    cy.focused().should('match', 'main, h1')
  })
})
