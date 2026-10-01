import { AIProvider } from './AIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { env } from '../../config/env';

let cachedProvider: AIProvider | null = null;

// Single entry point the rest of the app calls. Changing AI_PROVIDER
// in .env is the only thing required to switch backends.
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.aiProvider) {
    case 'openai':
      cachedProvider = new OpenAIProvider();
      break;
    case 'gemini':
      cachedProvider = new GeminiProvider();
      break;
    case 'anthropic':
    default:
      cachedProvider = new AnthropicProvider();
      break;
  }
  return cachedProvider;
}

export * from './AIProvider';
export * from './prompts';
