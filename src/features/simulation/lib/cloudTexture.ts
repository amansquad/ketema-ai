import * as THREE from "three";

import { mulberry32 } from "@/lib/random";

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * Soft, puffy cloud sprite: value noise thresholded into a lumpy alpha mask
 * with a radial falloff, drawn on a canvas. Purely procedural — the cloud
 * layer needs no network assets (drei's built-in Cloud fetches its texture
 * from a CDN, which would break offline and hard-fail the whole canvas).
 * White everywhere; tint and opacity are applied by the SpriteMaterial.
 */
export function makeCloudSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const rand = mulberry32(20260707);

  const PERIOD = 6;
  const lattice = Array.from({ length: (PERIOD + 1) * (PERIOD + 1) }, () => rand());
  const sample = (gx: number, gy: number): number => {
    const x0 = Math.floor(gx);
    const x1 = Math.min(x0 + 1, PERIOD);
    const fx = smoothstep(gx - x0);
    const y0 = Math.floor(gy);
    const y1 = Math.min(y0 + 1, PERIOD);
    const fy = smoothstep(gy - y0);
    const row0 = y0 * (PERIOD + 1);
    const row1 = y1 * (PERIOD + 1);
    const top = lattice[row0 + x0] + (lattice[row0 + x1] - lattice[row0 + x0]) * fx;
    const bottom = lattice[row1 + x0] + (lattice[row1 + x1] - lattice[row1 + x0]) * fx;
    return top + (bottom - top) * fy;
  };

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y++) {
    const gy = (y / size) * PERIOD;
    const cy = (y / (size - 1)) * 2 - 1;
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * PERIOD * 2; // stretched: clouds are wider than tall
      const cx = (x / (size - 1)) * 2 - 1;
      const noise = sample(gx, gy);
      // Hard-ish threshold → lumpy cumulus silhouette, then fade the edges.
      const puff = Math.max(0, (noise - 0.5) / 0.5);
      const falloff = Math.max(0, 1 - Math.hypot(cx, cy * 1.5));
      const alpha = Math.min(1, puff * 1.3) * Math.pow(falloff, 1.1);
      const idx = (y * size + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Soft, round particle sprite (radial gradient blob) used for snowflakes and
 * wind-blown dust. Rendering them as instanced planes with this texture looks
 * far softer and more "real" than hard-edged geometry, and it stays cheap:
 * one tiny texture, shared by every particle.
 */
export function makeSoftParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.28)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
