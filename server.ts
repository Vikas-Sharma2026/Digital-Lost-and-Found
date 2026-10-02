import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sqliteDb } from './server/db.js';
import { embeddingService } from './server/matching/embeddings/embeddingService.js';
import authRoutes from './server/routes/authRoutes.js';
import itemRoutes from './server/routes/itemRoutes.js';
import claimRoutes from './server/routes/claimRoutes.js';
import matchRoutes from './server/routes/matchRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize SQLite Database with tables, seeds and persistence
  await sqliteDb.init();

  // Asynchronously compute AI vector embeddings for initial items
  embeddingService.preWarmDatabaseEmbeddings().then(count => {
    if (count > 0) {
      console.log(`🧠 Generated vector embeddings for ${count} catalog items`);
    }
  }).catch(e => {
    console.warn('Initial embedding warm-up notice:', e?.message || e);
  });

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser with 20MB limit for image uploads as base64 data URLs
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/claims', claimRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Frontend integration: Vite middleware in development, static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Digital Lost & Found server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
