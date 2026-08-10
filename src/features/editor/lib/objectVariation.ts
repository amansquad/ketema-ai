import { Euler, Quaternion } from "three";

import type { AssetPart } from "@/features/editor/lib/assetVisuals";
import type { Vector3Tuple } from "@/features/editor/types";

export interface PartVariation {
  /** Multiplier applied to the part's scale, e.g. 0.9–1.1. */
  scaleMul: number;
  /** Small fixed tilt added to the part's own rotation around X, radians. */
  tilt: number;
}

// FNV-1a hash of the object id feeding a mulberry32-style stream, so the
// variation is deterministic per object (stable across renders, reloads, and
// gizmo writes) yet different for every tree — a forest no longer renders as
// identical clones.
function variationFromId(objectId: string): PartVariation {
  let h = 2166136261;
  for (let i = 0; i < objectId.length; i++) {
    h ^= objectId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h |= 0;
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    scaleMul: 0.88 + rand() * 0.24, // ±12%
    tilt: (rand() - 0.5) * 0.14, // ±~4°
  };
}

/**
 * Per-object variation for parts marked `varied` (e.g. a tree's foliage):
 * a small size + tilt jitter so a forest doesn't look uniform. Returns null
 * for unvaried parts. Because it is derived purely from the object id, the
 * same value is computed by the renderer and by the transform gizmo, which
 * un-applies it (see unapplyVariation) before writing a transform back.
 */
export function getPartVariation(objectId: string, part: AssetPart): PartVariation | null {
  return part.varied ? variationFromId(objectId) : null;
}

/**
 * Removes a part's variation tilt from a rotation that already includes it
 * (q = q_object · q_part · q_tilt → recovers q_object). Used by the gizmo so
 * an object's stored rotation never accumulates the per-object jitter.
 */
export function unapplyVariation(rotation: Vector3Tuple, variation: PartVariation): Vector3Tuple {
  if (variation.tilt === 0) return rotation;
  const qTarget = new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], rotation[2]));
  const qTilt = new Quaternion().setFromEuler(new Euler(variation.tilt, 0, 0));
  const euler = new Euler().setFromQuaternion(qTarget.multiply(qTilt.invert()));
  return [euler.x, euler.y, euler.z];
}
