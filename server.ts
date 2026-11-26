import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { repository } from './server/repository';
import { applyMutation } from './server/service';
import { ValidationError, validateRole } from './server/validation';
import type { IkanaraState, MutationEnvelope } from './src/domain/types';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function bootstrapServer() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  // Lightweight security headers (iframe-compatible)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/state', (_req, res) => {
    const state = repository.getState();
    res.json(state);
  });

  app.post('/api/mutate', async (req, res) => {
    try {
      const role = validateRole(req.header('x-ikanara-role'));
      const envelope = req.body as MutationEnvelope;
      if (!envelope || !envelope.action || !envelope.action.type) {
        throw new ValidationError('Payload mutasi tidak lengkap.');
      }

      const result = await repository.runTransaction(
        envelope.mutationId || `srv-${Date.now()}`,
        (currentState) => applyMutation(currentState, role, envelope.action)
      );

      res.json(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error('[IKANARA] Mutation error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan pada server saat menyimpan data.' });
    }
  });

  app.get('/api/backup', (_req, res) => {
    const state = repository.getState();
    res.setHeader('Content-Disposition', `attachment; filename="ikanara-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(state);
  });

  app.post('/api/restore', async (req, res) => {
    try {
      validateRole(req.header('x-ikanara-role'));
      const candidate = req.body as IkanaraState;
      if (
        !candidate ||
        !Array.isArray(candidate.ponds) ||
        !Array.isArray(candidate.financialTransactions) ||
        !candidate.settings
      ) {
        throw new ValidationError('Format file cadangan IKANARA tidak valid.');
      }
      const nextState = await repository.replaceState(candidate);
      res.json({ state: nextState });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Gagal memulihkan data cadangan.' });
    }
  });

  app.post('/api/reset', async (req, res) => {
    try {
      const role = validateRole(req.header('x-ikanara-role'));
      if (role !== 'admin') {
        throw new ValidationError('Hanya Admin yang dapat mereset data operasional awal.', 403);
      }
      const state = await repository.resetToInitial();
      res.json({ state });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Gagal mengatur ulang data awal.' });
    }
  });

  if (IS_PROD) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback to index.html for unknown routes in dev
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const htmlPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IKANARA] Server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer();
