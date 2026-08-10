import type { AssetKind, SceneObjectDraft, Vector3Tuple } from "@/features/editor/types";

type Extra = Partial<Omit<SceneObjectDraft, "assetKind" | "position">>;

/**
 * The starter city seeded into local-only scratch projects (e.g. "demo") so
 * the editor opens on a populated city instead of an empty void. Pure data:
 * every entry becomes a SceneObject via createSceneObject, which fills in the
 * defaults (scale, color, material, name) for anything not specified here.
 *
 * Layout is a loose grid: three east-west avenues at z = -24/0/24, two
 * north-south streets at x = ±16, a river running north-south at x = -40 with
 * a bridge across it, and the "extras" (stadium, warehouses, solar farm, wind
 * farm, heritage cluster, mountains) around the perimeter. All coordinates are
 * world units; part shapes live in assetVisuals.ts, not here.
 */
const PI_HALF = Math.PI / 2;

function place(kind: AssetKind, position: Vector3Tuple, extra: Extra = {}): SceneObjectDraft {
  return { assetKind: kind, position, ...extra };
}

export function buildDemoScene(): SceneObjectDraft[] {
  return [
    // ── Road grid ────────────────────────────────────────────────────────────
    // East-west avenues (low profile). North-south streets use a slightly
    // taller scale so they read as passing over the avenues at intersections
    // instead of z-fighting with them.
    place("road", [0, 0, -24], { scale: [4, 0.1, 120] }),
    place("road", [0, 0, 0], { scale: [4, 0.1, 120] }),
    place("road", [0, 0, 24], { scale: [4, 0.1, 120] }),
    place("road", [-16, 0, 0], { rotation: [0, PI_HALF, 0], scale: [4, 0.2, 80] }),
    place("road", [16, 0, 0], { rotation: [0, PI_HALF, 0], scale: [4, 0.2, 80] }),

    // ── Residential blocks ───────────────────────────────────────────────────
    place("building-residential", [-18, 0, -18]),
    place("building-residential", [-6, 0, -18]),
    place("building-residential", [6, 0, -18]),
    place("building-residential", [18, 0, -18]),
    place("building-residential", [-18, 0, 18]),
    place("building-residential", [-6, 0, 18]),
    place("building-residential", [6, 0, 18]),
    place("building-residential", [18, 0, 18]),
    place("building-residential", [-18, 0, 32]),
    place("building-residential", [-6, 0, 32]),
    place("building-residential", [6, 0, 32]),
    place("building-residential", [18, 0, 32]),

    // ── Downtown (along the center avenue) ───────────────────────────────────
    place("building-commercial", [-8, 0, 6]),
    place("building-commercial", [8, 0, 6]),
    place("building-commercial", [-8, 0, -6]),
    place("building-commercial", [8, 0, -6]),
    place("building-commercial", [0, 0, 10]),
    place("building-civic", [0, 0, 16]),
    place("fountain", [0, 0, -12]),
    place("school", [-6, 0, -32]),
    place("hospital", [6, 0, 32]),
    place("water-tank", [24, 0, 26]),

    // ── Park with trees ──────────────────────────────────────────────────────
    place("park", [36, 0, -16], { scale: [12, 0.2, 12] }),
    place("tree", [32, 0, -12]),
    place("tree", [40, 0, -12]),
    place("tree", [32, 0, -20]),
    place("tree", [40, 0, -20]),
    place("tree", [28, 0, -16]),
    place("tree", [44, 0, -16]),

    // Street trees along the avenues and heritage cluster
    place("tree", [-8, 0, -19]),
    place("tree", [8, 0, -19]),
    place("tree", [-8, 0, 19]),
    place("tree", [8, 0, 19]),
    place("tree", [46, 0, 28]),
    place("tree", [46, 0, 48]),
    place("tree", [36, 0, 46]),

    // ── Water: river, bridge, lake ───────────────────────────────────────────
    place("river", [-40, 0, 20], { rotation: [0, PI_HALF, 0], scale: [6, 0.1, 30] }),
    place("bridge", [-40, 0, 20], { rotation: [0, PI_HALF, 0] }),
    place("lake", [-48, 0, -2], { scale: [14, 0.1, 10] }),
    place("tree", [-40, 0, 6]),
    place("tree", [-40, 0, 34]),
    place("tree", [-52, 0, 6]),
    place("tree", [-52, 0, 34]),

    // ── Extras around the perimeter ──────────────────────────────────────────
    place("stadium", [52, 0, 20]),
    place("warehouse", [44, 0, -34]),
    place("warehouse", [52, 0, -38]),
    place("warehouse", [48, 0, -44]),
    place("solar-panel", [28, 0, 18]),
    place("solar-panel", [32, 0, 18]),
    place("solar-panel", [36, 0, 18]),
    place("wind-turbine", [-48, 0, 44]),
    place("wind-turbine", [-56, 0, 46]),
    place("wind-turbine", [-52, 0, 52]),

    // Ethiopian heritage cluster (northeast)
    place("monument", [42, 0, 32]),
    place("church", [50, 0, 38]),
    place("mosque", [42, 0, 44]),

    // ── Street furniture ─────────────────────────────────────────────────────
    place("street-light", [-12, 0, -3.5]),
    place("street-light", [12, 0, -3.5]),
    place("street-light", [-12, 0, 3.5]),
    place("street-light", [12, 0, 3.5]),
    place("street-light", [-4, 0, -12]),
    place("street-light", [4, 0, -12]),
    place("traffic-light", [-16, 0, -24]),
    place("traffic-light", [16, 0, -24]),
    place("traffic-light", [-16, 0, 24]),
    place("traffic-light", [16, 0, 24]),

    // ── Distant mountains (Simien-style ring) ────────────────────────────────
    place("mountain", [-60, 0, -60], { rotation: [0, 0.6, 0], scale: [20, 15, 20] }),
    place("mountain", [60, 0, -60], { rotation: [0, 2.4, 0], scale: [22, 17, 22] }),
    place("mountain", [-60, 0, 60], { rotation: [0, 4.2, 0], scale: [18, 13, 18] }),
    place("mountain", [60, 0, 60], { rotation: [0, 1.2, 0], scale: [20, 15, 20] }),
    place("mountain", [0, 0, -70], { rotation: [0, 3.2, 0], scale: [28, 20, 28] }),
    place("mountain", [0, 0, 70], { rotation: [0, 5.0, 0], scale: [24, 18, 24] }),
  ];
}
