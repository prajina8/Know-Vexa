import { AIProvider } from './AIProvider';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

// Implemented with plain fetch to avoid pulling in the OpenAI SDK as a
// dependency just for provider parity. Swap in the official SDK if preferred.
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    if (!env.openaiApiKey) {
      throw new AppError('OPENAI_API_KEY is not configured.', 500);
    }
    this.apiKey = env.openaiApiKey;
    this.model = env.openaiModel;
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
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      throw new AppError(`OpenAI API error: ${res.status} ${await res.text()}`, 502);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? '';
  }

  async completeJSON<T>(params: { system: string; prompt: string; maxTokens?: number }): Promise<T> {
    const jsonSystem = `${params.system}\n\nRespond with ONLY valid JSON, no markdown fences.`;
    const raw = await this.complete({ ...params, system: jsonSystem });
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned) as T;
  }
}
