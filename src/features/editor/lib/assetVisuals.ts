import { Euler, Quaternion } from "three";

import type { ProceduralTextureSpec } from "@/features/editor/lib/proceduralTexture";
import type { AssetKind, Vector3Tuple } from "@/features/editor/types";

interface PartBase {
  /** Stable id within a kind (e.g. "trunk"/"foliage") — used as part of the instance group key. */
  id: string;
  /** Center position of this part, as a fraction of the object's own scale, measured from the
   *  object's base (0 = resting on the ground, 0.5 = one "unit" above it, etc.) — NOT world units. */
  offset: Vector3Tuple;
  /** This part's size, as a fraction of the object's own scale. */
  scale: Vector3Tuple;
  /** Optional fixed rotation (radians, Euler XYZ) applied to this part in its own local space,
   *  *before* the object's own rotation — e.g. a solar panel tilted toward the sun. The rotation
   *  pivots around the part's own center (its offset position). */
  rotation?: Vector3Tuple;
  /** Optional procedural noise texture applied to this part's shared instanced material — e.g.
   *  rocky cliffs on a mountain. Seeded and deterministic; the instance color still tints it. */
  texture?: ProceduralTextureSpec;
  /** Fixed color, e.g. a tree trunk is always brown regardless of the object's own color. Omit to
   *  use the object's material color (the common case — the "primary" part usually does this). */
  color?: string;
  /** Exactly one part per kind should be primary — it's the click/selection target and what the
   *  transform gizmo attaches to. Defaults to the first part if none is marked. */
  primary?: boolean;
  /** Marked parts get a small, deterministic per-object size/tilt jitter (see objectVariation.ts)
   *  so repeated objects like tree foliage don't render as identical clones. Only the *primary*
   *  part may be marked: the transform gizmo un-applies the jitter only for the primary part when
   *  writing a transform back, so a varied non-primary part would drift on every gizmo drag. */
  varied?: boolean;
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
// green cylinder, a street light that's a bare pole, a building that's a
// bare box). Every part shares one InstancedMesh with every other object's
// same part (e.g. all building bodies share one draw call), so this stays
// cheap regardless of scene size. Parts marked with a fixed `color` are
// accents (roofs, window bands, signage); the unmarked "primary" part picks
// up the object's own material color.
// Neutral two-tone noise palette shared by the stone/concrete assets (monument,
// civic hall, hospital, school). Grey, so when the noise is multiplied by the
// instance's own color each object reads as weathered stone or concrete in its
// particular shade.
const NEUTRAL_PALETTE: [string, string] = ["#d8d6d0", "#8a867c"];

export const ASSET_PARTS: Partial<Record<AssetKind, AssetPart[]>> = {
  tree: [
    { id: "trunk", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 0.175, 0], scale: [0.22, 0.35, 0.22], color: "#6b4a2f" },
    { id: "foliage", geometry: "cone", args: [1, 1, 10], offset: [0, 0.72, 0], scale: [0.95, 0.75, 0.95], primary: true, varied: true },
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
  "building-residential": [
    // Apartment block: plinth, body, dark window bands on all four sides, flat roof with stair bulkhead.
    { id: "base", geometry: "box", args: [1, 1, 1], offset: [0, 0.05, 0], scale: [1.04, 0.1, 1.04], color: "#4c4c52" },
    { id: "body", geometry: "box", args: [1, 1, 1], offset: [0, 0.53, 0], scale: [0.94, 0.86, 0.94], primary: true },
    { id: "windows-front", geometry: "box", args: [1, 1, 1], offset: [0, 0.52, 0.51], scale: [0.82, 0.55, 0.055], color: "#26303f" },
    { id: "windows-back", geometry: "box", args: [1, 1, 1], offset: [0, 0.52, -0.51], scale: [0.82, 0.55, 0.055], color: "#26303f" },
    { id: "windows-left", geometry: "box", args: [1, 1, 1], offset: [0.51, 0.52, 0], scale: [0.055, 0.55, 0.82], color: "#26303f" },
    { id: "windows-right", geometry: "box", args: [1, 1, 1], offset: [-0.51, 0.52, 0], scale: [0.055, 0.55, 0.82], color: "#26303f" },
    { id: "roof", geometry: "box", args: [1, 1, 1], offset: [0, 0.99, 0], scale: [1.0, 0.07, 1.0], color: "#3f3f44" },
    { id: "stairwell", geometry: "box", args: [1, 1, 1], offset: [0, 1.1, 0], scale: [0.26, 0.16, 0.26], color: "#3f3f44" },
  ],
  "building-commercial": [
    // Office tower: retail podium, glass tower, crown, antenna.
    { id: "podium", geometry: "box", args: [1, 1, 1], offset: [0, 0.14, 0], scale: [1.0, 0.28, 1.0], primary: true },
    { id: "tower", geometry: "box", args: [1, 1, 1], offset: [0, 0.62, 0], scale: [0.66, 0.7, 0.66], color: "#22314d" },
    { id: "crown", geometry: "box", args: [1, 1, 1], offset: [0, 0.99, 0], scale: [0.72, 0.05, 0.72], color: "#1a2438" },
    { id: "antenna", geometry: "cylinder", args: [1, 1, 1, 8], offset: [0, 1.06, 0], scale: [0.015, 0.09, 0.015], color: "#dcdcdc" },
  ],
  "building-civic": [
    // Civic hall: broad stone base block topped with a dome and finial.
    {
      id: "base",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.25, 0],
      scale: [1.0, 0.5, 0.8],
      primary: true,
      texture: { seed: 23, palette: NEUTRAL_PALETTE, repeat: [2, 2] },
    },
    { id: "dome", geometry: "sphere", args: [1, 16, 10], offset: [0, 0.6, 0], scale: [0.38, 0.22, 0.38], color: "#b89b3e" },
    { id: "finial", geometry: "cylinder", args: [0.4, 0.4, 1, 6], offset: [0, 0.86, 0], scale: [0.05, 0.09, 0.05], color: "#8a6a2a" },
  ],
  hospital: [
    // Hospital: cross-shaped concrete wards with a red roof cross.
    {
      id: "block",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.36, 0],
      scale: [1.0, 0.72, 0.6],
      primary: true,
      texture: { seed: 31, palette: NEUTRAL_PALETTE, repeat: [2, 2] },
    },
    {
      id: "wing-left",
      geometry: "box",
      args: [1, 1, 1],
      offset: [-0.66, 0.28, 0],
      scale: [0.32, 0.56, 0.8],
      texture: { seed: 32, palette: NEUTRAL_PALETTE, repeat: [2, 2] },
    },
    {
      id: "wing-right",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0.66, 0.28, 0],
      scale: [0.32, 0.56, 0.8],
      texture: { seed: 33, palette: NEUTRAL_PALETTE, repeat: [2, 2] },
    },
    { id: "cross-v", geometry: "box", args: [1, 1, 1], offset: [0, 0.8, 0], scale: [0.2, 0.16, 0.06], color: "#e6453d" },
    { id: "cross-h", geometry: "box", args: [1, 1, 1], offset: [0, 0.8, 0], scale: [0.06, 0.16, 0.2], color: "#e6453d" },
  ],
  school: [
    // School: long weathered-concrete classroom block with a red-roofed bell tower.
    {
      id: "block",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.32, 0],
      scale: [1.0, 0.64, 0.75],
      primary: true,
      texture: { seed: 34, palette: NEUTRAL_PALETTE, repeat: [2, 2] },
    },
    { id: "roof", geometry: "box", args: [1, 1, 1], offset: [0, 0.66, 0], scale: [1.06, 0.07, 0.82], color: "#4a4a50" },
    {
      id: "tower",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.96, 0],
      scale: [0.22, 0.55, 0.22],
      color: "#e8e2d4",
      texture: { seed: 35, palette: NEUTRAL_PALETTE, repeat: [1, 1] },
    },
    { id: "tower-roof", geometry: "cone", args: [1, 1, 4], offset: [0, 1.29, 0], scale: [0.16, 0.13, 0.16], color: "#b0453a" },
  ],
  monument: [
    {
      id: "plinth",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.045, 0],
      scale: [0.9, 0.09, 0.9],
      color: "#b8b2a6",
      texture: { seed: 22, palette: NEUTRAL_PALETTE, repeat: [1, 1] },
    },
    {
      id: "shaft",
      geometry: "cylinder",
      args: [0.5, 1, 1, 4],
      offset: [0, 0.5, 0],
      scale: [0.4, 1, 0.4],
      primary: true,
      texture: { seed: 21, palette: NEUTRAL_PALETTE, repeat: [2, 1] },
    },
  ],
  mountain: [
    // Two stacked cones: a rocky body with a slightly larger snow-cone sitting on top. Both use
    // the same radial segments so their faces stay aligned. The snowcap's base is just proud of
    // the body's surface at the snowline, so it reads as a white coating, not a floating cone.
    // (Its flat bottom disc shows as a subtle white rim at the snowline from low angles —
    // intentional; sinking it would hide the whole coating.)
    {
      id: "body",
      geometry: "cone",
      args: [1, 1, 8],
      offset: [0, 0.5, 0],
      scale: [1, 1, 1],
      primary: true,
      texture: { seed: 42, palette: ["#8f897b", "#555049"], repeat: [2, 2] },
    },
    {
      id: "snowcap",
      geometry: "cone",
      args: [1, 1, 8],
      offset: [0, 0.85, 0],
      scale: [0.525, 0.7, 0.525],
      color: "#f2f5f7",
      texture: { seed: 7, palette: ["#ffffff", "#d9e1e6"], repeat: [1, 1] },
    },
  ],
  "solar-panel": [
    // Ground-mounted array: a low mount block with the panel sheet tilted toward the sun.
    // The panel's low end dips below ground level and is hidden by the ground plane, so
    // it reads as a panel leaning up from the ground with no visible gap or clipping.
    { id: "mount", geometry: "box", args: [1, 1, 1], offset: [0, 0.13, 0], scale: [0.5, 0.24, 0.5], color: "#39424f" },
    { id: "panel", geometry: "box", args: [1, 1, 1], offset: [0, 0.42, 0], scale: [1.2, 0.18, 0.55], rotation: [0.5, 0, 0], primary: true },
  ],
  bridge: [
    // Deck with a low parapet on each edge, carried by three piers. The piers
    // extend below the deck to the ground; the deck's own shadow does the rest.
    { id: "deck", geometry: "box", args: [1, 1, 1], offset: [0, 0.44, 0], scale: [1, 0.14, 0.42], primary: true },
    { id: "parapet-l", geometry: "box", args: [1, 1, 1], offset: [0, 0.53, 0.23], scale: [0.97, 0.12, 0.04], color: "#5a564e" },
    { id: "parapet-r", geometry: "box", args: [1, 1, 1], offset: [0, 0.53, -0.23], scale: [0.97, 0.12, 0.04], color: "#5a564e" },
    { id: "pier-a", geometry: "box", args: [1, 1, 1], offset: [-0.33, 0.2, 0], scale: [0.09, 0.4, 0.36], color: "#6b6660" },
    { id: "pier-b", geometry: "box", args: [1, 1, 1], offset: [0.33, 0.2, 0], scale: [0.09, 0.4, 0.36], color: "#6b6660" },
    { id: "pier-c", geometry: "box", args: [1, 1, 1], offset: [0, 0.2, 0], scale: [0.09, 0.4, 0.36], color: "#6b6660" },
  ],
  stadium: [
    // Oval bowl (the cylinder is squashed by the object's non-uniform scale)
    // with a dark rim ring that reads as the seating deck edge. The bowl is a
    // solid cylinder, so its top cap plays the role of the field surface — a
    // separate sunken "field" part would sit invisible inside the solid.
    {
      id: "bowl",
      geometry: "cylinder",
      args: [1, 1.15, 1, 24],
      offset: [0, 0.3, 0],
      scale: [1, 0.55, 1],
      primary: true,
      texture: { seed: 51, palette: ["#c9c4ba", "#8f8a80"], repeat: [3, 1] },
    },
    { id: "rim", geometry: "cylinder", args: [1, 1, 1, 24], offset: [0, 0.63, 0], scale: [1.04, 0.07, 1.04], color: "#3a3a3f" },
  ],
  fountain: [
    // Round stone basin with a shallow water disc and a central plume.
    { id: "basin", geometry: "cylinder", args: [1, 1.1, 1, 20], offset: [0, 0.1, 0], scale: [1, 0.2, 1], primary: true },
    { id: "water", geometry: "cylinder", args: [1, 1, 1, 20], offset: [0, 0.22, 0], scale: [0.82, 0.05, 0.82], color: "#3fa9c9" },
    { id: "plume", geometry: "cone", args: [0.5, 1, 8], offset: [0, 0.42, 0], scale: [0.07, 0.32, 0.07], color: "#d7f2f7" },
  ],
  lake: [
    // Single flat water disc — like the river, this asset lies flat and never
    // casts a shadow (see FLAT_ASSETS in AssetInstanceGroup).
    { id: "water", geometry: "box", args: [1, 1, 1], offset: [0, 0.05, 0], scale: [1, 1, 1], primary: true },
  ],
  warehouse: [
    // Industrial shed: plain body, raised ridge roof, and a big loading door.
    { id: "body", geometry: "box", args: [1, 1, 1], offset: [0, 0.45, 0], scale: [1, 0.9, 0.7], primary: true },
    { id: "ridge", geometry: "box", args: [1, 1, 1], offset: [0, 0.92, 0], scale: [0.44, 0.1, 0.74], color: "#5a5a60" },
    { id: "door", geometry: "box", args: [1, 1, 1], offset: [0, 0.16, 0.36], scale: [0.32, 0.3, 0.04], color: "#2b2b2f" },
  ],
  "market-stall": [
    // Bazaar stall: a wooden counter under a canvas canopy on two corner poles.
    { id: "counter", geometry: "box", args: [1, 1, 1], offset: [0, 0.2, 0], scale: [0.9, 0.4, 0.6], primary: true },
    { id: "pole-a", geometry: "cylinder", args: [1, 1, 1, 6], offset: [0.4, 0.45, 0.28], scale: [0.045, 0.9, 0.045], color: "#6b4a2f" },
    { id: "pole-b", geometry: "cylinder", args: [1, 1, 1, 6], offset: [-0.4, 0.45, 0.28], scale: [0.045, 0.9, 0.045], color: "#6b4a2f" },
    { id: "canopy", geometry: "box", args: [1, 1, 1], offset: [0, 0.72, 0.05], scale: [1.0, 0.08, 0.8], color: "#d9534f" },
  ],
  "clock-tower": [
    // Slender civic tower: stone base, shaft, a clock face plate, and a peaked roof.
    {
      id: "base",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.15, 0],
      scale: [0.55, 0.3, 0.55],
      texture: { seed: 61, palette: NEUTRAL_PALETTE, repeat: [1, 1] },
    },
    {
      id: "shaft",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.65, 0],
      scale: [0.3, 0.7, 0.3],
      primary: true,
      texture: { seed: 62, palette: NEUTRAL_PALETTE, repeat: [1, 2] },
    },
    { id: "clockface", geometry: "box", args: [1, 1, 1], offset: [0, 0.92, 0.16], scale: [0.22, 0.22, 0.02], color: "#f2ede0" },
    { id: "roof", geometry: "cone", args: [1, 1, 4], offset: [0, 1.06, 0], scale: [0.24, 0.18, 0.24], color: "#5a4a34" },
  ],
  well: [
    // Communal well: a low stone ring, two support posts, and a thatched cap.
    {
      id: "ring",
      geometry: "cylinder",
      args: [1, 1, 1, 14],
      offset: [0, 0.25, 0],
      scale: [0.9, 0.5, 0.9],
      primary: true,
      texture: { seed: 63, palette: NEUTRAL_PALETTE, repeat: [2, 1] },
    },
    { id: "post-a", geometry: "cylinder", args: [1, 1, 1, 6], offset: [0.32, 0.65, 0], scale: [0.05, 0.7, 0.05], color: "#6b4a2f" },
    { id: "post-b", geometry: "cylinder", args: [1, 1, 1, 6], offset: [-0.32, 0.65, 0], scale: [0.05, 0.7, 0.05], color: "#6b4a2f" },
    { id: "cap", geometry: "cone", args: [1, 1, 8], offset: [0, 1.05, 0], scale: [0.55, 0.25, 0.55], color: "#8a6a3a" },
  ],
  obelisk: [
    // Carved stele distinct from the general monument: a plinth, a single
    // tapering stone shaft, and a gilded pyramidion tip.
    {
      id: "plinth",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.04, 0],
      scale: [0.6, 0.08, 0.6],
      color: "#b8b2a6",
      texture: { seed: 64, palette: NEUTRAL_PALETTE, repeat: [1, 1] },
    },
    {
      id: "shaft",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.55, 0],
      scale: [0.22, 1.0, 0.22],
      primary: true,
      texture: { seed: 65, palette: NEUTRAL_PALETTE, repeat: [1, 3] },
    },
    { id: "tip", geometry: "cone", args: [1, 1, 4], offset: [0, 1.05, 0], scale: [0.2, 0.12, 0.2], color: "#e0b84a" },
  ],
  "bus-station": [
    // Minibus stop: a concrete platform, a glazed shelter back wall, a
    // canopy roof, and a bench.
    { id: "platform", geometry: "box", args: [1, 1, 1], offset: [0, 0.05, 0], scale: [1, 0.1, 1], primary: true },
    { id: "shelter", geometry: "box", args: [1, 1, 1], offset: [0, 0.4, -0.4], scale: [0.9, 0.7, 0.06], color: "#3a4a5c" },
    { id: "roof", geometry: "box", args: [1, 1, 1], offset: [0, 0.78, -0.1], scale: [1.0, 0.06, 0.7], color: "#3a3a3f" },
    { id: "bench", geometry: "box", args: [1, 1, 1], offset: [0, 0.22, 0.05], scale: [0.6, 0.12, 0.25], color: "#8a6a4a" },
  ],
  "grain-silo": [
    // Cylindrical steel silo: body, a conical cap, and a mid-height band ring.
    { id: "body", geometry: "cylinder", args: [1, 1, 1, 16], offset: [0, 0.5, 0], scale: [1, 0.9, 1], primary: true },
    { id: "band", geometry: "cylinder", args: [1, 1, 1, 16], offset: [0, 0.3, 0], scale: [1.03, 0.05, 1.03], color: "#5a5a60" },
    { id: "cap", geometry: "cone", args: [1, 1, 16], offset: [0, 1.02, 0], scale: [0.55, 0.28, 0.55], color: "#8a857d" },
  ],
  "railway-station": [
    // Terminal block with a platform canopy carried on two posts.
    {
      id: "block",
      geometry: "box",
      args: [1, 1, 1],
      offset: [0, 0.3, 0],
      scale: [1.0, 0.6, 0.6],
      primary: true,
      texture: { seed: 66, palette: NEUTRAL_PALETTE, repeat: [3, 1] },
    },
    { id: "canopy", geometry: "box", args: [1, 1, 1], offset: [0, 0.62, 0.55], scale: [1.1, 0.06, 0.5], color: "#4a4a50" },
    { id: "canopy-post-a", geometry: "cylinder", args: [1, 1, 1, 6], offset: [0.42, 0.4, 0.75], scale: [0.045, 0.8, 0.045], color: "#3a3a3f" },
    { id: "canopy-post-b", geometry: "cylinder", args: [1, 1, 1, 6], offset: [-0.42, 0.4, 0.75], scale: [0.045, 0.8, 0.045], color: "#3a3a3f" },
  ],
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

