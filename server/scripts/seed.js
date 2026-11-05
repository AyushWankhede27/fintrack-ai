import 'dotenv/config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

if (process.env.NODE_ENV === 'production') { console.error('Refusing to seed in production'); process.exit(1); }
const EMAIL = 'demo@fintrack.app', PASSWORD = 'Demo12345';

// Deterministic random numbers so the demo data is the same every run
let seed = 42;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const between = (a, b) => Math.round(a + rnd() * (b - a));
const pick = (a) => a[Math.floor(rnd() * a.length)];

const now = new Date(), rows = [];
const add = (date, type, title, amount, category, paymentMethod = 'UPI') => { if (date <= now) rows.push({ type, title, amount, category, paymentMethod, transactionDate: date }); };

for (let m = 5; m >= 0; m--) {
  const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
  const at = (day) => new Date(base.getFullYear(), base.getMonth(), day, 12);
  add(at(1), 'income', 'Salary credit', 85000, 'Salary', 'Bank');
  add(at(2), 'expense', 'House rent', 14000, 'Rent', 'Bank');
  add(at(5), 'expense', 'Netflix', 649, 'Entertainment', 'Card');
  add(at(8), 'expense', 'Spotify', 119, 'Entertainment', 'Card');
  add(at(10), 'expense', 'Gym membership', 1500, 'Health');
  add(at(12), 'expense', 'Electricity bill', between(1200, 1800), 'Utilities');
  add(at(15), 'expense', 'Wifi recharge', 799, 'Utilities');
  for (let i = 0; i < 12; i++) add(at(between(1, 28)), 'expense', pick(['Swiggy order', 'Zomato order', 'Cafe']), between(150, 700), 'Food');
  for (let i = 0; i < 3; i++) add(at(between(3, 27)), 'expense', 'Groceries', between(700, 1100), 'Food', 'Card');
  for (let i = 0; i < 5; i++) add(at(between(1, 28)), 'expense', pick(['Uber ride', 'Metro card', 'Petrol']), between(100, 700), 'Transport');
  add(at(between(10, 25)), 'expense', pick(['Amazon order', 'Myntra order']), between(800, 3000), 'Shopping', 'Card');
  if (rnd() > 0.4) add(at(between(10, 25)), 'expense', 'Amazon order', between(800, 3000), 'Shopping', 'Card');
  add(at(between(5, 28)), 'expense', 'Movie night', between(400, 900), 'Entertainment');
}
// Two clear outliers a couple of days ago, so the Alerts page has something to flag
const recent = new Date(now.getTime() - 2 * 864e5);
add(recent, 'expense', 'Zomato party order', 4200, 'Food');
add(recent, 'expense', 'Electronics store', 7800, 'Shopping', 'Card');

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-finance-tracker');
let user = await User.findOne({ email: EMAIL });
if (user) { await Transaction.deleteMany({ userId: user._id }); await Budget.deleteMany({ userId: user._id }); }
else user = await User.create({ name: 'Demo User', email: EMAIL, password: PASSWORD });
await Transaction.insertMany(rows.map((r) => ({ ...r, userId: user._id })));
await Budget.create({ userId: user._id, monthlyBudget: 40000, categoryBudgets: [{ category: 'Food', limit: 10000 }, { category: 'Rent', limit: 15000 }, { category: 'Entertainment', limit: 2500 }, { category: 'Transport', limit: 3000 }, { category: 'Shopping', limit: 5000 }] });
console.log(`Seeded ${rows.length} transactions. Login: ${EMAIL} / ${PASSWORD}`);
await mongoose.disconnect();
