// © MrJackDee™. All rights reserved.
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Standalone build for the booking app at https://book.geauxmab.com
// Build: npm run build:book  ->  output in dist-book/
//
// In dev, /api/* runs the same Worker code (worker/index.ts).
// Put CALENDLY_TOKEN=... in .env.local for real availability; without it, slots are faked.
const workerApi = (env: Record<string, string>): Plugin => ({
  name: 'book-worker-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();
      try {
        const { handleApi } = await server.ssrLoadModule(path.resolve(__dirname, 'worker/index.ts'));
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: { 'content-type': String(req.headers['content-type'] || '') },
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
        });
        const response: Response = await handleApi(request, {
          CALENDLY_TOKEN: env.CALENDLY_TOKEN,
          CALENDLY_EVENT_TYPE: 'https://api.calendly.com/event_types/dc9fc8cf-9a0c-4902-8035-35437aaa16fa',
          MOCK_CALENDLY: env.CALENDLY_TOKEN ? '0' : '1',
        });
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      } catch (e) {
        next(e);
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    root: path.resolve(__dirname, 'calendar'),
    publicDir: path.resolve(__dirname, 'calendar/public'),
    base: '/',
    plugins: [tailwindcss(), react(), workerApi(env)],
    build: {
      outDir: path.resolve(__dirname, 'dist-book'),
      emptyOutDir: true,
    },
    server: { port: 3001, host: '0.0.0.0', fs: { allow: [path.resolve(__dirname)] } },
    preview: { port: 4174, host: '127.0.0.1' },
  };
});
