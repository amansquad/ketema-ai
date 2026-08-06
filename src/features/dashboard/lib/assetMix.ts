import { getCatalogEntry } from "@/features/assets/catalog/catalog";
import { countByKind } from "@/features/simulation/engine/metrics";
import type { SceneObject } from "@/features/editor/types";

export interface AssetMixEntry {
  kind: string;
  label: string;
  count: number;
}

export function buildAssetMix(objects: SceneObject[]): AssetMixEntry[] {
  const counts = countByKind(objects);
  return Object.entries(counts)
    .map(([kind, count]) => ({ kind, label: getCatalogEntry(kind as SceneObject["assetKind"]).label, count }))
    .sort((a, b) => b.count - a.count);
}
