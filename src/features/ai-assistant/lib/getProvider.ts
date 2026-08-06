import "server-only";

import { AnthropicProvider } from "@/features/ai-assistant/lib/providers/anthropic";
import { MockProvider } from "@/features/ai-assistant/lib/providers/mock";
import type { AiProvider } from "@/features/ai-assistant/lib/providers/types";

/**
 * Single seam for swapping the AI assistant's backing LLM. Controlled by
 * AI_PROVIDER (see .env.example) so a deployment without an API key still
 * gets a working — if less flexible — assistant via MockProvider.
 */
export function getAiProvider(): AiProvider {
  const providerName = process.env.AI_PROVIDER ?? "mock";

  if (providerName === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  }

  return new MockProvider();
}
