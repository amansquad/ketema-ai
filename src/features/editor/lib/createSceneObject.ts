import { nanoid } from "nanoid";

import type { AssetKind, SceneObject, SceneObjectDraft, Vector3Tuple } from "@/features/editor/types";

interface AssetDefaults {
  label: string;
  scale: Vector3Tuple;
  color: string;
  roughness: number;
  metalness: number;
}

// Minimal built-in defaults so the editor foundation is usable standalone.
// The full catalog (features/assets, features/ethiopia) supersedes this with
// richer metadata, thumbnails, and models — this map stays as the fallback,
// and also supplies the shared material used by each AssetKind's instanced
// mesh group (see AssetInstanceGroup).
export const ASSET_DEFAULTS: Record<AssetKind, AssetDefaults> = {
  "building-residential": { label: "Residential Building", scale: [4, 6, 4], color: "#c9a37b", roughness: 0.8, metalness: 0.05 },
  "building-commercial": { label: "Commercial Building", scale: [6, 10, 6], color: "#7b93c9", roughness: 0.3, metalness: 0.4 },
  "building-civic": { label: "Civic Building", scale: [8, 8, 8], color: "#c9b97b", roughness: 0.6, metalness: 0.1 },
  road: { label: "Road", scale: [4, 0.1, 20], color: "#3a3a3f", roughness: 1, metalness: 0 },
  tree: { label: "Tree", scale: [1, 3, 1], color: "#3f7d43", roughness: 0.9, metalness: 0 },
  park: { label: "Park", scale: [10, 0.2, 10], color: "#4caf50", roughness: 1, metalness: 0 },
  "solar-panel": { label: "Solar Panel", scale: [3, 0.2, 2], color: "#1a2a52", roughness: 0.2, metalness: 0.6 },
  "wind-turbine": { label: "Wind Turbine", scale: [1, 12, 1], color: "#e8e8e8", roughness: 0.4, metalness: 0.3 },
  "traffic-light": { label: "Traffic Light", scale: [0.4, 3, 0.4], color: "#2b2b2b", roughness: 0.5, metalness: 0.2 },
  hospital: { label: "Hospital", scale: [10, 8, 10], color: "#e0e0e0", roughness: 0.5, metalness: 0.05 },
  school: { label: "School", scale: [8, 6, 8], color: "#d98c4a", roughness: 0.7, metalness: 0.05 },
  "water-tank": { label: "Water Tank", scale: [3, 4, 3], color: "#8fa9c9", roughness: 0.3, metalness: 0.5 },
  "street-light": { label: "Street Light", scale: [0.2, 4, 0.2], color: "#555555", roughness: 0.5, metalness: 0.4 },
  monument: { label: "Monument", scale: [2, 8, 2], color: "#9a9488", roughness: 0.9, metalness: 0 },
  church: { label: "Church", scale: [8, 12, 8], color: "#a8763e", roughness: 0.7, metalness: 0 },
  mosque: { label: "Mosque", scale: [8, 10, 8], color: "#5e9c8f", roughness: 0.5, metalness: 0.1 },
  mountain: { label: "Mountain", scale: [20, 15, 20], color: "#6b6b5f", roughness: 1, metalness: 0 },
  river: { label: "River", scale: [6, 0.1, 30], color: "#3d7bb0", roughness: 0.1, metalness: 0.1 },
  bridge: { label: "Bridge", scale: [24, 4, 5], color: "#9a9488", roughness: 0.8, metalness: 0.05 },
  stadium: { label: "Stadium", scale: [16, 8, 12], color: "#b8b2a6", roughness: 0.6, metalness: 0.1 },
  fountain: { label: "Fountain", scale: [5, 1.5, 5], color: "#a8a49b", roughness: 0.4, metalness: 0.15 },
  lake: { label: "Lake", scale: [30, 0.1, 20], color: "#3d7bb0", roughness: 0.1, metalness: 0.1 },
  warehouse: { label: "Warehouse", scale: [10, 5, 8], color: "#8a857d", roughness: 0.7, metalness: 0.15 },
  "market-stall": { label: "Market Stall", scale: [3, 2.6, 2.4], color: "#c1443b", roughness: 0.8, metalness: 0 },
  "clock-tower": { label: "Clock Tower", scale: [2.6, 11, 2.6], color: "#9a9488", roughness: 0.7, metalness: 0.05 },
  well: { label: "Water Well", scale: [2.2, 1.8, 2.2], color: "#8a8478", roughness: 0.9, metalness: 0 },
  obelisk: { label: "Obelisk", scale: [1.6, 10, 1.6], color: "#a8a196", roughness: 0.85, metalness: 0 },
  "bus-station": { label: "Bus Station", scale: [6, 3, 3.5], color: "#6b6660", roughness: 0.6, metalness: 0.1 },
  "grain-silo": { label: "Grain Silo", scale: [3.5, 9, 3.5], color: "#c9c4ba", roughness: 0.4, metalness: 0.5 },
  "railway-station": { label: "Railway Station", scale: [12, 6, 7], color: "#8a6a4a", roughness: 0.6, metalness: 0.1 },
  "police-station": { label: "Police Station", scale: [7, 6, 7], color: "#5b6b7a", roughness: 0.6, metalness: 0.1 },
  university: { label: "University", scale: [14, 9, 11], color: "#8a6a4a", roughness: 0.65, metalness: 0.05 },
  cemetery: { label: "Cemetery", scale: [12, 0.2, 12], color: "#5c7a52", roughness: 1, metalness: 0 },
  "farm-field": { label: "Farm Field", scale: [14, 0.15, 14], color: "#8a6a3a", roughness: 1, metalness: 0 },
  substation: { label: "Power Substation", scale: [4, 3, 4], color: "#5b6068", roughness: 0.4, metalness: 0.5 },
  "car-park": { label: "Car Park", scale: [12, 0.1, 12], color: "#2f2f33", roughness: 1, metalness: 0 },
  "coffee-ceremony": { label: "Coffee Ceremony Pavilion", scale: [3, 2.8, 3], color: "#a8763e", roughness: 0.8, metalness: 0 },
  "telecom-tower": { label: "Telecom Tower", scale: [1.2, 20, 1.2], color: "#b0b0b0", roughness: 0.4, metalness: 0.6 },
};

