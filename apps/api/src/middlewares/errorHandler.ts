import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors'

const WEB_APP_URL = process.env.WEB_APP_URL ?? '/'

function renderErrorPage(statusCode: number, message: string) {
  const title =
    statusCode === 404
      ? 'Link not found'
      : statusCode === 410
      ? 'Link expired'
      : statusCode === 400
      ? 'Bad request'
      : statusCode >= 500
      ? 'Something went wrong'
      : 'Error'

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${statusCode} — ${title}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; background: #0b0f19; color: #e5e7eb; }
      .wrap { height: 100vh; display: flex; align-items: center; justify-content: center;}
      .card { max-width: 560px; width: 100%; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; }
      .badge { display: inline-block; font-size: 12px; padding: 4px 10px; border-radius: 999px; background: #1f2937; border: 1px solid #374151; }
      h1 { margin: 12px 0 8px; font-size: 22px; }
      p { margin: 0 0 16px; color: #9ca3af; line-height: 1.5; }
      a { color: #e5e7eb; text-decoration: none; }
      .btn { display: inline-block; margin-top: 8px; padding: 10px 14px; border-radius: 12px; background: #2563eb; }
      .btn:hover { opacity: 0.9; }
      .muted { font-size: 12px; color: #6b7280; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <main class="card">
        <span class="badge">${statusCode}</span>
        <h1>${title}</h1>
        <p>${escapeHtml(message)}</p>
        <a class="btn" href="${escapeHtml(WEB_APP_URL)}">Go to app</a>
        <div class="muted">If you think this is a mistake, double-check the link.</div>
      </main>
    </div>
  </body>
</html>`
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function wantsHtml(req: Request) {
  return Boolean(req.accepts(['html', 'json']) === 'html')
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (wantsHtml(req)) {
      return res
        .status(err.statusCode)
        .type('html')
        .send(renderErrorPage(err.statusCode, err.message))
    }

    return res.status(err.statusCode).json({ error: err.message })
  }

  console.error('Unhandled error:', err instanceof Error ? err.message : err)

  if (wantsHtml(req)) {
    return res.status(500).type('html').send(renderErrorPage(500, 'Internal server error'))
  }

  return res.status(500).json({ error: 'Internal server error' })
}
