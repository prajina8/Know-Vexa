import { Types } from 'mongoose';
import { Chunk } from '../../models/Chunk';
import { embedText, embedTexts, cosineSimilarity } from './embeddings';

const CHUNK_SIZE_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 200;

/**
 * Splits text into overlapping chunks along sentence boundaries where
 * possible, so retrieved context reads coherently rather than being cut
 * mid-sentence.
 */
export function chunkText(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.?!])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > CHUNK_SIZE_CHARS && current.length > 0) {
      chunks.push(current.trim());
      // carry the tail of the previous chunk forward for overlap/context continuity
      const tail = current.slice(Math.max(0, current.length - CHUNK_OVERLAP_CHARS));
      current = tail + ' ' + sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 20);
}

/**
 * Full ingestion step: chunk → embed → store. Called once when a
 * material finishes text extraction.
 */
export async function indexMaterial(params: {
  materialId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
}): Promise<number> {
  const { materialId, userId, text } = params;
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const embeddings = await embedTexts(chunks);

  await Chunk.deleteMany({ material: materialId });
  await Chunk.insertMany(
    chunks.map((chunkText, index) => ({
      material: materialId,
      user: userId,
      index,
      text: chunkText,
      embedding: embeddings[index],
    })),
  );
  return chunks.length;
}

/**
 * Retrieval step: embed the query, pull all chunks for the material,
 * rank by cosine similarity, return the top-K joined as context text.
 * (For very large corpora a real vector DB / ANN index would replace
 * the in-memory ranking below — swap point is isolated here.)
 */
export async function retrieveContext(params: {
  materialId: Types.ObjectId;
  query: string;
  topK?: number;
}): Promise<{ context: string; matchedChunks: number; usedContext: boolean }> {
  const { materialId, query, topK = 4 } = params;

  const allChunks = await Chunk.find({ material: materialId }).lean();
  if (allChunks.length === 0) {
    return { context: '', matchedChunks: 0, usedContext: false };
  }

  const queryEmbedding = await embedText(query);
  const scored = allChunks
    .map((c) => ({ text: c.text, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score);

  const MIN_RELEVANCE = 0.05; // local hashed embeddings score low; keep threshold permissive
  const top = scored.slice(0, topK).filter((c) => c.score > MIN_RELEVANCE);

  return {
    context: top.map((c) => c.text).join('\n\n---\n\n'),
    matchedChunks: top.length,
    usedContext: top.length > 0,
  };
}
