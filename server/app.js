import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';

const app = express();
const origins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (o, cb) => (!o || origins.includes(o) ? cb(null, true) : cb(new Error('Not allowed by CORS'))) }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use('/api/ai', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, message: { success: false, message: 'AI rate limit reached, try later' } }));
app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use((err, req, res, next) => {
  const zod = err.name === 'ZodError';
  const status = zod ? 400 : err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message: zod ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') : status === 500 ? 'Server error' : err.message });
});
export default app;
