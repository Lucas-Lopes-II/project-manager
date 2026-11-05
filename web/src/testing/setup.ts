// jsdom has no layout, and the router scrolls to the top on each navigation.
window.scrollTo = () => {}

// jsdom does not implement modal dialogs. The E2E tests cover the real behavior (ADR-0026).
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  if (this.hasAttribute('open')) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
