import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  usedContext?: boolean; // true if RAG context was found & used
  createdAt: Date;
}

export interface IChatHistory extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  material: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    usedContext: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatHistorySchema = new Schema<IChatHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    messages: [chatMessageSchema],
  },
  { timestamps: true },
);

chatHistorySchema.index({ user: 1, material: 1 }, { unique: true });

export const ChatHistory = model<IChatHistory>('ChatHistory', chatHistorySchema);
