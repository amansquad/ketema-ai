import type { SceneCommand } from "@/features/ai-assistant/lib/commandSchema";
import { gridPositions, scatterPositions, type Vector2Tuple } from "@/features/ai-assistant/lib/layout";
import { ASSET_DEFAULTS } from "@/features/editor/lib/createSceneObject";
import type { AssetKind, SceneObjectDraft } from "@/features/editor/types";

const MAX_COUNT = 200;

interface DistrictPlanEntry {
  assetKind: AssetKind;
  ratio: number; // shares within a districtType sum to 1
}

const DISTRICT_PLAN: Record<string, DistrictPlanEntry[]> = {
  residential: [
    { assetKind: "building-residential", ratio: 0.6 },
    { assetKind: "tree", ratio: 0.25 },
    { assetKind: "street-light", ratio: 0.15 },
  ],
  commercial: [
    { assetKind: "building-commercial", ratio: 0.8 },
    { assetKind: "street-light", ratio: 0.2 },
  ],
  "solar-farm": [{ assetKind: "solar-panel", ratio: 1 }],
  park: [
    { assetKind: "park", ratio: 0.3 },
    { assetKind: "tree", ratio: 0.7 },
  ],
  civic: [
    { assetKind: "building-civic", ratio: 0.5 },
    { assetKind: "school", ratio: 0.25 },
    { assetKind: "hospital", ratio: 0.25 },
  ],
};

function spacingFor(assetKind: AssetKind): number {
  const [width, , depth] = ASSET_DEFAULTS[assetKind].scale;
  return Math.max(width, depth) + 3;
}

function pickFromPlan(plan: DistrictPlanEntry[]): AssetKind {
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of plan) {
    cumulative += entry.ratio;
    if (roll <= cumulative) return entry.assetKind;
  }
  return plan[plan.length - 1].assetKind;
}

/**
 * Turns validated SceneCommand[] into flat SceneObjectDraft[] the editor
 * store can add in one batch. This is the only place command semantics
 * live — the store has no idea "AI-issued" commands exist, it just gets
 * the same SceneObjectDraft[] a human placing assets one at a time would
 * produce, so undo/redo and persistence work identically either way.
 */
export function executeSceneCommands(commands: SceneCommand[]): SceneObjectDraft[] {
  const drafts: SceneObjectDraft[] = [];

  for (const command of commands) {
    const count = Math.max(1, Math.min(command.count, MAX_COUNT));
    const origin: Vector2Tuple = [command.originX, command.originZ];

    if (command.type === "placeAssets") {
      const spacing = spacingFor(command.assetKind);
      const positions =
        command.layout === "grid"
          ? gridPositions(count, origin, spacing)
          : scatterPositions(count, origin, spacing * Math.sqrt(count));
      for (const [x, z] of positions) {
        drafts.push({ assetKind: command.assetKind, position: [x, 0, z] });
      }
      continue;
    }

    const plan = DISTRICT_PLAN[command.districtType];
    if (!plan) continue;
    const positions = gridPositions(count, origin, 8);
    for (const [x, z] of positions) {
      drafts.push({ assetKind: pickFromPlan(plan), position: [x, 0, z] });
    }
  }

  return drafts;
}
