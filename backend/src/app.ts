import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { publicRouter } from './routes/public.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { checkinRouter } from './routes/checkin.routes.js';
import { teamsRouter } from './routes/teams.routes.js';
import { scoresRouter } from './routes/scores.routes.js';
import { questionsRouter } from './routes/questions.routes.js';
import { pollsRouter } from './routes/polls.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (_req, res) => res.json({ ok: true }));

const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

app.use('/api/registrations', registerLimiter);
app.use('/api', publicRouter);
app.use('/api', teamsRouter);
app.use('/api', scoresRouter);
app.use('/api', questionsRouter);
app.use('/api', pollsRouter);
app.use('/api', checkinRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

app.use(errorHandler);
