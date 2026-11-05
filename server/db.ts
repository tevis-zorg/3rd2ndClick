import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

const schema = [
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    youtube_video_id TEXT NOT NULL DEFAULT '',
    client TEXT NOT NULL DEFAULT '',
    editor TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_projects_public_order ON projects (is_published, sort_order, created_at)',
  'CREATE INDEX IF NOT EXISTS idx_projects_featured_order ON projects (is_featured, is_published, sort_order)',
]

export function createDatabase(env: NodeJS.ProcessEnv = process.env): Client {
  const production = env.NODE_ENV === 'production'
  const url = env.TURSO_DATABASE_URL?.trim()
  const authToken = env.TURSO_AUTH_TOKEN?.trim()

  if (production && (!url || !authToken)) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production.')
  }

  if (!production && !url) {
    return createClient({ url: 'file::memory:' })
  }

  if (!url) throw new Error('TURSO_DATABASE_URL is required.')
  if (production && url.startsWith('file:')) {
    throw new Error('A local SQLite file cannot be used as the production database.')
  }

  return createClient({ url, ...(authToken ? { authToken } : {}) })
}

export async function initializeDatabase(db: Client): Promise<void> {
  for (const sql of schema) await db.execute(sql)
}
