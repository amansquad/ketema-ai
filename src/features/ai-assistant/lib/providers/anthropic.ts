import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { SceneCommandsResponseSchema, type SceneCommand } from "@/features/ai-assistant/lib/commandSchema";
import type { AiProvider } from "@/features/ai-assistant/lib/providers/types";

const SYSTEM_PROMPT = `You translate a user's natural-language request about a 3D city editor into a short list of scene-editing commands. Two command kinds are available:

- "placeAssets": place a specific asset kind (buildings, roads, trees, parks, solar panels, wind turbines, traffic lights, hospitals, schools, water tanks, street lights, or Ethiopian heritage assets — monuments, churches, mosques, mountains, rivers) in a grid or scattered around a point.
- "createDistrict": place a themed cluster of several related asset kinds at once (residential, commercial, solar-farm, park, or civic).

Pick coordinates for originX/originZ in the range -60 to 60 that don't obviously overlap a previous command in the same response. Keep "count" reasonable for what was asked (a handful for "a few", ~10 for "ten", etc., capped at 200). If the request doesn't map to placing or clustering assets, return an empty commands array — do not invent unrelated actions.`;

/**
 * Calls the real Claude API to translate a prompt into SceneCommand[],
 * constrained to the exact schema via structured outputs so the response
 * always parses — no free-text JSON extraction or retry-on-parse-failure
 * loop needed.
 */
export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic(apiKey ? { apiKey } : {});
  }

  async generateCommands(prompt: string): Promise<SceneCommand[]> {
    const response = await this.client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      // Small structured-extraction task — thinking off, low effort keeps
      // latency and cost down. (Disabling thinking is only capped at
      // xhigh/max effort, so `low` + disabled is a valid combination.)
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: zodOutputFormat(SceneCommandsResponseSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) return [];
    return response.parsed_output.commands;
  }
}
