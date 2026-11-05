import { field, saveButton } from '../support/form'
import { createProject, dayFromToday, markFavorite, resetProjects } from '../support/projects'

function names() {
  return cy.get('article h2').then(($names) => [...$names].map((name) => name.textContent?.trim()))
}

function combobox() {
  return cy.get('[role="combobox"]')
}

function chooseSort(label: string): void {
  combobox().click()
  cy.contains('[role="option"]', label).click()
}

function createWithDates(name: string, start: number, end: number) {
  return createProject(name, { start_date: dayFromToday(start), end_date: dayFromToday(end) })
}

describe('project sort', () => {
  beforeEach(() => {
    resetProjects()
  })

  it('starts in alphabetical order, ignoring case and accents', () => {
    for (const name of ['Zeta Um', 'área Dois', 'Beta Três', 'Avião Quatro']) {
      createProject(name)
    }
    cy.visit('/')

    combobox().should('have.text', 'Ordem alfabética')
    names().should('deep.equal', ['área Dois', 'Avião Quatro', 'Beta Três', 'Zeta Um'])
  })

  it('orders by the most recent start and remembers the order', () => {
    createWithDates('Projeto Antigo', -100, 10)
    createWithDates('Projeto Novo', -1, 10)
    createWithDates('Projeto Médio', -30, 10)
    cy.visit('/')

    chooseSort('Iniciados mais recentes')

    cy.location('search').should('eq', '?ordem=recentes')
    names().should('deep.equal', ['Projeto Novo', 'Projeto Médio', 'Projeto Antigo'])

    cy.reload()
    combobox().should('have.text', 'Iniciados mais recentes')
    names().should('deep.equal', ['Projeto Novo', 'Projeto Médio', 'Projeto Antigo'])
  })

  it('orders by the nearest deadline, with the expired ones at the end', () => {
    createWithDates('Vence em Um Mês', -10, 30)
    createWithDates('Venceu Há Um Ano', -400, -365)
    createWithDates('Vence Hoje', -10, 0)
    createWithDates('Venceu Ontem', -10, -1)
    createWithDates('Vence Amanhã', -10, 1)
    cy.visit('/')

    chooseSort('Prazo mais próximo')

    cy.location('search').should('eq', '?ordem=prazo')
    names().should('deep.equal', [
      'Vence Hoje',
      'Vence Amanhã',
      'Vence em Um Mês',
      'Venceu Ontem',
      'Venceu Há Um Ano',
    ])
  })

  it('combines with the favorites filter and keeps the total', () => {
    createWithDates('Alfa Favorito', -10, 30).then(markFavorite)
    createWithDates('Beta Favorito', -10, 5).then(markFavorite)
    createWithDates('Gama Comum', -10, 1)
    cy.visit('/?favoritos=true&ordem=prazo')

    names().should('deep.equal', ['Beta Favorito', 'Alfa Favorito'])
    cy.contains('h1', 'Projetos (3)').should('be.visible')
    combobox().should('have.text', 'Prazo mais próximo')
  })

  it('works with the keyboard alone', () => {
    createWithDates('Projeto Antigo', -100, 10)
    createWithDates('Projeto Novo', -1, 10)
    cy.visit('/')

    combobox().focus()
    cy.focused().type('{downArrow}')
    combobox().should('have.attr', 'aria-expanded', 'true')
    cy.focused().type('{downArrow}{enter}')

    combobox()
      .should('have.attr', 'aria-expanded', 'false')
      .and('have.text', 'Iniciados mais recentes')
    names().should('deep.equal', ['Projeto Novo', 'Projeto Antigo'])

    cy.focused().type('{downArrow}{downArrow}{esc}')
    combobox().should('have.text', 'Iniciados mais recentes')
    cy.location('search').should('eq', '?ordem=recentes')
  })

  it('returns from the forms to the list with the same order', () => {
    createWithDates('Projeto Antigo', -100, 10)
    createWithDates('Projeto Novo', -1, 10)
    cy.visit('/?ordem=recentes')

    cy.get('button[aria-haspopup="menu"]').first().click()
    cy.contains('[role="menuitem"]', 'Editar').click()
    field('Nome do projeto').clear().type('Projeto Novíssimo')
    saveButton().click()

    cy.location('search').should('eq', '?ordem=recentes')
    names().should('deep.equal', ['Projeto Novíssimo', 'Projeto Antigo'])
  })

  it('keeps the toolbar in one line and does not scroll sideways at the supported widths', () => {
    createProject('Projeto Alfa')

    for (const width of [1366, 1440, 1920]) {
      cy.viewport(width, 900)
      cy.visit('/')
      cy.contains('a', 'Novo projeto').then(($button) => {
        cy.get('h1').should(($title) => {
          expect($button[0]!.getBoundingClientRect().top, `at ${width}`).to.be.lessThan(
            $title[0]!.getBoundingClientRect().bottom,
          )
        })
      })
      combobox().click()
      cy.get('[role="listbox"]').should('be.visible')
      cy.document().then((document) => {
        const { scrollWidth, clientWidth } = document.documentElement
        expect(scrollWidth, `at ${width}`).to.be.at.most(clientWidth)
      })
    }
  })
})
