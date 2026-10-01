import { Schema, model, Document, Types } from 'mongoose';
import { PlanRange } from '../types';

export interface IStudyTask {
  _id?: Types.ObjectId;
  subject: Types.ObjectId;
  topic: string;
  durationMinutes: number;
  reason: string;
  priority: number; // 1 = highest
  completed: boolean;
  rescheduledFrom?: Date;
}

export interface IStudyPlan extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  range: PlanRange;
  forDate: Date; // day this plan covers (or week-start date)
  tasks: IStudyTask[];
  generatedFrom: {
    weakTopics: string[];
    strongTopics: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<IStudyTask>(
  {
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    topic: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    reason: { type: String, required: true },
    priority: { type: Number, default: 3 },
    completed: { type: Boolean, default: false },
    rescheduledFrom: { type: Date },
  },
  { _id: true },
);

const studyPlanSchema = new Schema<IStudyPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    range: { type: String, enum: ['daily', 'weekly'], required: true },
    forDate: { type: Date, required: true },
    tasks: [taskSchema],
    generatedFrom: {
      weakTopics: [{ type: String }],
      strongTopics: [{ type: String }],
    },
  },
  { timestamps: true },
);

studyPlanSchema.index({ user: 1, range: 1, forDate: -1 });

export const StudyPlan = model<IStudyPlan>('StudyPlan', studyPlanSchema);
