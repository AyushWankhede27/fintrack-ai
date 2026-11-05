import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  monthlyBudget: { type: Number, default: 0, min: 0 },
  categoryBudgets: [{ _id: false, category: { type: String, required: true, trim: true }, limit: { type: Number, required: true, min: 0 } }]
}, { timestamps: true });
export default mongoose.model('Budget', schema);
