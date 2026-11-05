import mongoose from 'mongoose';

export const PAYMENT = ['UPI', 'Card', 'Cash', 'Bank', 'Other'];
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, trim: true },
  paymentMethod: { type: String, enum: PAYMENT, default: 'UPI' },
  description: { type: String, default: '' },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });
schema.index({ userId: 1, transactionDate: -1 });
schema.index({ userId: 1, type: 1 });
schema.index({ userId: 1, category: 1 });
export default mongoose.model('Transaction', schema);
