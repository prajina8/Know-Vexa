import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './AIProvider';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!env.anthropicApiKey) {
      throw new AppError(
        'ANTHROPIC_API_KEY is not configured. Set it in server/.env to enable AI features.',
        500,
      );
    }
    this.client = new Anthropic({ apiKey: env.anthropicApiKey });
    this.model = env.anthropicModel;
  }

  async complete({
    system,
    prompt,
    maxTokens = 1500,
  }: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new AppError('AI provider returned no text content', 502);
    }
    return textBlock.text;
  }

  async completeJSON<T>({
    system,
    prompt,
    maxTokens = 2000,
  }: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<T> {
    const jsonSystem = `${system}\n\nRespond with ONLY valid JSON. No markdown code fences, no preamble, no explanation outside the JSON.`;
    const raw = await this.complete({ system: jsonSystem, prompt, maxTokens });
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new AppError('Failed to parse AI response as JSON', 502);
    }
  }
}
