import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Project } from '../data/projects.ts'

export interface AdminProject extends Project {
  id: string
  youtubeUrl: string
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
export type ProjectChanges = Omit<AdminProject, 'id' | 'createdAt' | 'updatedAt' | 'image' | 'imageAlt' | 'featured'>
interface ContextValue {
  projects: AdminProject[]
  authenticated: boolean
  loading: boolean
  error: string
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
  createProject: (project: ProjectChanges) => Promise<AdminProject>
  updateProject: (id: string, changes: Partial<ProjectChanges>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}
const Context = createContext<ContextValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [csrf, setCsrf] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const request = useCallback(async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers)
    if (init.body) headers.set('Content-Type', 'application/json')
    if (init.method && init.method !== 'GET' && init.method !== 'HEAD' && csrf) headers.set('X-CSRF-Token', csrf)
    const response = await fetch(url, { ...init, headers, credentials: 'same-origin' })
    if (!response.ok) {
      if (response.status === 401 && url.startsWith('/api/admin/') && !url.endsWith('/login')) {
        setAuthenticated(false)
        setCsrf('')
        setProjects([])
      }
      const body = await response.json().catch(() => ({})) as { error?: string }
      throw new Error(body.error || `Request failed (${response.status}).`)
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
  }, [csrf])

  const establishSession = useCallback(async (password?: string) => {
    if (password !== undefined) {
      const result = await request<{ authenticated: boolean; csrfToken: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
      setCsrf(result.csrfToken)
      setAuthenticated(true)
    } else {
      const result = await request<{ authenticated: boolean; csrfToken: string }>('/api/admin/session')
      setCsrf(result.csrfToken)
      setAuthenticated(true)
    }
    const items = await request<AdminProject[]>('/api/admin/projects')
    setProjects(items)
    setError('')
  }, [request])

  useEffect(() => {
    establishSession().catch(() => setAuthenticated(false)).finally(() => setLoading(false))
  // Initial session check intentionally runs once; request's csrf state changes after login.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const withError = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try { const value = await operation(); setError(''); return value }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'Request failed.'); throw issue }
  }, [])
  const value = useMemo<ContextValue>(() => ({
    projects, authenticated, loading, error,
    login: (password) => withError(() => establishSession(password)),
    logout: () => withError(async () => { await request('/api/admin/logout', { method: 'POST' }); setAuthenticated(false); setCsrf(''); setProjects([]) }),
    createProject: (project) => withError(async () => { const created = await request<AdminProject>('/api/admin/projects', { method: 'POST', body: JSON.stringify(project) }); setProjects((items) => [...items, created]); return created }),
    updateProject: (id, changes) => withError(async () => {
      const current = projects.find((item) => item.id === id)
      if (!current) throw new Error('Project no longer exists.')
      const merged = { ...current, ...changes }
      const payload = { title: merged.title, slug: merged.slug, category: merged.category, description: merged.description, youtubeUrl: merged.youtubeUrl, client: merged.client, editor: merged.editor, year: merged.year, isFeatured: merged.isFeatured, isPublished: merged.isPublished, sortOrder: merged.sortOrder }
      const updated = await request<AdminProject>(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
      setProjects((items) => items.map((item) => item.id === id ? updated : item))
    }),
    deleteProject: (id) => withError(async () => { await request(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }); setProjects((items) => items.filter((item) => item.id !== id)) }),
  }), [projects, authenticated, loading, error, request, establishSession, withError])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAdminData() {
  const context = useContext(Context)
  if (!context) throw new Error('useAdminData must be used within AdminDataProvider')
  return context
}
