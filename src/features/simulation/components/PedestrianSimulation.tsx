"use client";

import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Object3D } from "three";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import type { AssetKind, SceneObject } from "@/features/editor/types";

const PEDESTRIAN_ANCHOR_KINDS = new Set<AssetKind>([
  "park",
  "building-residential",
  "building-civic",
  "school",
  "hospital",
]);
const PEDESTRIAN_COLORS = ["#f2c14e", "#d64550", "#4e7ac7", "#5aa469", "#8a5fbf"];

interface Pedestrian {
  id: string;
  centerX: number;
  centerZ: number;
  radius: number;
  speed: number;
  phase: number;
  color: string;
}

function buildPedestrians(anchors: SceneObject[]): Pedestrian[] {
  const pedestrians: Pedestrian[] = [];
  anchors.forEach((anchor, anchorIndex) => {
    const radius = Math.max(2, (anchor.scale[0] + anchor.scale[2]) / 3);
    const count = anchor.assetKind === "park" ? 3 : 1;
    for (let i = 0; i < count; i++) {
      pedestrians.push({
        id: `${anchor.id}-${i}`,
        centerX: anchor.position[0],
        centerZ: anchor.position[2],
        radius,
        speed: 0.35 + ((anchorIndex + i) % 4) * 0.1,
        phase: (anchorIndex * 53 + i * 17) % 100,
        color: PEDESTRIAN_COLORS[(anchorIndex + i) % PEDESTRIAN_COLORS.length],
      });
    }
  });
  return pedestrians;
}

// Anchored to parks and civic/residential buildings, each pedestrian wanders
// a small looping path around its anchor (two out-of-phase sine waves —
// cheap, deterministic, no physics needed for a planning-tool visualization).
//
// Pass `objects` explicitly for a read-only viewer rendering a fetched scene
// (the shared-link page) that never populated the live editor store; omit it
// in the editor itself to read the store directly.
export function PedestrianSimulation({ objects }: { objects?: SceneObject[] } = {}) {
  const storeAnchors = useEditorStore(
    useShallow((state) => selectSceneObjects(state).filter((o) => PEDESTRIAN_ANCHOR_KINDS.has(o.assetKind))),
  );
  const anchors = useMemo(
    () => (objects ? objects.filter((o) => PEDESTRIAN_ANCHOR_KINDS.has(o.assetKind)) : storeAnchors),
    [objects, storeAnchors],
  );
  const pedestrians = useMemo(() => buildPedestrians(anchors), [anchors]);
  const refs = useRef<(Object3D | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < pedestrians.length; i++) {
      const node = refs.current[i];
      const pedestrian = pedestrians[i];
      if (!node) continue;

      const angle = t * pedestrian.speed + pedestrian.phase;
      node.position.set(
        pedestrian.centerX + Math.cos(angle) * pedestrian.radius,
        0.9,
        pedestrian.centerZ + Math.sin(angle * 1.3) * pedestrian.radius,
      );
      node.rotation.y = angle;
    }
  });

  if (pedestrians.length === 0) return null;

  return (
    <Instances limit={pedestrians.length} range={pedestrians.length} castShadow>
      <capsuleGeometry args={[0.22, 0.9, 4, 8]} />
      <meshStandardMaterial roughness={0.8} metalness={0} />
      {pedestrians.map((pedestrian, index) => (
        <Instance
          key={pedestrian.id}
          ref={(node: Object3D | null) => {
            refs.current[index] = node;
          }}
          color={pedestrian.color}
        />
      ))}
    </Instances>
  );
}
