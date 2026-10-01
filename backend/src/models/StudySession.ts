import { Schema, model, Document, Types } from 'mongoose';

// A generic log of time-based study activity, used for streaks,
// total study time, and analytics. One row per activity block.
export interface IStudySession extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  subject?: Types.ObjectId;
  activityType: 'reading' | 'quiz' | 'flashcards' | 'chat' | 'summary';
  durationMinutes: number;
  occurredAt: Date;
  createdAt: Date;
}

const studySessionSchema = new Schema<IStudySession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
    activityType: {
      type: String,
      enum: ['reading', 'quiz', 'flashcards', 'chat', 'summary'],
      required: true,
    },
    durationMinutes: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

studySessionSchema.index({ user: 1, occurredAt: -1 });

export const StudySession = model<IStudySession>('StudySession', studySessionSchema);
