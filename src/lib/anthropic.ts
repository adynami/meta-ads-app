import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      // Agent turns stream and can run several minutes; retries cover 429/5xx.
      maxRetries: 3,
    });
  }
  return client;
}
