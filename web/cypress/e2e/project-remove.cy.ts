import { pngFile } from '../support/files'
import { chooseCover, fillRequiredFields, saveButton } from '../support/form'
import { createProject, listProjects, resetProjects } from '../support/projects'

function openRemoveDialog(index = 0): void {
  cy.get('button[aria-haspopup="menu"]').eq(index).click()
  cy.contains('[role="menuitem"]', 'Remover').click()
  cy.get('dialog[open]').should('be.visible')
}

function confirmButton() {
  return cy.get('dialog').contains('button', 'Confirmar')
}

describe('project removal', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('asks for confirmation with the name of the project', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    openRemoveDialog()

    cy.get('dialog').within(() => {
      cy.contains('h2', 'Remover projeto').should('be.visible')
      cy.contains('Essa ação removerá definitivamente o projeto:').should('be.visible')
      cy.contains('Projeto Alfa').should('be.visible')
    })
    cy.focused().should('contain.text', 'Cancelar')
  })

  it('removes the project and its cover, and updates the total', () => {
    createProject('Projeto Beta')
    cy.visit('/projetos/novo')
    fillRequiredFields('Projeto Alfa')
    chooseCover(pngFile())
    saveButton().click()
    cy.contains('h1', 'Projetos (2)').should('be.visible')

    listProjects().then(({ items }) => {
      const coverUrl = items.find((project) => project.name === 'Projeto Alfa')!.cover_url!

      openRemoveDialog(0)
      confirmButton().click()

      cy.get('dialog[open]').should('not.exist')
      cy.contains('h1', 'Projetos (1)').should('be.visible')
      cy.contains('h2', 'Projeto Alfa').should('not.exist')
      cy.contains('h2', 'Projeto Beta').should('be.visible')
      cy.focused().should('match', 'h1')

      listProjects().its('total').should('eq', 1)
      cy.request({ url: coverUrl, failOnStatusCode: false }).its('status').should('eq', 404)
    })
  })

  it('shows the empty list after removing the last project', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    openRemoveDialog()
    confirmButton().click()

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
    cy.focused().should('contain.text', 'Nenhum projeto')
  })

  for (const [description, action] of [
    ['the cancel button', () => cy.get('dialog').contains('button', 'Cancelar').click()],
    // Cypress does not send real keys or real clicks on the backdrop, so these tests fire the
    // events that the browser produces for them: "cancel" for Escape, and a click on the dialog.
    ['the Escape key', () => cy.get('dialog').trigger('cancel')],
    [
      'a click outside',
      () =>
        cy
          .get('dialog')
          .then(($dialog) => $dialog[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }))),
    ],
  ] as const) {
    it(`cancels with ${description} and returns the focus to the card`, () => {
      createProject('Projeto Alfa')
      cy.visit('/')
      openRemoveDialog()

      action()

      cy.get('dialog[open]').should('not.exist')
      cy.focused().should('have.attr', 'aria-haspopup', 'menu')
      cy.contains('h2', 'Projeto Alfa').should('be.visible')
      listProjects().its('total').should('eq', 1)
    })
  }

  it('works with the keyboard alone', () => {
    createProject('Projeto Alfa')
    cy.visit('/')

    cy.get('button[aria-haspopup="menu"]').focus()
    cy.focused().type('{enter}')
    cy.focused().type('{downArrow}')
    cy.focused().should('contain.text', 'Remover').type('{enter}')
    cy.focused().should('contain.text', 'Cancelar')

    cy.get('dialog').contains('button', 'Confirmar').focus()
    cy.focused().type('{enter}')

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
  })

  it('keeps the project when the removal fails, and allows trying again', () => {
    createProject('Projeto Alfa')
    cy.intercept({ method: 'DELETE', url: '/api/v1/projects/*', times: 1 }, { statusCode: 500 })
    cy.visit('/')
    openRemoveDialog()

    confirmButton().click()

    cy.get('dialog[open]').within(() => {
      cy.contains('[role="alert"]', 'Não foi possível remover o projeto. Tente novamente.').should(
        'be.visible',
      )
    })
    listProjects().its('total').should('eq', 1)
    cy.focused().should('contain.text', 'Confirmar')

    confirmButton().click()

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
  })

  it('keeps the dialog open and the buttons disabled while removing', () => {
    createProject('Projeto Alfa')
    let answer!: () => void
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    cy.intercept('DELETE', '/api/v1/projects/*', (request) => {
      request.continue(() => answered)
    })
    cy.visit('/')
    openRemoveDialog()

    confirmButton().click()

    confirmButton().should('be.disabled')
    cy.get('dialog').contains('button', 'Cancelar').should('be.disabled')
    cy.get('dialog').trigger('cancel')
    cy.get('dialog').then(($dialog) =>
      $dialog[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    )
    cy.get('dialog[open]')
      .should('be.visible')
      .then(() => answer())

    cy.contains('h1', 'Nenhum projeto').should('be.visible')
  })

  it('removes from the list a project that someone else removed first', () => {
    createProject('Projeto Alfa').then((id) => {
      createProject('Projeto Beta')
      cy.visit('/')
      cy.contains('h1', 'Projetos (2)').should('be.visible')

      cy.request('DELETE', `/api/v1/projects/${id}`)
      openRemoveDialog(0)
      confirmButton().click()

      cy.get('dialog[open]').should('not.exist')
      cy.contains('h1', 'Projetos (1)').should('be.visible')
      cy.get('[role="alert"]').should('not.exist')
    })
  })
})
