"use client";

import { useEditorStore } from "@/features/editor/store/useEditorStore";

const GROUND_SIZE = 2000;

// A large flat plane standing in for an "infinite" ground — big enough that
// the horizon never reveals its edge within the editor's camera range, and
// cheap enough (single quad) that it costs nothing to render or raycast.
export function Ground() {
  const clearSelection = useEditorStore((state) => state.clearSelection);

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
        color="#26312b"
        roughness={1}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}
