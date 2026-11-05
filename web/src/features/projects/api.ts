import { request } from '@/shared/api/client'

export interface Project {
  id: string
  name: string
  client: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface ProjectList {
  items: Project[]
  total: number
}

export function listProjects(signal?: AbortSignal): Promise<ProjectList> {
  return request<ProjectList>('/projects', { signal })
}
