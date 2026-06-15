import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import owners from './routes/owners';
import pets from './routes/pets';
import vets from './routes/vets';
import pettypes from './routes/pettypes';
import specialties from './routes/specialties';
import visits from './routes/visits';
import users from './routes/users';
import chat from './routes/chat';
import auth from './routes/auth';

import { openapiSpec } from './openapi';
import { errorHandler, notFoundHandler } from './middleware';
import { requireAuth } from './auth/middleware';

export function createApp(): express.Express {
  const app = express();

  // CSP disabled so Swagger UI's inline assets at /api/docs render. The rest of
  // Helmet's hardening (HSTS, frameguard, etc.) is still active.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Public routes
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/docs.json', (_req, res) => { res.json(openapiSpec); });
  app.get('/api/docs.yaml', (_req, res) => { res.type('yaml').send(openapiSpec); });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.use('/auth', auth);

  // Protected API routes — every endpoint below requires a valid Bearer token.
  app.use('/api/owners', requireAuth, owners);
  app.use('/api/pets', requireAuth, pets);
  app.use('/api/vets', requireAuth, vets);
  app.use('/api/pettypes', requireAuth, pettypes);
  app.use('/api/specialties', requireAuth, specialties);
  app.use('/api/visits', requireAuth, visits);
  app.use('/api/users', requireAuth, users);
  app.use('/api/chat', requireAuth, chat);

  // 404 + error handler (must come last, in this order)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}