import { ApiError } from './errors.js'
import type { ProjectInput } from './projects.js'

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export function parseYouTubeUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  let url: URL
  try { url = new URL(value.trim()) } catch { throw new ApiError(400, 'Enter a valid YouTube URL.') }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) throw new ApiError(400, 'Enter a secure YouTube URL without embedded credentials or a custom port.')
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  let id = ''
  if (host === 'youtu.be') {
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length === 1) id = parts[0]
  }
  else if (host === 'youtube.com' || host === 'm.youtube.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    if (url.pathname === '/watch') id = url.searchParams.get('v') ?? ''
    else if (parts[0] === 'shorts' && parts.length === 2) id = parts[1]
  }
  if (!VIDEO_ID.test(id)) throw new ApiError(400, 'Use a valid YouTube watch, youtu.be, or Shorts URL.')
  return id
}

function stringField(source: Record<string, unknown>, key: string, max: number, required = false): string {
  const value = source[key] ?? ''
  if (typeof value !== 'string') throw new ApiError(400, `${key} must be text.`)
  const clean = value.trim()
  if (clean.length > max) throw new ApiError(400, `${key} must be ${max} characters or fewer.`)
  if (required && !clean) throw new ApiError(400, `${key} is required.`)
  return clean
}

export function validateProject(body: unknown): ProjectInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Project data must be an object.')
  const source = body as Record<string, unknown>
  const slug = stringField(source, 'slug', 120, true).toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ApiError(400, 'Slug can contain lowercase letters, numbers, and single hyphens.')
  const sortOrder = Number(source.sortOrder ?? 0)
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000000) throw new ApiError(400, 'Display order must be a whole number from 0 to 1000000.')
  for (const key of ['isFeatured', 'isPublished']) if (typeof source[key] !== 'boolean') throw new ApiError(400, `${key} must be true or false.`)
  return {
    title: stringField(source, 'title', 180, true), slug,
    category: stringField(source, 'category', 100), description: stringField(source, 'description', 5000),
    videoId: parseYouTubeUrl(source.youtubeUrl), client: stringField(source, 'client', 180),
    editor: stringField(source, 'editor', 180), year: stringField(source, 'year', 12),
    isFeatured: source.isFeatured as boolean, isPublished: source.isPublished as boolean, sortOrder,
  }
}
