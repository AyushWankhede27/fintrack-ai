import mongoose from 'mongoose';

// merchant keyword -> category, learned when the user corrects an imported row
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  keyword: { type: String, required: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true }
});
schema.index({ userId: 1, keyword: 1 }, { unique: true });
export default mongoose.model('Rule', schema);
