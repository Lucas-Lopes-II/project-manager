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

export interface ListFilter {
  favoritesOnly?: boolean
}

/** The total of the answer always counts every registered project, whatever the filter. */
export function listProjects(signal?: AbortSignal, filter: ListFilter = {}): Promise<ProjectList> {
  const query = filter.favoritesOnly ? '?favorite=true' : ''
  return request<ProjectList>(`/projects${query}`, { signal })
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
