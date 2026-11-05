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
}

export function listProjects(signal?: AbortSignal): Promise<ProjectList> {
  return request<ProjectList>('/projects', { signal })
}

export function createProject(input: ProjectInput): Promise<Project> {
  return request<Project>('/projects', { method: 'POST', body: toFormData(input) })
}

function toFormData({ cover, ...fields }: ProjectInput): FormData {
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    form.set(name, value)
  }
  if (cover) {
    form.set('cover', cover)
  }
  return form
}
