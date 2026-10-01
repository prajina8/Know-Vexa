import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  dailyGoalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: Date },
    dailyGoalMinutes: { type: Number, default: 60 },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Note: no extra schema.index({ email: 1 }) call here — the `unique: true`
// on the field above already creates that index; adding another caused a
// duplicate-index warning at startup.

export const User = model<IUser>('User', userSchema);
