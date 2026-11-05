import { z } from 'zod';
import Budget from '../models/Budget.js';

const body = z.object({ monthlyBudget: z.coerce.number().min(0), categoryBudgets: z.array(z.object({ category: z.string().trim().min(1), limit: z.coerce.number().min(0) })).default([]) });
export const getBudget = async (req, res) => res.json({ success: true, data: (await Budget.findOne({ userId: req.userId })) || { monthlyBudget: 0, categoryBudgets: [] } });
export const setBudget = async (req, res) => res.json({ success: true, data: await Budget.findOneAndUpdate({ userId: req.userId }, body.parse(req.body), { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }) });
