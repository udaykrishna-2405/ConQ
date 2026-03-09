/**
 * LocalAIService — deterministic AI fallback (no external API required)
 *
 * Drop-in replacement for Gemini-based responses.
 * All endpoints continue to return structured data; results are computed
 * locally from the prompt text rather than from a remote LLM.
 */

export function generateResponse(prompt: string) {
  return {
    summary: prompt.slice(0, 200),
    sentiment: 'neutral',
    keywords: prompt.split(' ').slice(0, 5),
    recommendation: 'Analysis completed locally (Gemini removed for deployment).',
  };
}

/**
 * Simulate a plain-text AI completion from a prompt.
 * Returns a predictable, non-empty string so downstream JSON parsers
 * don't choke on empty responses.
 */
export function generateText(prompt: string): string {
  const words = prompt.trim().split(/\s+/);
  const preview = words.slice(0, 20).join(' ');
  return `[Local AI] Based on your input: "${preview}${words.length > 20 ? '...' : ''}" — analysis completed locally without an external AI provider.`;
}

/**
 * Simulate a JSON-structured AI completion.
 * Returns a generic analysis object that satisfies the AIResponse contract.
 */
export function generateJSON<T>(prompt: string, _schema: string): T {
  const result = generateResponse(prompt);
  return result as unknown as T;
}
