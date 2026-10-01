import { Schema, model, Document, Types } from 'mongoose';
import { Difficulty, FlashcardRating } from '../types';

export interface IFlashcard extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  subject: Types.ObjectId;
  material?: Types.ObjectId;
  question: string;
  answer: string;
  topic: string;
  difficulty: Difficulty;
  lastRating?: FlashcardRating;
  timesReviewed: number;
  timesCorrectStreak: number;
  nextReviewAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    lastRating: { type: String, enum: ['hard', 'good', 'easy'] },
    timesReviewed: { type: Number, default: 0 },
    timesCorrectStreak: { type: Number, default: 0 },
    nextReviewAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

flashcardSchema.index({ user: 1, subject: 1, nextReviewAt: 1 });

export const Flashcard = model<IFlashcard>('Flashcard', flashcardSchema);
