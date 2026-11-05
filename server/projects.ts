import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'

export interface ProjectInput {
  title: string
  slug: string
  category: string
  description: string
  videoId: string
  client: string
  editor: string
  year: string
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number
}

export interface AdminProject extends ProjectInput {
  id: string
  youtubeUrl: string
  createdAt: string
  updatedAt: string
}

export interface PublicProject {
  slug: string
  title: string
  category: string
  description: string
  videoId: string
  client: string
  editor: string
  year: string
  image: string
  imageAlt: string
  featured: boolean
}

function readString(row: Row, key: string): string {
  const value = row[key]
  return value === null || value === undefined ? '' : String(value)
}

export function toAdminProject(row: Row): AdminProject {
  const videoId = readString(row, 'youtube_video_id')
  return {
    id: readString(row, 'id'),
    title: readString(row, 'title'),
    slug: readString(row, 'slug'),
    category: readString(row, 'category'),
    description: readString(row, 'description'),
    videoId,
    youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
    client: readString(row, 'client'),
    editor: readString(row, 'editor'),
    year: readString(row, 'year'),
    isFeatured: Number(row.is_featured) === 1,
    isPublished: Number(row.is_published) === 1,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: readString(row, 'created_at'),
    updatedAt: readString(row, 'updated_at'),
  }
}

export function toPublicProject(project: AdminProject): PublicProject {
  return {
    slug: project.slug,
    title: project.title,
    category: project.category,
    description: project.description,
    videoId: project.videoId,
    client: project.client,
    editor: project.editor,
    year: project.year,
    image: project.videoId ? `https://img.youtube.com/vi/${project.videoId}/hqdefault.jpg` : '',
    imageAlt: project.title,
    featured: project.isFeatured,
  }
}

const columns = `id, title, slug, category, description, youtube_video_id, client,
  editor, year, is_featured, is_published, sort_order, created_at, updated_at`

export async function listPublished(db: Client): Promise<PublicProject[]> {
  const result = await db.execute({
    sql: `SELECT ${columns} FROM projects WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC`,
    args: [],
  })
  return result.rows.map((row) => toPublicProject(toAdminProject(row)))
}

export async function listFeatured(db: Client): Promise<PublicProject[]> {
  const result = await db.execute({
    sql: `SELECT ${columns} FROM projects WHERE is_published = 1 AND is_featured = 1 ORDER BY sort_order ASC, created_at DESC`,
    args: [],
  })
  return result.rows.map((row) => toPublicProject(toAdminProject(row)))
}

export async function findPublishedBySlug(db: Client, slug: string): Promise<PublicProject | null> {
  const result = await db.execute({
    sql: `SELECT ${columns} FROM projects WHERE slug = ? AND is_published = 1 LIMIT 1`,
    args: [slug],
  })
  return result.rows[0] ? toPublicProject(toAdminProject(result.rows[0])) : null
}

export async function listAdminProjects(db: Client): Promise<AdminProject[]> {
  const result = await db.execute({
    sql: `SELECT ${columns} FROM projects ORDER BY sort_order ASC, created_at DESC`,
    args: [],
  })
  return result.rows.map(toAdminProject)
}

export async function findAdminById(db: Client, id: string): Promise<AdminProject | null> {
  const result = await db.execute({ sql: `SELECT ${columns} FROM projects WHERE id = ? LIMIT 1`, args: [id] })
  return result.rows[0] ? toAdminProject(result.rows[0]) : null
}

export async function insertProject(db: Client, project: ProjectInput): Promise<AdminProject> {
  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO projects (
      id, title, slug, category, description, youtube_video_id, client, editor,
      year, is_featured, is_published, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, project.title, project.slug, project.category, project.description, project.videoId,
      project.client, project.editor, project.year, Number(project.isFeatured), Number(project.isPublished), project.sortOrder],
  })
  const created = await findAdminById(db, id)
  if (!created) throw new Error('Created project could not be loaded.')
  return created
}

export async function replaceProject(db: Client, id: string, project: ProjectInput): Promise<AdminProject | null> {
  const result = await db.execute({
    sql: `UPDATE projects SET title = ?, slug = ?, category = ?, description = ?, youtube_video_id = ?,
      client = ?, editor = ?, year = ?, is_featured = ?, is_published = ?, sort_order = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    args: [project.title, project.slug, project.category, project.description, project.videoId,
      project.client, project.editor, project.year, Number(project.isFeatured), Number(project.isPublished), project.sortOrder, id],
  })
  return result.rowsAffected ? findAdminById(db, id) : null
}

export async function removeProject(db: Client, id: string): Promise<boolean> {
  const result = await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] })
  return result.rowsAffected > 0
}
