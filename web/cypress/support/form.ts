export function field(label: string) {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get(`[id="${id}"]`))
}

export function fillRequiredFields(name = 'Projeto Iridium'): void {
  field('Nome do projeto').type(name)
  field('Cliente').type('Clicksign')
  field('Data de Início').type('2026-11-05')
  field('Data Final').type('2026-12-12')
}

export function chooseCover(file: Cypress.FileReferenceObject): void {
  // The input is hidden behind the "Selecionar" button.
  field('Capa do projeto').selectFile(file, { force: true })
}

export function saveButton() {
  return cy.contains('button', 'Salvar projeto')
}

export function expectLoaded(selector: string): void {
  cy.get<HTMLImageElement>(selector)
    .first()
    .should('be.visible')
    .and(($image) => expect($image[0]!.naturalWidth).to.be.greaterThan(0))
}
