// Dev-server-only endpoints the editor uses to save the shelf.
// They do not exist in the production build, so the deployed site is read-only.
import { readFile, writeFile } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import type { Plugin } from 'vite'
import { spineInkFromCover } from './spineInk'

export const BOOKS_FILE = 'src/data/books.json'

function body(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export function booksApi(): Plugin {
  return {
    name: 'book-palace-api',
    apply: 'serve',
    config: () => ({
      // the editor writes this file; don't reload the page when it changes
      server: { watch: { ignored: [`**/${BOOKS_FILE}`] } },
    }),
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const send = (status: number, payload: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }
        try {
          if (url.pathname === '/api/books' && req.method === 'GET') {
            return send(200, JSON.parse(await readFile(BOOKS_FILE, 'utf8')))
          }
          if (url.pathname === '/api/books' && req.method === 'PUT') {
            const books = JSON.parse(await body(req))
            if (!Array.isArray(books)) return send(400, { error: 'Expected a list of books.' })
            await writeFile(BOOKS_FILE, JSON.stringify(books, null, 2) + '\n')
            return send(200, { saved: books.length })
          }
          if (url.pathname === '/api/spine-ink' && req.method === 'GET') {
            const ink = await spineInkFromCover(url.searchParams.get('cover') ?? undefined, url.searchParams.get('title') ?? '')
            return send(200, { ink })
          }
        } catch (err) {
          return send(500, { error: err instanceof Error ? err.message : String(err) })
        }
        next()
      })
    },
  }
}
