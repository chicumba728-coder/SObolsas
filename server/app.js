import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HttpError } from './validation.js';
import { authRouter, loadSession } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { meRouter } from './routes/me.js';
import { adminRouter } from './routes/admin.js';

export function createApp(db, { staticDir = resolve(import.meta.dirname, '..', 'dist') } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

  const api = express.Router();
  api.use(express.json({ limit: '100kb' }));

  // Proteção CSRF: pedidos que alteram dados têm de ser JSON. Um formulário noutro site
  // não consegue enviar application/json sem pré-verificação CORS (que este servidor não autoriza).
  api.use((req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.is('application/json')) {
      throw new HttpError(415, 'Os pedidos devem ser enviados em JSON.');
    }
    next();
  });

  api.use(loadSession(db));
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use('/auth', authRouter(db));
  api.use('/me', meRouter(db));
  api.use('/admin', adminRouter(db));
  api.use('/', publicRouter(db));
  api.use((_req, _res) => { throw new HttpError(404, 'Recurso não encontrado.'); });

  // eslint-disable-next-line no-unused-vars
  api.use((error, _req, res, _next) => {
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message, fields: error.fields });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Pedido inválido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Pedido demasiado grande.' });
    if (String(error.message).includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Este registo já existe.' });
    console.error(error);
    return res.status(500).json({ error: 'Ocorreu um erro no servidor. Tente novamente.' });
  });

  app.use('/api', api);

  // Produção: serve o frontend compilado (pnpm build) com fallback de SPA.
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(resolve(staticDir, 'index.html'));
    });
  }

  return app;
}
