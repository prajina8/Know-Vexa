import { AIProvider } from './AIProvider';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    if (!env.geminiApiKey) {
      throw new AppError('GEMINI_API_KEY is not configured.', 500);
    }
    this.apiKey = env.geminiApiKey;
    this.model = env.geminiModel;
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!res.ok) {
      throw new AppError(`Gemini API error: ${res.status} ${await res.text()}`, 502);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async completeJSON<T>(params: { system: string; prompt: string; maxTokens?: number }): Promise<T> {
    const jsonSystem = `${params.system}\n\nRespond with ONLY valid JSON, no markdown fences.`;
    const raw = await this.complete({ ...params, system: jsonSystem });
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned) as T;
  }
}
