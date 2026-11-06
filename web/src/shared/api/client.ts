const BASE_URL = '/api/v1'

export interface FieldError {
  field: string
  code: string
}

interface Problem {
  title?: string
  detail?: string
  code?: string
  request_id?: string
  errors?: FieldError[]
}

/** An error answered by the API, or status 0 when the API could not be reached. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]
  readonly requestId?: string
  /** Identifies an error that is not about a single field, such as `project_limit`. */
  readonly code?: string

  constructor(
    status: number,
    message: string,
    fieldErrors: FieldError[] = [],
    requestId?: string,
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.requestId = requestId
    this.code = code
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

/** Calls the API. A canceled request rejects with the original AbortError. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  // The browser sets the Content-Type of a form, because it includes the boundary.
  const isJson = body !== undefined && !(body instanceof FormData)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
      body: isJson ? JSON.stringify(body) : (body as FormData | undefined),
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    throw new ApiError(0, 'Não foi possível conectar à API.')
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'AbortError'
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readProblem(response)

  return new ApiError(
    response.status,
    problem.detail ?? problem.title ?? response.statusText,
    problem.errors,
    problem.request_id,
    problem.code,
  )
}

// A proxy can answer with an error that has no JSON body, such as an HTML 502.
async function readProblem(response: Response): Promise<Problem> {
  try {
    return (await response.json()) as Problem
  } catch {
    return {}
  }
}
