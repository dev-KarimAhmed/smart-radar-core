import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import express from 'express';
import next from 'next';
import { passwordResetRouter } from './src/server/api/password-reset';
import { driverExpressRouter } from './src/server/api/driver-express-routes';
import { delegateExpressRouter } from './src/server/api/delegate-express-routes';
import { rateLimiterMiddleware } from './src/server/middleware/server-rate-limiter';

async function startServer() {
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev, hostname: '0.0.0.0', port: 3000 });
  const nextHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = express();
  const PORT = 3000;

  // Parse JSON bodies ONLY for custom Express endpoints that need req.body.
  // Next.js App Router API routes (/api/auth/, /api/admin/, /api/captain/, /api/maps/, etc.)
  // handle their own body streaming natively via Web API Request.json().
  const jsonParser = express.json();
  const expressRoutesWithBody = [
    '/api/password-reset',
    '/api/revive-driver',
    '/api/redeem-voucher',
    '/api/commute-driver',
    '/api/kill-switch',
    '/api/clear-delegate-dues',
    '/api/verify-signatures',
    '/api/reconcile-and-sign',
    '/api/generate-magic-link',
    '/api/verify-magic-link',
    '/api/delegate-task-transition',
  ];

  app.use((req, res, next) => {
    // Only parse JSON for designated Express endpoints; all Next.js routes bypass
    if (expressRoutesWithBody.some(r => req.path.startsWith(r))) {
      return jsonParser(req, res, next);
    }
    return next();
  });

  // Mount Express API Routers
  app.use('/api', rateLimiterMiddleware, passwordResetRouter);
  app.use('/api', driverExpressRouter);
  app.use('/api', delegateExpressRouter);

  // Diagnostic Endpoint for Sovereignties (Zone D)
  app.get('/api/health', (req, res) => {
    const memory = process.memoryUsage();
    return res.json({
      status: 'healthy',
      system: 'Sovereign Radar Core',
      serverTime: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      securityShield: 'Active (Protocol 88)',
      diagnostics: {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`
      }
    });
  });

  // Next.js page routing handler
  app.all('*all', (req, res) => {
    return nextHandler(req, res);
  });

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    try {
      const { initSovereign72hPurgeWorker } = await import('./src/server/cron/purge-72h-ledger');
      initSovereign72hPurgeWorker();
    } catch (err) {
      console.error('[Purge Worker Init Error]:', err);
    }
  });
}

startServer();