// Per-kind initial-transform variety, so repeated objects don't start as
// identical clones: the mountain gets a random spin (its facets and noise
// texture are asymmetric), and trees get a slightly randomized size so
// forests look less uniform (their canopies are further varied per object at
// render time — see objectVariation.ts). Only applied when the caller
// didn't specify that part of the transform.
function defaultTransform(assetKind: AssetKind): { rotation: Vector3Tuple; scale: Vector3Tuple } {
  const defaults = ASSET_DEFAULTS[assetKind];
  if (assetKind === "mountain") {
    return { rotation: [0, Math.random() * Math.PI * 2, 0], scale: defaults.scale };
  }
  if (assetKind === "tree") {
    const jitter = 0.9 + Math.random() * 0.2; // ±10%
    return {
      rotation: [0, 0, 0],
      scale: [defaults.scale[0] * jitter, defaults.scale[1] * jitter, defaults.scale[2] * jitter],
    };
  }
  return { rotation: [0, 0, 0], scale: defaults.scale };
}

export function createSceneObject(draft: SceneObjectDraft): SceneObject {
  const defaults = ASSET_DEFAULTS[draft.assetKind];
  const initial = defaultTransform(draft.assetKind);
  const now = Date.now();

  return {
    id: nanoid(),
    assetKind: draft.assetKind,
    name: draft.name ?? defaults.label,
    position: draft.position ?? [0, 0, 0],
    rotation: draft.rotation ?? initial.rotation,
    scale: draft.scale ?? initial.scale,
    material: draft.material ?? {
      color: defaults.color,
      roughness: defaults.roughness,
      metalness: defaults.metalness,
    },
    tags: draft.tags ?? [],
    metadata: draft.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}
