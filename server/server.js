import 'dotenv/config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import app from './app.js';

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-finance-tracker');
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () => console.log('API listening on', process.env.PORT || 5000));
} catch (e) { console.error('Startup failed:', e.message); process.exit(1); }
