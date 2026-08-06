import type { AssetKind, Vector3Tuple } from "@/features/editor/types";

interface PartBase {
  /** Stable id within a kind (e.g. "trunk"/"foliage") — used as part of the instance group key. */
  id: string;
  /** Center position of this part, as a fraction of the object's own scale, measured from the
   *  object's base (0 = resting on the ground, 0.5 = one "unit" above it, etc.) — NOT world units. */
  offset: Vector3Tuple;
  /** This part's size, as a fraction of the object's own scale. */
  scale: Vector3Tuple;
  /** Fixed color, e.g. a tree trunk is always brown regardless of the object's own color. Omit to
   *  use the object's material color (the common case — the "primary" part usually does this). */
  color?: string;
  /** Exactly one part per kind should be primary — it's the click/selection target and what the
   *  transform gizmo attaches to. Defaults to the first part if none is marked. */
  primary?: boolean;
}

export type AssetPart =
  | (PartBase & { geometry: "box"; args: [width: number, height: number, depth: number] })
  | (PartBase & {
      geometry: "cylinder";
      args: [radiusTop: number, radiusBottom: number, height: number, radialSegments: number];
    })
  | (PartBase & { geometry: "cone"; args: [radius: number, height: number, radialSegments: number] })
  | (PartBase & {
      geometry: "sphere";
      args: [radius: number, widthSegments: number, heightSegments: number];
    });

export const CYLINDRICAL_ASSETS = new Set<AssetKind>([
  "tree",
  "wind-turbine",
  "street-light",
  "traffic-light",
  "water-tank",
  "monument",
]);

function singlePart(isCylindrical: boolean): AssetPart[] {
  return isCylindrical
    ? [{ id: "body", geometry: "cylinder", args: [1, 1, 1, 16], offset: [0, 0.5, 0], scale: [1, 1, 1], primary: true }]
    : [{ id: "body", geometry: "box", args: [1, 1, 1], offset: [0, 0.5, 0], scale: [1, 1, 1], primary: true }];
}

// Compound, hand-tuned part definitions for the assets where a single box or
// cylinder reads as an obviously wrong placeholder (a tree that's just a
// green cylinder, a street light that's a bare pole). Every part shares one
// InstancedMesh with every other object's same part (e.g. all tree trunks
// share one draw call), so this stays cheap regardless of scene size.
export const ASSET_PARTS: Partial<Record<AssetKind, AssetPart[]>> = {
  tree: [
    { id: "trunk", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 0.175, 0], scale: [0.22, 0.35, 0.22], color: "#6b4a2f" },
    { id: "foliage", geometry: "cone", args: [1, 1, 10], offset: [0, 0.72, 0], scale: [0.95, 0.75, 0.95], primary: true },
  ],
  "street-light": [
    { id: "pole", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 0.45, 0], scale: [0.08, 0.9, 0.08], color: "#4b4b4b", primary: true },
    { id: "lamp", geometry: "sphere", args: [1, 10, 10], offset: [0, 0.95, 0], scale: [0.3, 0.3, 0.3], color: "#ffe9a8" },
  ],
  "traffic-light": [
    { id: "pole", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 0.4, 0], scale: [0.1, 0.8, 0.1], color: "#3a3a3a", primary: true },
    { id: "head", geometry: "box", args: [1, 1, 1], offset: [0, 0.9, 0], scale: [0.4, 0.7, 0.25], color: "#232323" },
  ],
  "water-tank": [
    { id: "body", geometry: "cylinder", args: [1, 1, 1, 16], offset: [0, 0.45, 0], scale: [1, 0.85, 1], primary: true },
    { id: "cap", geometry: "sphere", args: [1, 14, 8], offset: [0, 0.92, 0], scale: [1.02, 0.35, 1.02], color: "#7a93ad" },
  ],
  "wind-turbine": [
    { id: "pole", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 0.48, 0], scale: [0.12, 0.96, 0.12], color: "#e8e8e8", primary: true },
    { id: "nacelle", geometry: "box", args: [1, 1, 1], offset: [0, 0.98, 0.08], scale: [0.18, 0.14, 0.5], color: "#d4d4d4" },
    { id: "blade-a", geometry: "box", args: [1, 1, 1], offset: [0, 0.98, 0.4], scale: [0.05, 0.9, 0.14], color: "#f2f2f2" },
    { id: "blade-b", geometry: "box", args: [1, 1, 1], offset: [0, 0.98, 0.4], scale: [0.14, 0.9, 0.05], color: "#f2f2f2" },
  ],
  church: [
    { id: "nave", geometry: "box", args: [1, 1, 1], offset: [0, 0.4, 0], scale: [0.75, 0.8, 0.75], primary: true },
    { id: "spire", geometry: "cone", args: [1, 1, 4], offset: [0, 0.95, 0], scale: [0.4, 0.4, 0.4], color: "#8a6a3a" },
  ],
  mosque: [
    { id: "base", geometry: "box", args: [1, 1, 1], offset: [0, 0.35, 0], scale: [0.85, 0.7, 0.85], primary: true },
    { id: "dome", geometry: "sphere", args: [1, 14, 10], offset: [0, 0.78, 0], scale: [0.55, 0.4, 0.55], color: "#c9a227" },
    { id: "minaret", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0.55, 0.55, 0.55], scale: [0.1, 1.1, 0.1] },
  ],
  monument: [
    { id: "shaft", geometry: "cylinder", args: [0.5, 1, 1, 4], offset: [0, 0.5, 0], scale: [0.4, 1, 0.4], primary: true },
  ],
  mountain: [{ id: "body", geometry: "cone", args: [1, 1, 5], offset: [0, 0.5, 0], scale: [1, 1, 1], primary: true }],
};

/** Every asset kind not customized above renders as a single box or cylinder, matching the shape it already had. */
export function getAssetParts(assetKind: AssetKind): AssetPart[] {
  return ASSET_PARTS[assetKind] ?? singlePart(CYLINDRICAL_ASSETS.has(assetKind));
}

export function getPrimaryPart(parts: AssetPart[]): AssetPart {
  return parts.find((part) => part.primary) ?? parts[0];
}

/** Rotates a local offset vector around the Y axis by `angle` radians. */
export function rotateAroundY(vector: Vector3Tuple, angle: number): Vector3Tuple {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [vector[0] * cos + vector[2] * sin, vector[1], -vector[0] * sin + vector[2] * cos];
}

export function multiplyVectors(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
}
