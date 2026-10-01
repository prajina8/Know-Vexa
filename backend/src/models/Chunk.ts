import { Schema, model, Document, Types } from 'mongoose';

// Stores each chunk of a material's extracted text along with its
// embedding vector, for retrieval-augmented generation (RAG).
export interface IChunk extends Document {
  _id: Types.ObjectId;
  material: Types.ObjectId;
  user: Types.ObjectId;
  index: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    index: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

chunkSchema.index({ material: 1, index: 1 });

export const Chunk = model<IChunk>('Chunk', chunkSchema);
