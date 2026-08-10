"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { mulberry32 } from "@/lib/random";
import { makeSoftParticleTexture } from "@/features/simulation/lib/cloudTexture";
import { WEATHER_DUST, WEATHER_WIND } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

const EXTENT = 340;
const MAX_Y = 46;

interface DustField {
  count: number;
  position: Float32Array;
  speed: Float32Array;
  scale: Float32Array;
  heightFactor: Float32Array;
  phase: Float32Array;
  dummy: THREE.Object3D;
}

// Ground-level dust streaming downwind (along +X, matching cloud drift and
// rain slant) as stretched soft streaks that wrap around a box around the
// camera. Dust storms drive dense brown sheets; windy days get wispy pale
// swirls at street level. Density/color/opacity come from WEATHER_DUST.
export function WindDust() {
  const weather = useSimulationStore((state) => state.weather);
  const config = WEATHER_DUST[weather];
  const wind = WEATHER_WIND[weather];

  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  const texture = useMemo(() => makeSoftParticleTexture(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        // DoubleSide so streaks stay visible from every orbit angle.
        side: THREE.DoubleSide,
        fog: true,
      }),
    [texture, config.color, config.opacity],
  );
  const dust = useRef<DustField | null>(null);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((frame, delta) => {
    const instanced = mesh.current;
    const anchor = group.current;
    if (!instanced || !anchor || config.count === 0) return;

    if (!dust.current || dust.current.count !== config.count) {
      const rand = mulberry32(0xd05757d0);
      const position = new Float32Array(config.count * 3);
      const speed = new Float32Array(config.count);
      const scale = new Float32Array(config.count);
      const heightFactor = new Float32Array(config.count);
      const phase = new Float32Array(config.count);
      for (let i = 0; i < config.count; i++) {
        position[i * 3] = (rand() * 2 - 1) * EXTENT;
        position[i * 3 + 1] = rand() * MAX_Y;
        position[i * 3 + 2] = (rand() * 2 - 1) * EXTENT;
        speed[i] = 0.7 + rand() * 0.9;
        scale[i] = 1.4 + rand() * 2.2;
        heightFactor[i] = 0.45 + rand() * 0.5;
        phase[i] = rand() * Math.PI * 2;
      }
      dust.current = {
        count: config.count,
        position,
        speed,
        scale,
        heightFactor,
        phase,
        dummy: new THREE.Object3D(),
      };
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    const { position, speed, scale, heightFactor, phase, dummy } = dust.current;
    const dt = Math.min(delta, 0.05);
    const t = frame.clock.elapsedTime;
    const push = wind * 3.2;
    const wrap = EXTENT * 2;
    for (let i = 0; i < config.count; i++) {
      let x = position[i * 3] + push * speed[i] * dt;
      const y = position[i * 3 + 1] + Math.sin(t * 1.2 + phase[i]) * 0.8 * dt;
      const z = position[i * 3 + 2] + Math.cos(t * 0.9 + phase[i]) * 0.5 * dt;
      // Wrap cleanly around the box so the stream is endless, like a conveyor.
      if (x > EXTENT + 6) x -= wrap;
      position[i * 3] = x;
      position[i * 3 + 1] = y;
      position[i * 3 + 2] = z;
      dummy.position.set(x, y, z);
      // Stretch along the wind so the particle reads as a streak, not a dot.
      dummy.scale.set(scale[i], heightFactor[i], 1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    anchor.position.x = camera.position.x;
    anchor.position.z = camera.position.z;
  });

  if (config.count === 0) return null;

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, config.count]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </instancedMesh>
    </group>
  );
}
