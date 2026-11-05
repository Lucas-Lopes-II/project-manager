const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

export const MAX_COVER_BYTES = 5 * 1024 * 1024

/** A valid PNG. The bytes after the end of the image reach the requested size. */
export function pngFile(size?: number): Cypress.FileReferenceObject {
  const image = Cypress.Buffer.from(ONE_PIXEL_PNG, 'base64')
  const padding = Cypress.Buffer.alloc(size ? size - image.length : 0)

  return {
    contents: Cypress.Buffer.concat([image, padding]),
    fileName: 'capa.png',
    mimeType: 'image/png',
  }
}

export function fakePngFile(): Cypress.FileReferenceObject {
  return {
    contents: Cypress.Buffer.from('this is not an image'),
    fileName: 'capa.png',
    mimeType: 'image/png',
  }
}

export function pdfFile(): Cypress.FileReferenceObject {
  return {
    contents: Cypress.Buffer.from('%PDF-1.7'),
    fileName: 'capa.pdf',
    mimeType: 'application/pdf',
  }
}
