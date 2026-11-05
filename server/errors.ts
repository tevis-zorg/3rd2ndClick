import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = 'request_error') { super(message) }
}

export const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { void handler(req, res, next).catch(next) }

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code })
  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    return res.status(409).json({ error: 'A project with this slug already exists.', code: 'slug_conflict' })
  }
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Request body must contain valid JSON.', code: 'invalid_json' })
  console.error('Unhandled API error:', error)
  return res.status(500).json({ error: 'An unexpected server error occurred.', code: 'internal_error' })
}
