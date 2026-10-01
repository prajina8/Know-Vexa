// A minimal, provider-agnostic interface. Any AI backend (Anthropic,
// OpenAI, Gemini, ...) plugs in here. Swapping providers means writing
// one new class that implements this interface and updating the
// factory in index.ts — nothing else in the app changes.
export interface AIProvider {
  /**
   * Send a system + user prompt, get back plain text.
   */
  complete(params: { system: string; prompt: string; maxTokens?: number }): Promise<string>;

  /**
   * Send a system + user prompt, get back parsed JSON (the provider
   * is instructed to respond with JSON only).
   */
  completeJSON<T>(params: { system: string; prompt: string; maxTokens?: number }): Promise<T>;
}
