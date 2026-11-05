import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, minlength: 8, select: false }
}, { timestamps: true });
schema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12); });
schema.methods.matchPassword = function (p) { return bcrypt.compare(p, this.password); };
export default mongoose.model('User', schema);
