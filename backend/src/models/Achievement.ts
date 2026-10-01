import { Schema, model, Document, Types } from 'mongoose';

export type AchievementKey =
  | 'first_quiz'
  | 'ten_quizzes'
  | 'hundred_questions'
  | 'seven_day_streak'
  | 'thirty_day_streak'
  | 'first_subject_completed'
  | 'flashcard_master';

export interface IAchievement extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  key: AchievementKey;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: {
      type: String,
      enum: [
        'first_quiz',
        'ten_quizzes',
        'hundred_questions',
        'seven_day_streak',
        'thirty_day_streak',
        'first_subject_completed',
        'flashcard_master',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

achievementSchema.index({ user: 1, key: 1 }, { unique: true });

export const Achievement = model<IAchievement>('Achievement', achievementSchema);
