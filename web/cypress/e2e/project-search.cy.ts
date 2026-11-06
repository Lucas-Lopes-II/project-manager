import { field, saveButton } from '../support/form'
import { createProject, markFavorite, resetProjects } from '../support/projects'

function searchInput() {
  return cy.get('input[type="search"]')
}

function openSearch() {
  cy.get('button[aria-label="Buscar projetos"]').click()
  return searchInput()
}

function names() {
  return cy.get('article h2').then(($names) => [...$names].map((name) => name.textContent?.trim()))
}

describe('project search', () => {
  beforeEach(() => {
    resetProjects()
    for (const name of ['Área Norte', 'Projeto Alfa', 'projeto beta', 'Outro Nome']) {
      createProject(name)
    }
  })

  it('opens the bar, searches while typing and shows the result page', () => {
    cy.intercept('GET', '/api/v1/projects?q=*').as('search')
    cy.visit('/')

    openSearch().should('be.focused').and('have.attr', 'placeholder', 'Digite o nome do projeto...')
    cy.get('img[alt="Gerenciador de Projetos"]').should('not.exist')

    searchInput().type('projeto')

    cy.wait('@search').its('request.url').should('include', 'q=projeto')
    cy.location('pathname').should('eq', '/busca')
    cy.location('search').should('eq', '?q=projeto')
    cy.contains('h1', 'Resultado da busca').should('be.visible')
    names().should('deep.equal', ['Projeto Alfa', 'projeto beta'])
    searchInput().should('have.value', 'projeto').and('be.focused')

    cy.get('input[role="switch"]').should('not.exist')
    cy.get('[role="combobox"]').should('not.exist')
    cy.contains('Projetos (').should('not.exist')
    cy.get('@search.all').should('have.length', 1)
  })

  it('ignores case and accents', () => {
    cy.visit('/busca?q=AREA')

    names().should('deep.equal', ['Área Norte'])
    searchInput().should('have.value', 'AREA')
  })

  it('updates the result while typing and goes back to the list in one step', () => {
    cy.visit('/?favoritos=true')
    cy.visit('/')
    openSearch().type('proj')
    cy.location('pathname').should('eq', '/busca')

    searchInput().type('eto a')
    cy.location('search').should('eq', '?q=projeto+a')
    names().should('deep.equal', ['Projeto Alfa'])

    cy.go('back')
    cy.location('pathname').should('eq', '/')
    cy.get('input[type="search"]').should('not.exist')
    cy.contains('h1', 'Projetos (4)').should('be.visible')
  })

  it('goes back to the list with the filters it had', () => {
    createProject('Projeto Gama').then(markFavorite)
    cy.visit('/?favoritos=true')
    openSearch().type('gama{enter}')

    cy.contains('h2', 'Projeto Gama').should('be.visible')
    cy.contains('a', 'Voltar').click()

    cy.location('search').should('eq', '?favoritos=true')
    cy.get('input[role="switch"]').should('be.checked')
    cy.get('input[type="search"]').should('not.exist')
  })

  it('opens by a direct link and when reloading', () => {
    cy.visit('/busca?q=beta')
    names().should('deep.equal', ['projeto beta'])

    cy.reload()
    names().should('deep.equal', ['projeto beta'])
    searchInput().should('have.value', 'beta')
  })

  it('asks for 3 characters and explains when nothing is found', () => {
    cy.visit('/busca?q=pr')
    cy.contains('Digite ao menos 3 caracteres para buscar.').should('be.visible')

    searchInput().clear().type('inexistente')
    cy.contains('Nenhum projeto encontrado').should('be.visible')
    cy.contains('Tente buscar por outro nome.').should('be.visible')
  })

  it('closes the empty bar on the list with Escape', () => {
    cy.visit('/')
    openSearch().type('pr{esc}')
    searchInput().should('have.value', '')

    searchInput().type('{esc}')
    cy.get('input[type="search"]').should('not.exist')
    cy.focused().should('have.attr', 'aria-label', 'Buscar projetos')
  })

  it('keeps the actions of the cards on the result page', () => {
    cy.visit('/busca?q=alfa')

    cy.contains('article', 'Projeto Alfa').find('button[aria-pressed]').click()
    cy.contains('article', 'Projeto Alfa')
      .find('button[aria-pressed]')
      .should('have.attr', 'aria-pressed', 'true')

    cy.get('button[aria-haspopup="menu"]').click()
    cy.contains('[role="menuitem"]', 'Editar').click()
    field('Nome do projeto').clear().type('Projeto Alfa Novo')
    saveButton().click()

    cy.location('pathname').should('eq', '/busca')
    cy.contains('h2', 'Projeto Alfa Novo').should('be.visible')

    cy.get('button[aria-haspopup="menu"]').click()
    cy.contains('[role="menuitem"]', 'Remover').click()
    cy.get('dialog').contains('button', 'Confirmar').click()

    cy.contains('Nenhum projeto encontrado').should('be.visible')
    cy.focused().should('match', 'h1')
  })

  it('does not scroll sideways at the supported widths', () => {
    for (const width of [1366, 1440, 1920]) {
      cy.viewport(width, 900)
      cy.visit('/busca?q=projeto')
      cy.get('article').should('have.length', 2)
      cy.document().then((document) => {
        const { scrollWidth, clientWidth } = document.documentElement
        expect(scrollWidth, `at ${width}`).to.be.at.most(clientWidth)
      })
    }
  })
})
