import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import type { Client } from '@libsql/client'
import { clearSession, login, requireAdmin, requireCsrf, sessionInfo } from './auth.js'
import { ApiError, asyncRoute } from './errors.js'
import { findAdminById, findPublishedBySlug, insertProject, listAdminProjects, listFeatured, listPublished, removeProject, replaceProject } from './projects.js'
import { validateProject } from './validation.js'

export function createApi(db: Client) {
  const api = Router()
  const admin = Router()
  const preventCaching = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  }
  api.get('/projects', asyncRoute(async (_req, res) => res.json(await listPublished(db))))
  api.get('/projects/featured', asyncRoute(async (_req, res) => res.json(await listFeatured(db))))
  api.get('/projects/:slug', asyncRoute(async (req, res) => {
    const project = await findPublishedBySlug(db, req.params.slug)
    if (!project) throw new ApiError(404, 'Project not found.', 'not_found')
    res.json(project)
  }))
  api.post('/admin/login', preventCaching, asyncRoute(login))
  api.use('/admin', preventCaching)
  admin.get('/session', (req, res, next) => {
    const session = sessionInfo(req)
    if (!session) return next(new ApiError(401, 'Sign in to continue.', 'unauthorized'))
    res.json({ authenticated: true, csrfToken: session.csrf })
  })
  admin.post('/logout', requireCsrf, (_req, res) => { clearSession(res); res.json({ authenticated: false }) })
  admin.get('/projects', asyncRoute(async (_req, res) => res.json(await listAdminProjects(db))))
  admin.post('/projects', requireCsrf, asyncRoute(async (req, res) => res.status(201).json(await insertProject(db, validateProject(req.body)))))
  admin.get('/projects/:id', asyncRoute(async (req, res) => {
    const project = await findAdminById(db, req.params.id)
    if (!project) throw new ApiError(404, 'Project not found.', 'not_found')
    res.json(project)
  }))
  admin.put('/projects/:id', requireCsrf, asyncRoute(async (req, res) => {
    const project = await replaceProject(db, req.params.id, validateProject(req.body))
    if (!project) throw new ApiError(404, 'Project not found.', 'not_found')
    res.json(project)
  }))
  admin.delete('/projects/:id', requireCsrf, asyncRoute(async (req, res) => {
    if (!await removeProject(db, req.params.id)) throw new ApiError(404, 'Project not found.', 'not_found')
    res.status(204).end()
  }))
  api.use('/admin', requireAdmin, admin)
  return api
}
