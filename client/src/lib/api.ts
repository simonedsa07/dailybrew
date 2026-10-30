const API_BASE = '/api/v1'

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  beansEarned?: number
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`)
  }

  return result as ApiResponse<T>
}
