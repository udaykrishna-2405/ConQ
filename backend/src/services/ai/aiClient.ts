// AI Client — Local Fallback Implementation
// Gemini SDK removed; all AI responses are generated deterministically
// by LocalAIService. All public interfaces are preserved so no handler
// or service file needs to change.

import { generateText, generateJSON } from '../localAIService';

export interface AIResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIMessage {
  role: 'user' | 'model';
  content: string;
}

export class AIClient {
  /** Always false — no external API, no mock mode distinction needed. */
  private mockMode = true;

  constructor(_apiKey?: string, _modelName?: string) {
    // No-op: credentials are not required with the local fallback.
  }

  /**
   * Generate AI completion — returns a deterministic local response.
   */
  async generate(
    prompt: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    return {
      content: generateText(fullPrompt),
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  /**
   * Generate structured JSON response — uses local deterministic analysis.
   */
  async generateJSON<T>(
    prompt: string,
    schema: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
    }
  ): Promise<T> {
    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    return generateJSON<T>(fullPrompt, schema);
  }

  /**
   * Generate from conversation history — uses the last message as context.
   */
  async generateWithHistory(
    messages: AIMessage[],
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    const lastContent = messages[messages.length - 1]?.content || '';
    return this.generate(lastContent, options);
  }

  /** Always true — client runs in local mode without an API key. */
  isMockMode(): boolean {
    return this.mockMode;
  }
}

// ── Singleton ──

let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}

/** Reset singleton (useful in tests). */
export function resetAIClient(): void {
  aiClientInstance = null;
}
