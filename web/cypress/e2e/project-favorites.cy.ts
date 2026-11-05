import { field, saveButton } from '../support/form'
import { createProject, listProjects, markFavorite, resetProjects } from '../support/projects'

function star(name: string) {
  return cy.contains('article', name).find('button[aria-pressed]')
}

function favoritesToggle() {
  return cy.get('input[role="switch"]')
}

describe('favorites', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('marks and unmarks a project with the star', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'false').click()
    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'true')
    listProjects().its('items.0.favorite').should('eq', true)

    cy.reload()
    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'true').click()
    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'false')
    listProjects().its('items.0.favorite').should('eq', false)
  })

  it('shows only the favorites, keeps the total and remembers the filter', () => {
    createProject('Projeto Alfa').then(markFavorite)
    createProject('Projeto Beta')
    cy.intercept('GET', '/api/v1/projects?favorite=true').as('favorites')
    cy.visit('/')

    favoritesToggle().check({ force: true })

    cy.wait('@favorites')
    cy.location('search').should('eq', '?favoritos=true')
    cy.get('article').should('have.length', 1)
    cy.contains('h2', 'Projeto Alfa').should('be.visible')
    cy.contains('h1', 'Projetos (2)').should('be.visible')

    cy.reload()
    favoritesToggle().should('be.checked')
    cy.get('article').should('have.length', 1)

    favoritesToggle().uncheck({ force: true })
    cy.location('search').should('eq', '')
    cy.get('article').should('have.length', 2)
  })

  it('keeps the current list on screen while the filter loads', () => {
    createProject('Projeto Alfa').then(markFavorite)
    createProject('Projeto Beta')
    let answer!: () => void
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    cy.intercept('GET', '/api/v1/projects?favorite=true', (request) => {
      request.continue(() => answered)
    })
    cy.visit('/')
    cy.get('article').should('have.length', 2)

    favoritesToggle().check({ force: true })

    cy.get('article')
      .should('have.length', 2)
      .then(() => answer())
    cy.get('article').should('have.length', 1)
  })

  it('explains when there are no favorites', () => {
    createProject('Projeto Alfa')
    cy.visit('/?favoritos=true')

    cy.contains('Nenhum projeto favorito').should('be.visible')
    cy.contains('Clique na estrela de um projeto para encontrá-lo aqui.').should('be.visible')
    cy.contains('h1', 'Projetos (1)').should('be.visible')

    favoritesToggle().uncheck({ force: true })
    cy.contains('h2', 'Projeto Alfa').should('be.visible')
  })

  it('takes an unmarked project out of the favorites and moves the focus to the title', () => {
    createProject('Projeto Alfa').then(markFavorite)
    createProject('Projeto Beta').then(markFavorite)
    cy.visit('/?favoritos=true')

    star('Projeto Alfa').click()

    cy.contains('h2', 'Projeto Alfa').should('not.exist')
    cy.get('article').should('have.length', 1)
    cy.focused().should('match', 'h1')
  })

  it('undoes the star and reports when the API fails', () => {
    createProject('Projeto Alfa')
    cy.intercept(
      { method: 'PUT', url: '/api/v1/projects/*/favorite', times: 1 },
      { statusCode: 500 },
    )
    cy.visit('/')

    star('Projeto Alfa').click()

    cy.contains('[role="alert"]', 'Não foi possível atualizar o favorito. Tente novamente.').should(
      'be.visible',
    )
    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'false')

    star('Projeto Alfa').click()
    star('Projeto Alfa').should('have.attr', 'aria-pressed', 'true')
    cy.get('[role="alert"]').should('not.exist')
  })

  it('returns from the forms to the list with the same filter', () => {
    createProject('Projeto Alfa').then(markFavorite)
    createProject('Projeto Beta')
    cy.visit('/?favoritos=true')

    cy.get('button[aria-haspopup="menu"]').click()
    cy.contains('[role="menuitem"]', 'Editar').click()
    cy.contains('a', 'Voltar').click()

    cy.location('search').should('eq', '?favoritos=true')
    favoritesToggle().should('be.checked')

    cy.get('button[aria-haspopup="menu"]').click()
    cy.contains('[role="menuitem"]', 'Editar').click()
    field('Nome do projeto').clear().type('Projeto Gama')
    saveButton().click()

    cy.location('search').should('eq', '?favoritos=true')
    cy.contains('h2', 'Projeto Gama').should('be.visible')
    cy.get('article').should('have.length', 1)
  })

  it('names the controls for assistive technology', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    star('Projeto Alfa').should('have.attr', 'aria-label', 'Favoritar Projeto Alfa')
    cy.contains('label', 'Apenas Favoritos').find('input[role="switch"]').should('exist')
  })

  it('does not scroll sideways at the supported widths', () => {
    createProject('Projeto Alfa').then(markFavorite)

    for (const width of [1366, 1440, 1920]) {
      cy.viewport(width, 900)
      cy.visit('/?favoritos=true')
      cy.contains('h2', 'Projeto Alfa').should('be.visible')
      cy.document().then((document) => {
        const { scrollWidth, clientWidth } = document.documentElement
        expect(scrollWidth, `at ${width}`).to.be.at.most(clientWidth)
      })
    }
  })
})
