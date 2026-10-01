import { Schema, model, Document, Types } from 'mongoose';
import { Difficulty, QuestionType } from '../types';

export interface IQuizQuestion {
  _id?: Types.ObjectId;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  subject: Types.ObjectId;
  material?: Types.ObjectId;
  title: string;
  topic?: string;
  difficulty: Difficulty | 'mixed';
  questionTypes: QuestionType[];
  questions: IQuizQuestion[];
  timeLimitMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    topic: { type: String, required: true },
  },
  { _id: true },
);

const quizSchema = new Schema<IQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    title: { type: String, required: true },
    topic: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
    questionTypes: [{ type: String, enum: ['mcq', 'true_false', 'short_answer'] }],
    questions: [questionSchema],
    timeLimitMinutes: { type: Number },
  },
  { timestamps: true },
);

quizSchema.index({ user: 1, subject: 1, createdAt: -1 });

export const Quiz = model<IQuiz>('Quiz', quizSchema);
