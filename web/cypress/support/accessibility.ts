import type axe from 'axe-core'

// The page only runs scripts from its own address (ADR-0035), so axe is served there by the test.
const AXE_URL = '/__axe-core.js'
const AXE_FILE = 'node_modules/axe-core/axe.min.js'

type WindowWithAxe = Window & { axe?: typeof axe }

function loadAxe(): void {
  cy.readFile(AXE_FILE, { log: false }).then((source: string) => {
    cy.intercept('GET', AXE_URL, {
      body: source,
      headers: { 'content-type': 'application/javascript' },
    })
  })
  cy.window({ log: false }).then(
    (win: WindowWithAxe) =>
      new Promise<void>((resolve, reject) => {
        if (win.axe) {
          resolve()
          return
        }
        const script = win.document.createElement('script')
        script.src = AXE_URL
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('axe-core did not load'))
        win.document.head.append(script)
      }),
  )
}

/** Fails when axe finds a WCAG 2.1 A or AA violation in the page as it is now (ADR-0037). */
export function checkAccessibility(state: string): void {
  loadAxe()
  cy.window({ log: false })
    .then({ timeout: 30_000 }, (win: WindowWithAxe) =>
      win.axe!.run(win.document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }),
    )
    .then(({ violations }) => {
      const found = violations.map(
        ({ id, impact, nodes }) =>
          `${id} (${impact}): ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
      )
      expect(found, `accessibility violations: ${state}`).to.deep.equal([])
    })
}
