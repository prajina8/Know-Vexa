import { env } from '../../config/env';

const LOCAL_EMBEDDING_DIM = 384;

/**
 * A dependency-free local embedder used when EMBEDDING_PROVIDER=local
 * (the default, so RAG works with zero external embedding calls / cost).
 * It hashes n-grams into a fixed-size vector (a simplified feature-hashing
 * / bag-of-words approach) — not as strong as a learned embedding model,
 * but genuinely captures lexical overlap for retrieval, and requires no
 * extra API key. Swap to 'openai' in .env for real embeddings.
 */
function localEmbed(text: string): number[] {
  const vec = new Array(LOCAL_EMBEDDING_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    hashInto(vec, token, 1);
    if (i < tokens.length - 1) {
      hashInto(vec, `${token}_${tokens[i + 1]}`, 0.5); // bigram, lower weight
    }
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function hashInto(vec: number[], token: string, weight: number) {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % vec.length;
  vec[idx] += weight;
}

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({ model: env.openaiEmbeddingModel, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (env.embeddingProvider === 'openai' && env.openaiApiKey) {
    return openaiEmbed(texts);
  }
  return texts.map(localEmbed);
}

export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
