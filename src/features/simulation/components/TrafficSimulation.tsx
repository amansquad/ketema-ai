"use client";

import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Object3D } from "three";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import type { SceneObject } from "@/features/editor/types";

const VEHICLE_COLORS = ["#e2e2e2", "#3a6bd6", "#c94b4b", "#e0b429"];

interface Vehicle {
  id: string;
  originX: number;
  originZ: number;
  forwardX: number;
  forwardZ: number;
  halfLength: number;
  speed: number;
  phase: number;
  color: string;
}

function buildVehicles(roads: SceneObject[]): Vehicle[] {
  return roads
    .filter((road) => road.scale[2] > 2)
    .map((road, index) => {
      const yaw = road.rotation[1];
      return {
        id: road.id,
        originX: road.position[0],
        originZ: road.position[2],
        forwardX: Math.sin(yaw),
        forwardZ: Math.cos(yaw),
        halfLength: Math.max(0, road.scale[2] / 2 - 1.5),
        speed: 0.6 + (index % 3) * 0.15,
        phase: (index * 37) % 100,
        color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
      };
    });
}

// One vehicle per road, oscillating back and forth along the road's local
// length. Positions are mutated directly on each Instance's Object3D every
// frame (not via React state/props) so hundreds of vehicles cost no re-renders.
//
// Pass `objects` explicitly for a read-only viewer rendering a fetched scene
// (the shared-link page) that never populated the live editor store; omit it
// in the editor itself to read the store directly.
export function TrafficSimulation({ objects }: { objects?: SceneObject[] } = {}) {
  const storeRoads = useEditorStore(
    useShallow((state) => selectSceneObjects(state).filter((o) => o.assetKind === "road")),
  );
  const roads = useMemo(
    () => (objects ? objects.filter((o) => o.assetKind === "road") : storeRoads),
    [objects, storeRoads],
  );
  const vehicles = useMemo(() => buildVehicles(roads), [roads]);
  const refs = useRef<(Object3D | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < vehicles.length; i++) {
      const node = refs.current[i];
      const vehicle = vehicles[i];
      if (!node || vehicle.halfLength <= 0) continue;

      const offset = Math.sin(t * vehicle.speed + vehicle.phase) * vehicle.halfLength;
      node.position.set(
        vehicle.originX + vehicle.forwardX * offset,
        0.4,
        vehicle.originZ + vehicle.forwardZ * offset,
      );
      node.rotation.y = Math.atan2(vehicle.forwardX, vehicle.forwardZ);
    }
  });

  if (vehicles.length === 0) return null;

  return (
    <Instances limit={vehicles.length} range={vehicles.length} castShadow>
      <boxGeometry args={[0.9, 0.6, 1.8]} />
      <meshStandardMaterial roughness={0.4} metalness={0.3} />
      {vehicles.map((vehicle, index) => (
        <Instance
          key={vehicle.id}
          ref={(node: Object3D | null) => {
            refs.current[index] = node;
          }}
          color={vehicle.color}
        />
      ))}
    </Instances>
  );
}
