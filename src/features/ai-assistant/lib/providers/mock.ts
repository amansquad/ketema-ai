import "server-only";

import { getCatalogEntry, ASSET_CATALOG } from "@/features/assets/catalog/catalog";
import type { DistrictTypeSchema, SceneCommand } from "@/features/ai-assistant/lib/commandSchema";
import type { AiProvider } from "@/features/ai-assistant/lib/providers/types";
import type { AssetKind } from "@/features/editor/types";
import type { z } from "zod";

const DISTRICT_PATTERNS: { pattern: RegExp; districtType: z.infer<typeof DistrictTypeSchema> }[] = [
  { pattern: /residential (district|neighborhood|area)/i, districtType: "residential" },
  { pattern: /solar farm/i, districtType: "solar-farm" },
  { pattern: /(commercial|business) district/i, districtType: "commercial" },
  { pattern: /park( district)?|green space/i, districtType: "park" },
  { pattern: /civic (center|district)/i, districtType: "civic" },
];

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  dozen: 12,
  twenty: 20,
};

function parseCount(token: string): number | null {
  const digits = Number.parseInt(token, 10);
  if (!Number.isNaN(digits)) return digits;
  return WORD_NUMBERS[token.toLowerCase()] ?? null;
}

function matchAssetKind(label: string): AssetKind | null {
  const normalized = label.trim().toLowerCase().replace(/s$/, "");
  for (const entry of ASSET_CATALOG) {
    const entryLabel = entry.label.toLowerCase().replace(/s$/, "");
    if (entryLabel === normalized || entryLabel.includes(normalized) || normalized.includes(entryLabel)) {
      return entry.kind;
    }
    if (entry.kind.replace(/-/g, " ") === normalized) return entry.kind;
  }
  return null;
}

function randomOrigin(): [number, number] {
  return [Math.round((Math.random() - 0.5) * 60), Math.round((Math.random() - 0.5) * 60)];
}

/**
 * Rule-based fallback provider — no network call, no API key required. Not
 * an LLM: it pattern-matches a handful of phrasings ("Create a residential
 * district", "Build a solar farm", "Place ten schools") well enough to
 * demo the pipeline end to end. Swap in AnthropicProvider (see
 * providers/anthropic.ts) for open-ended prompts.
 */
export class MockProvider implements AiProvider {
  async generateCommands(prompt: string): Promise<SceneCommand[]> {
    const commands: SceneCommand[] = [];

    for (const { pattern, districtType } of DISTRICT_PATTERNS) {
      if (pattern.test(prompt)) {
        const [originX, originZ] = randomOrigin();
        commands.push({ type: "createDistrict", districtType, count: 9, originX, originZ });
      }
    }

    const countMatch = prompt.match(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|dozen|twenty)\s+([a-z][a-z\s-]*?)(?=\.|,|$| in | near | around | at )/i,
    );
    if (countMatch) {
      const count = parseCount(countMatch[1]);
      const assetKind = matchAssetKind(countMatch[2]);
      if (count && assetKind) {
        const [originX, originZ] = randomOrigin();
        commands.push({
          type: "placeAssets",
          assetKind,
          count: Math.min(count, 200),
          layout: "scatter",
          originX,
          originZ,
        });
      }
    }

    if (commands.length === 0) {
      // Last-resort fallback: try to find any catalog label mentioned in the
      // prompt and place a handful of it, so the assistant rarely no-ops.
      const kind = matchAssetKind(prompt);
      if (kind) {
        const [originX, originZ] = randomOrigin();
        commands.push({ type: "placeAssets", assetKind: kind, count: 3, layout: "scatter", originX, originZ });
      }
    }

    return commands;
  }
}

// Re-exported so callers can describe what happened without importing the catalog directly.
export function describeAssetKind(assetKind: AssetKind): string {
  return getCatalogEntry(assetKind).label;
}
