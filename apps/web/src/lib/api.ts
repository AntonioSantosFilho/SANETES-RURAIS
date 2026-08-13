export type Role = 'admin' | 'field'

export type User = { id: string; name: string; login: string; role: Role }
export type System = {
  id: string
  name: string
  city: string
  responsibleName: string
  coordinates?: string | null
  residentsCount?: number | null
  fieldUserId?: string | null
  lastVisitAt?: string | null
  status: 'active' | 'inactive'
  createdAt: string
}
export type Answer = { value: string; date?: string; detail?: string }
export type Monitoring = {
  id: string
  systemId: string
  userId: string
  answers: Record<string, Answer>
  report?: string | null
  feedback: { quality: string; recommendations: string[] }
  status: string
  createdAt: string
  system?: System
  photos?: Array<{ id: string; category: string; originalName: string; url: string }>
}
export type Session = { token: string; user: User; systems: System[] }
export type AccessLog = {
  id: string
  userId?: string | null
  login: string
  role?: Role | null
  success: boolean
  ipAddress: string
  userAgent?: string | null
  createdAt: string
}

const tokenKey = 'sanetes.session'
const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export function apiResourceUrl(path: string) {
  if (/^(?:https?:|data:|blob:)/i.test(path) || !/^https?:\/\//i.test(apiBaseUrl)) return path
  return new URL(path.startsWith('/') ? path : `/${path}`, new URL(apiBaseUrl).origin).toString()
}

export function loadSession(): Session | null {
  try {
    const value = localStorage.getItem(tokenKey)
    return value ? JSON.parse(value) as Session : null
  } catch { return null }
}

export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(tokenKey, JSON.stringify(session))
  else localStorage.removeItem(tokenKey)
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({})) as { message?: string }
  if (!response.ok) throw new Error(data.message ?? `Erro HTTP ${response.status}`)
  return data as T
}
