import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import type { Client } from '@libsql/client'
import { createApi } from './api.js'
import { initializeDatabase } from './db.js'
import { errorHandler } from './errors.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')

export async function createApp(db: Client) {
  await initializeDatabase(db)
  const app = express()
  app.disable('x-powered-by')
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
  app.use(express.json({ limit: '32kb', type: 'application/json' }))
  app.use('/api', createApi(db))
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.', code: 'not_found' }))

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite')
    const vite = await createServer({ configFile: path.join(projectRoot, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'spa' })
    app.use(vite.middlewares)
  } else {
    const dist = path.join(projectRoot, 'dist')
    app.use(express.static(dist, { index: false, fallthrough: true, maxAge: '1h' }))
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }
  app.use(errorHandler)
  return app
}
