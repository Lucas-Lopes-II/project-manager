import { request } from '@/shared/api/client'

export interface Project {
  id: string
  name: string
  client: string
  start_date: string
  end_date: string
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

export function listProjects(signal?: AbortSignal): Promise<ProjectList> {
  return request<ProjectList>('/projects', { signal })
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
