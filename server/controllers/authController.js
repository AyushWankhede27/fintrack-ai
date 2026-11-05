import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
const view = (u) => ({ id: u._id, name: u.name, email: u.email });
const creds = z.object({ name: z.string().trim().min(1), email: z.string().trim().toLowerCase().email(), password: z.string().min(8) });

export const signup = async (req, res) => {
  const d = creds.parse(req.body);
  if (await User.exists({ email: d.email })) return res.status(409).json({ success: false, message: 'Email already registered' });
  const u = await User.create(d);
  res.status(201).json({ success: true, token: sign(u._id), user: view(u) });
};
export const login = async (req, res) => {
  const { email, password } = creds.pick({ email: true, password: true }).parse(req.body);
  const u = await User.findOne({ email }).select('+password');
  if (!u || !(await u.matchPassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  res.json({ success: true, token: sign(u._id), user: view(u) });
};
export const getMe = async (req, res) => {
  const u = await User.findById(req.userId);
  if (!u) return res.status(401).json({ success: false, message: 'Not authorized' });
  res.json({ success: true, user: view(u) });
};
