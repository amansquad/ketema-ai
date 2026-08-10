"use client";

import { useMemo } from "react";

import { makeNoiseTexture } from "@/features/editor/lib/proceduralTexture";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { groundColorFor, groundRoughnessFor } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

const GROUND_SIZE = 2000;

// A large flat plane standing in for an "infinite" ground — big enough that
// the horizon never reveals its edge within the editor's camera range, and
// cheap enough (single quad) that it costs nothing to render or raycast.
// Subtle terrain mottling for the ground, tiled across the huge quad: low-
// contrast grey noise that multiplies the dark green material color so the
// terrain isn't one flat, sterile color. Repeat is large because the plane is
// 2000×2000 units while the texture is one small tile — but not so large that
// the pattern turns into high-frequency noise that shimmers under mipmap
// transitions as the camera orbits.
const GROUND_NOISE = {
  seed: 11,
  palette: ["#e6e6e6", "#c2c2c2"] as [string, string],
  repeat: [100, 100] as [number, number],
};

export function Ground() {
  const clearSelection = useEditorStore((state) => state.clearSelection);
  // Weather tints the terrain so snow actually covers the city and rain leaves
  // the ground dark and wet — the ground and the sky can't drift apart.
  const weather = useSimulationStore((state) => state.weather);
  // Created lazily in the browser (never on the server), once per mount.
  const groundMap = useMemo(() => makeNoiseTexture(GROUND_NOISE), []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        clearSelection();
      }}
    >
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      {/* polygonOffset pushes this back in the depth buffer (without moving
          it visually) so it stops z-fighting with SceneGrid's near-coplanar
          quad — the two shimmering/"shaking" as the camera moves. */}
      <meshStandardMaterial
        color={groundColorFor(weather)}
        map={groundMap}
        // Rain-soaked ground picks up a subtle sheen (lower roughness); dry
        // and snowy ground stay matte.
        roughness={groundRoughnessFor(weather)}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}
