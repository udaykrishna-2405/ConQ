// AI Client - Gemini-powered Centralized AI Service Layer
// Provides unified interface for LLM operations across all ConQ modules.
// Uses Google Gemini 1.5 Flash — fast, cost-effective, free-tier friendly.

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private mockMode: boolean;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.mockMode = !key;

    if (!this.mockMode) {
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
        },
      });
    }
  }

  /**
   * Generate AI completion with automatic retry and error handling.
   */
  async generate(
    prompt: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (this.mockMode) {
      return this.mockGenerate(prompt);
    }

    try {
      const modelToUse = options?.temperature !== undefined || options?.maxTokens !== undefined
        ? this.genAI!.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
              temperature: options.temperature ?? 1.0,
              maxOutputTokens: options.maxTokens ?? 4096,
            },
          })
        : this.model!;

      const fullPrompt = options?.systemPrompt
        ? `${options.systemPrompt}\n\n${prompt}`
        : prompt;

      const result = await modelToUse.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      const usage = response.usageMetadata;

      return {
        content: text,
        usage: {
          inputTokens: usage?.promptTokenCount || 0,
          outputTokens: usage?.candidatesTokenCount || 0,
        },
      };
    } catch (error: any) {
      console.error('Gemini AI generation error:', error.message);
      return this.mockGenerate(prompt);
    }
  }

  /**
   * Generate structured JSON response with schema validation.
   */
  async generateJSON<T>(
    prompt: string,
    schema: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
    }
  ): Promise<T> {
    const fullPrompt = `${prompt}

Return your response as valid JSON matching this schema:
${schema}

IMPORTANT: Respond with ONLY the JSON object, no markdown fences, no additional text.`;

    const response = await this.generate(fullPrompt, options);

    try {
      // Strip markdown fences if Gemini wraps in ```json ... ```
      const cleaned = response.content
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      console.error('JSON parsing error from Gemini response:', error);
      console.debug('Raw response:', response.content.substring(0, 300));
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Generate with conversation history (multi-turn chat).
   */
  async generateWithHistory(
    messages: AIMessage[],
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    if (this.mockMode || !this.genAI) {
      return this.mockGenerate(messages[messages.length - 1]?.content || '');
    }

    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: options?.systemPrompt,
        generationConfig: {
          temperature: options?.temperature ?? 1.0,
          maxOutputTokens: options?.maxTokens ?? 4096,
        },
      });

      const chat = chatModel.startChat({
        history: messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const response = result.response;

      return {
        content: response.text(),
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error: any) {
      console.error('Gemini chat generation error:', error.message);
      return this.mockGenerate(messages[messages.length - 1]?.content || '');
    }
  }

  /**
   * Mock generation for development/testing without API key.
   */
  private mockGenerate(prompt: string): AIResponse {
    return {
      content: `[Mock AI Response — set GEMINI_API_KEY to enable real AI. Prompt preview: ${prompt.substring(0, 80)}...]`,
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  /** Check if client is running in mock mode (no API key). */
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
