import { createProject, resetProjects } from '../support/projects'

describe('project list', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('invites the creation of the first project when there are none', () => {
    cy.visit('/')

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
    cy.contains('Clique no botão abaixo para criar o primeiro e gerenciá-lo.').should('be.visible')

    cy.contains('a', 'Novo projeto').click()

    cy.location('pathname').should('eq', '/projetos/novo')
    cy.contains('h1', 'Novo projeto').should('be.visible')
  })

  it('opens an internal route when reloading the page', () => {
    cy.visit('/projetos/novo')
    cy.reload()

    cy.contains('h1', 'Novo projeto').should('be.visible')
  })

  it('shows the total of registered projects', () => {
    createProject('Projeto Alfa')
    createProject('Projeto Beta')

    cy.visit('/')

    cy.contains('h1', 'Projetos (2)').should('be.visible')
    cy.contains('Nenhum projeto').should('not.exist')
  })

  it('shows the loading state until the API answers, without the empty list', () => {
    let answer!: () => void
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    cy.intercept('GET', '/api/v1/projects', (request) => {
      request.continue(() => answered)
    })

    cy.visit('/')

    // The delay keeps quick answers from making the text flicker.
    cy.get('[role="status"] > *').should('have.css', 'animation-delay', '0.3s')
    cy.contains('[role="status"] p', 'Carregando projetos...').should('be.visible')
    cy.contains('Nenhum projeto')
      .should('not.exist')
      .then(() => answer())

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
    cy.get('[role="status"]').should('be.empty')
  })

  it('reports a failure of the API and recovers when trying again', () => {
    createProject('Projeto Alfa')
    cy.intercept({ method: 'GET', url: '/api/v1/projects', times: 1 }, { statusCode: 500 })

    cy.visit('/')

    cy.contains('[role="alert"]', 'Não foi possível carregar os projetos.').should('be.visible')
    cy.contains('Nenhum projeto').should('not.exist')

    cy.contains('button', 'Tentar novamente').click()

    cy.contains('h1', 'Projetos (1)').should('be.visible')
    cy.get('[role="alert"]').should('not.exist')
  })
})
