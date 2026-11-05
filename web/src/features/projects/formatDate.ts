const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats a date from the API, which has no time, without moving it to another day. */
export function formatDate(date: string): string {
  return formatter.format(new Date(`${date}T00:00:00Z`))
}
