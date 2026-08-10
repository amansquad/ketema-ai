const MIN_SEPARATION = 3.5; // world units — comfortably clears most single-tile assets
const RING_STEP = 3.5;
const MAX_RINGS = 6;
const POINTS_PER_RING = 8;

/**
 * Finds a ground point near `anchor` that isn't within `MIN_SEPARATION` of
 * any position in `occupied` — an outward ring search (like a clock face,
 * widening each pass) rather than pure randomness, so placements spiral
 * out from the anchor instead of jumping around unpredictably. Falls back
 * to the anchor itself if every ring is somehow full (essentially never,
 * given how sparse placed objects are relative to the ring spacing).
 */
export function findOpenSpot(anchor: [number, number], occupied: [number, number][]): [number, number] {
  if (isClear(anchor, occupied)) return anchor;

  for (let ring = 1; ring <= MAX_RINGS; ring++) {
    const radius = ring * RING_STEP;
    for (let i = 0; i < POINTS_PER_RING; i++) {
      const angle = (i / POINTS_PER_RING) * Math.PI * 2;
      const candidate: [number, number] = [anchor[0] + Math.cos(angle) * radius, anchor[1] + Math.sin(angle) * radius];
      if (isClear(candidate, occupied)) return candidate;
    }
  }
  return anchor;
}

function isClear(point: [number, number], occupied: [number, number][]): boolean {
  for (const [ox, oz] of occupied) {
    const dx = point[0] - ox;
    const dz = point[1] - oz;
    if (dx * dx + dz * dz < MIN_SEPARATION * MIN_SEPARATION) return false;
  }
  return true;
}
