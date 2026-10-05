import { AIProvider } from './AIProvider';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

// Temporary Google-side errors that are worth retrying.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallbackModel: string;

  constructor() {
    if (!env.geminiApiKey) {
      throw new AppError('GEMINI_API_KEY is not configured.', 500);
    }
    this.apiKey = env.geminiApiKey;
    this.model = env.geminiModel;
    this.fallbackModel = env.geminiFallbackModel;
  }

  // One model, with retries and increasing waits (1s, 2s) between attempts.
  private async callModel(
    model: string,
    body: unknown,
  ): Promise<{ ok: true; text: string } | { ok: false; status: number; detail: string }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    let last = { status: 0, detail: '' };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        return { ok: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' };
      }

      last = { status: res.status, detail: await res.text() };
      if (!RETRYABLE_STATUS.has(res.status) || attempt === MAX_ATTEMPTS) break;
      await sleep(1000 * attempt);
    }
    return { ok: false, ...last };
  }

  async complete({
    system,
    prompt,
    maxTokens = 1500,
    json = false,
  }: {
    system: string;
    prompt: string;
    maxTokens?: number;
    json?: boolean;
  }): Promise<string> {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget: 0 },
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    };

    let result = await this.callModel(this.model, body);

    // Still failing with a temporary error? Try the fallback model once.
    if (
      !result.ok &&
      RETRYABLE_STATUS.has(result.status) &&
      this.fallbackModel &&
      this.fallbackModel !== this.model
    ) {
      console.warn(`[gemini] ${this.model} unavailable (${result.status}), trying ${this.fallbackModel}`);
      result = await this.callModel(this.fallbackModel, body);
    }

    if (!result.ok) {
      if (RETRYABLE_STATUS.has(result.status)) {
        throw new AppError(
          'The AI service is busy right now. Please try again in a minute.',
          503,
        );
      }
      throw new AppError(`Gemini API error: ${result.status} ${result.detail}`, 502);
    }
    return result.text;
  }

  async completeJSON<T>(params: { system: string; prompt: string; maxTokens?: number }): Promise<T> {
    const jsonSystem = `${params.system}\n\nRespond with ONLY valid JSON, no markdown fences.`;
    const raw = await this.complete({ ...params, system: jsonSystem, json: true });
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new AppError('Failed to parse AI response as JSON', 502);
    }
  }
}