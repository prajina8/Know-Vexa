import { Schema, model, Document, Types } from 'mongoose';
import { MaterialStatus } from '../types';

export interface IMaterial extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  subject: Types.ObjectId;
  title: string;
  originalFileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  status: MaterialStatus;
  failureReason?: string;
  extractedText?: string;
  pageCount?: number;
  wordCount?: number;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
      index: true,
    },
    failureReason: { type: String },
    extractedText: { type: String, select: false }, // large; opt-in fetch
    pageCount: { type: Number },
    wordCount: { type: Number },
    topics: [{ type: String }],
  },
  { timestamps: true },
);

materialSchema.index({ user: 1, subject: 1, createdAt: -1 });

export const Material = model<IMaterial>('Material', materialSchema);
