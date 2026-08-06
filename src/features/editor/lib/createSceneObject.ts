import { nanoid } from "nanoid";

import type { AssetKind, SceneObject, SceneObjectDraft, Vector3Tuple } from "@/features/editor/types";

interface AssetDefaults {
  label: string;
  scale: Vector3Tuple;
  color: string;
}

// Minimal built-in defaults so the editor foundation is usable standalone.
// The full catalog (features/assets, features/ethiopia) supersedes this with
// richer metadata, thumbnails, and models — this map stays as the fallback.
export const ASSET_DEFAULTS: Record<AssetKind, AssetDefaults> = {
  "building-residential": { label: "Residential Building", scale: [4, 6, 4], color: "#c9a37b" },
  "building-commercial": { label: "Commercial Building", scale: [6, 10, 6], color: "#7b93c9" },
  "building-civic": { label: "Civic Building", scale: [8, 8, 8], color: "#c9b97b" },
  road: { label: "Road", scale: [4, 0.1, 20], color: "#3a3a3f" },
  tree: { label: "Tree", scale: [1, 3, 1], color: "#3f7d43" },
  park: { label: "Park", scale: [10, 0.2, 10], color: "#4caf50" },
  "solar-panel": { label: "Solar Panel", scale: [3, 0.2, 2], color: "#1a2a52" },
  "wind-turbine": { label: "Wind Turbine", scale: [1, 12, 1], color: "#e8e8e8" },
  "traffic-light": { label: "Traffic Light", scale: [0.4, 3, 0.4], color: "#2b2b2b" },
  hospital: { label: "Hospital", scale: [10, 8, 10], color: "#e0e0e0" },
  school: { label: "School", scale: [8, 6, 8], color: "#d98c4a" },
  "water-tank": { label: "Water Tank", scale: [3, 4, 3], color: "#8fa9c9" },
  "street-light": { label: "Street Light", scale: [0.2, 4, 0.2], color: "#555555" },
  monument: { label: "Monument", scale: [2, 8, 2], color: "#9a9488" },
  church: { label: "Church", scale: [8, 12, 8], color: "#a8763e" },
  mosque: { label: "Mosque", scale: [8, 10, 8], color: "#5e9c8f" },
  mountain: { label: "Mountain", scale: [20, 15, 20], color: "#6b6b5f" },
  river: { label: "River", scale: [6, 0.1, 30], color: "#3d7bb0" },
};

export function createSceneObject(draft: SceneObjectDraft): SceneObject {
  const defaults = ASSET_DEFAULTS[draft.assetKind];
  const now = Date.now();

  return {
    id: nanoid(),
    assetKind: draft.assetKind,
    name: draft.name ?? defaults.label,
    position: draft.position ?? [0, 0, 0],
    rotation: draft.rotation ?? [0, 0, 0],
    scale: draft.scale ?? defaults.scale,
    material: draft.material ?? { color: defaults.color, roughness: 0.7, metalness: 0.05 },
    tags: draft.tags ?? [],
    metadata: draft.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}
