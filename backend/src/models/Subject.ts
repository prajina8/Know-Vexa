import { Schema, model, Document, Types } from 'mongoose';

export interface ISubject extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'book' },
  },
  { timestamps: true },
);

subjectSchema.index({ user: 1, name: 1 }, { unique: true });

export const Subject = model<ISubject>('Subject', subjectSchema);
