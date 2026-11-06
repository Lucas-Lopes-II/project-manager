import { request } from '@/shared/api/client'

export interface Project {
  id: string
  name: string
  client: string
  start_date: string
  end_date: string
  favorite: boolean
  cover_url: string | null
  created_at: string
  updated_at: string
}

export interface ProjectList {
  items: Project[]
  total: number
}

export interface ProjectInput {
  name: string
  client: string
  start_date: string
  end_date: string
  cover: File | null
  /** Removes the current cover when saving. A new file takes precedence over it. */
  removeCover?: boolean
}

/** The orders of the list (ADR-0029). `name` is the default. */
export type ProjectSort = 'name' | 'recent' | 'deadline'

export interface ListFilter {
  favoritesOnly?: boolean
  sort?: ProjectSort
  /** Keeps the projects whose name contains it, ignoring case and accents (ADR-0032). */
  query?: string
}

/** The total of the answer always counts every registered project, whatever the filter. */
export function listProjects(signal?: AbortSignal, filter: ListFilter = {}): Promise<ProjectList> {
  const params = new URLSearchParams()
  if (filter.favoritesOnly) {
    params.set('favorite', 'true')
  }
  if (filter.sort && filter.sort !== 'name') {
    params.set('sort', filter.sort)
  }
  if (filter.query) {
    params.set('q', filter.query)
  }

  const query = params.toString()
  return request<ProjectList>(query ? `/projects?${query}` : '/projects', { signal })
}

/** Marks or unmarks a project. Repeating it gives the same result. */
export function setFavorite(id: string, favorite: boolean): Promise<void> {
  return request<void>(`/projects/${encodeURIComponent(id)}/favorite`, {
    method: favorite ? 'PUT' : 'DELETE',
  })
}

export function createProject(input: ProjectInput): Promise<Project> {
  return request<Project>('/projects', { method: 'POST', body: toFormData(input) })
}

export function getProject(id: string, signal?: AbortSignal): Promise<Project> {
  return request<Project>(`/projects/${encodeURIComponent(id)}`, { signal })
}

export function updateProject(id: string, input: ProjectInput): Promise<Project> {
  return request<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: toFormData(input),
  })
}

export function deleteProject(id: string): Promise<void> {
  return request<void>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

function toFormData({ cover, removeCover, ...fields }: ProjectInput): FormData {
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    form.set(name, value)
  }
  if (cover) {
    form.set('cover', cover)
  } else if (removeCover) {
    form.set('remove_cover', 'true')
  }
  return form
}
