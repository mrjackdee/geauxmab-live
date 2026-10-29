import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev, /api/* and /journal/rss.xml run the same Worker code as production (site-worker/index.ts).
// Journal entries written locally are kept in .dev-journal.json (git-ignored); the Access sign-in is skipped.
const DEV_KV_FILE = path.resolve(__dirname, '.dev-journal.json');
const devKV = {
  read: (): Record<string, string> => { try { return JSON.parse(fs.readFileSync(DEV_KV_FILE, 'utf8')); } catch { return {}; } },
  async get(key: string) { return this.read()[key] ?? null; },
  async put(key: string, value: string) { const d = this.read(); d[key] = value; fs.writeFileSync(DEV_KV_FILE, JSON.stringify(d, null, 2)); },
  async delete(key: string) { const d = this.read(); delete d[key]; fs.writeFileSync(DEV_KV_FILE, JSON.stringify(d, null, 2)); },
};

const siteWorker = (): Plugin => ({
  name: 'site-worker-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !(req.url.startsWith('/api/') || req.url.startsWith('/journal/'))) return next();
      try {
        const { handle } = await server.ssrLoadModule(path.resolve(__dirname, 'site-worker/index.ts'));
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request(`http://localhost:3000${req.url}`, {
          method: req.method,
          headers: { 'content-type': String(req.headers['content-type'] || '') },
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          redirect: 'manual',
        });
        const response: Response = await handle(request, {
          JOURNAL: devKV, JOURNAL_AUTHOR: 'jd@geauxmab.com', SITE_URL: 'http://localhost:3000', DEV: '1',
        });
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (e) {
        next(e);
      }
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react(), siteWorker()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
