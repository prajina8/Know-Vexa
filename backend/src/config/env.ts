import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/study-companion'),

  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  aiProvider: (process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'gemini',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',

  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'local') as 'local' | 'openai',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',

  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  aiRateLimitWindowMin: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MIN || '15', 10),
  aiRateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX || '30', 10),
};