/**
 * Combines a part's fixed local rotation (e.g. a tilted solar panel) with the
 * parent object's own rotation, applied in that order: the part is first put
 * into its pose, then the whole object's orientation is applied. Returns a
 * fresh Euler triplet in the same XYZ convention used by
 * `SceneObject.rotation`, or the object rotation unchanged when the part has
 * no rotation of its own (the common case — no allocations).
 */
export function composeRotations(objectRotation: Vector3Tuple, partRotation?: Vector3Tuple): Vector3Tuple {
  if (!partRotation || (partRotation[0] === 0 && partRotation[1] === 0 && partRotation[2] === 0)) {
    return objectRotation;
  }
  const qObject = new Quaternion().setFromEuler(new Euler(objectRotation[0], objectRotation[1], objectRotation[2]));
  const qPart = new Quaternion().setFromEuler(new Euler(partRotation[0], partRotation[1], partRotation[2]));
  const euler = new Euler().setFromQuaternion(qObject.multiply(qPart));
  return [euler.x, euler.y, euler.z];
}

/**
 * Inverse of composeRotations: given a part's composed rotation (part tilt
 * followed by object orientation, q = q_object * q_part), recover the parent
 * object's own rotation as q_object = q_composed * q_part⁻¹. This is what the
 * transform gizmo needs to write back an object rotation that excludes the
 * part's fixed tilt. Parts without a fixed rotation are returned unchanged.
 */
export function invertComposeRotations(composedRotation: Vector3Tuple, partRotation?: Vector3Tuple): Vector3Tuple {
  if (!partRotation || (partRotation[0] === 0 && partRotation[1] === 0 && partRotation[2] === 0)) {
    return composedRotation;
  }
  const qTarget = new Quaternion().setFromEuler(new Euler(composedRotation[0], composedRotation[1], composedRotation[2]));
  const qPart = new Quaternion().setFromEuler(new Euler(partRotation[0], partRotation[1], partRotation[2]));
  const euler = new Euler().setFromQuaternion(qTarget.multiply(qPart.invert()));
  return [euler.x, euler.y, euler.z];
}
