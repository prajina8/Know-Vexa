import { Schema, model, Document, Types } from 'mongoose';

export interface IAnswerRecord {
  questionId: Types.ObjectId;
  topic: string;
  difficulty: string;
  givenAnswer?: string;
  isCorrect: boolean;
  isSkipped: boolean;
}

export interface ITopicPerformance {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  quiz: Types.ObjectId;
  subject: Types.ObjectId;
  answers: IAnswerRecord[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  percentage: number;
  timeTakenSeconds: number;
  topicPerformance: ITopicPerformance[];
  startedAt: Date;
  submittedAt: Date;
}

const answerSchema = new Schema<IAnswerRecord>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    givenAnswer: { type: String },
    isCorrect: { type: Boolean, required: true },
    isSkipped: { type: Boolean, required: true },
  },
  { _id: false },
);

const topicPerfSchema = new Schema<ITopicPerformance>(
  {
    topic: { type: String, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    answers: [answerSchema],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    wrongCount: { type: Number, required: true },
    skippedCount: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTakenSeconds: { type: Number, required: true },
    topicPerformance: [topicPerfSchema],
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ user: 1, subject: 1, submittedAt: -1 });
quizAttemptSchema.index({ user: 1, 'topicPerformance.topic': 1 });

export const QuizAttempt = model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
