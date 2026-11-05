import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import argon2 from 'argon2'
import { ApiError } from './errors.js'

const COOKIE = 'collective_session'
const SESSION_SECONDS = 8 * 60 * 60
interface Session { exp: number; csrf: string }
const localAttempts = new Map<string, { count: number; reset: number }>()

function secret(): string {
  const value = process.env.SESSION_SECRET ?? ''
  if (value.length < 32) throw new ApiError(503, 'Session signing is not configured.', 'auth_not_configured')
  return value
}
function sign(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url') }
function cookieOptions(maxAge?: number) {
  return [`Path=/`, 'HttpOnly', 'SameSite=Lax', ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []), ...(maxAge ? [`Max-Age=${maxAge}`] : ['Max-Age=0'])].join('; ')
}
function readSession(req: Request): Session | null {
  const raw = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!raw) return null
  let decoded = ''
  try { decoded = decodeURIComponent(raw) } catch { return null }
  const [payload, signature] = decoded.split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    return data.exp > Date.now() ? data : null
  } catch { return null }
}
function setSession(res: Response): string {
  const session = { exp: Date.now() + SESSION_SECONDS * 1000, csrf: randomBytes(32).toString('base64url') }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(`${payload}.${sign(payload)}`)}; ${cookieOptions(SESSION_SECONDS)}`)
  return session.csrf
}
export function clearSession(res: Response) { res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieOptions()}`) }

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!readSession(req)) return next(new ApiError(401, 'Sign in to continue.', 'unauthorized'))
  next()
}
export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  const session = readSession(req)
  const token = req.get('X-CSRF-Token') ?? ''
  if (!session || !token || token.length !== session.csrf.length || !timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf))) {
    return next(new ApiError(403, 'Your session token is missing or expired. Refresh and try again.', 'csrf_invalid'))
  }
  next()
}
export function sessionInfo(req: Request): Session | null { return readSession(req) }

export async function login(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    // A process-local limiter is unsafe across hosted instances. Fail closed until a shared store is approved.
    throw new ApiError(503, 'Login is temporarily unavailable until shared rate limiting is configured.', 'shared_rate_limit_required')
  }
  const key = req.ip || 'local'
  const now = Date.now()
  const entry = localAttempts.get(key)
  if (entry && entry.reset > now && entry.count >= 5) throw new ApiError(429, 'Too many login attempts. Try again later.', 'login_rate_limited')
  const password = req.body?.password
  const encodedHash = process.env.ADMIN_PASSWORD_HASH ?? ''
  if (typeof password !== 'string' || !encodedHash.startsWith('$argon2id$')) {
    if (!entry || entry.reset <= now) localAttempts.set(key, { count: 1, reset: now + 15 * 60 * 1000 })
    else entry.count++
    throw new ApiError(401, 'The password was not accepted.', 'invalid_credentials')
  }
  let valid = false
  try { valid = await argon2.verify(encodedHash, password) } catch { valid = false }
  if (!valid) {
    if (!entry || entry.reset <= now) localAttempts.set(key, { count: 1, reset: now + 15 * 60 * 1000 })
    else entry.count++
    throw new ApiError(401, 'The password was not accepted.', 'invalid_credentials')
  }
  localAttempts.delete(key)
  res.json({ authenticated: true, csrfToken: setSession(res) })
}
