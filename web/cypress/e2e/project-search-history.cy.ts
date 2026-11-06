import { createProject, resetProjects } from '../support/projects'

const HISTORY_KEY = 'project-manager:search-history'

function searchInput() {
  return cy.get('input[type="search"]')
}

function openSearch() {
  cy.get('button[aria-label="Buscar projetos"]').click()
  return searchInput()
}

function history() {
  return cy.get('ul[aria-label="Buscas recentes"]')
}

function historyTerms() {
  return history()
    .find('li')
    .then(($items) => [...$items].map((item) => item.textContent?.trim()))
}

function names() {
  return cy.get('article h2').then(($names) => [...$names].map((name) => name.textContent?.trim()))
}

/** Opens the list with these terms already in the history. */
function visitWithHistory(terms: string[]) {
  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem(HISTORY_KEY, JSON.stringify(terms))
    },
  })
}

describe('project search history', () => {
  beforeEach(() => {
    resetProjects()
    for (const name of ['Área Norte', 'Projeto Alfa', 'projeto beta']) {
      createProject(name)
    }
  })

  it('records the searches and repeats one of them', () => {
    cy.visit('/')
    openSearch()
    history().should('not.exist')

    searchInput().type('proj')
    cy.location('search').should('eq', '?q=proj')
    searchInput().type('eto')
    cy.location('search').should('eq', '?q=projeto')
    cy.contains('a', 'Voltar').click()

    openSearch()
    historyTerms().should('deep.equal', ['projeto'])

    searchInput().type('norte{enter}')
    names().should('deep.equal', ['Área Norte'])
    history().should('not.exist')

    searchInput().clear()
    historyTerms().should('deep.equal', ['norte', 'projeto'])

    history().contains('button', 'projeto').click()
    cy.location('search').should('eq', '?q=projeto')
    names().should('deep.equal', ['Projeto Alfa', 'projeto beta'])
    searchInput().should('have.value', 'projeto').and('be.focused')
    history().should('not.exist')
  })

  it('removes a term without searching, and keeps the history after reloading', () => {
    cy.intercept('GET', '/api/v1/projects?q=*').as('search')
    visitWithHistory(['alfa', 'beta', 'norte'])
    openSearch()

    history().find('button[aria-label="Remover beta do histórico"]').click()

    historyTerms().should('deep.equal', ['alfa', 'norte'])
    searchInput().should('be.focused')
    cy.location('pathname').should('eq', '/')

    cy.reload()
    openSearch()
    historyTerms().should('deep.equal', ['alfa', 'norte'])
    cy.get('@search.all').should('have.length', 0)
  })

  it('works with the keyboard', () => {
    visitWithHistory(['alfa', 'beta'])
    openSearch()

    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('have.text', 'alfa')
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('have.attr', 'aria-label', 'Remover alfa do histórico').type('{enter}')

    historyTerms().should('deep.equal', ['beta'])
    cy.focused().should('have.text', 'beta').type('{enter}')

    cy.location('search').should('eq', '?q=beta')
    names().should('deep.equal', ['projeto beta'])
    searchInput().should('be.focused')
  })

  it('closes with the empty bar on the list', () => {
    visitWithHistory(['alfa'])
    openSearch()
    history().should('be.visible')

    cy.get('body').click(10, 500)
    cy.get('input[type="search"]').should('not.exist')

    openSearch()
    history().find('button').first().focus().type('{esc}')
    cy.get('input[type="search"]').should('not.exist')
    cy.focused().should('have.attr', 'aria-label', 'Buscar projetos')
  })

  it('does not scroll sideways at the supported widths', () => {
    for (const width of [1366, 1440, 1920]) {
      cy.viewport(width, 900)
      visitWithHistory(['um termo longo para a lista '.repeat(8).trim()])
      openSearch()
      history().should('be.visible')
      cy.document().then((document) => {
        const { scrollWidth, clientWidth } = document.documentElement
        expect(scrollWidth, `at ${width}`).to.be.at.most(clientWidth)
      })
    }
  })
})
