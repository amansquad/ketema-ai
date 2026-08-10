import * as THREE from "three";

import { mulberry32 } from "@/lib/random";

/**
 * Spec for a procedurally generated two-tone noise texture, attached to an
 * AssetPart so its shared instanced material gets a rocky/rough surface
 * without shipping image assets. Seeded and deterministic — the same spec
 * always produces the identical pattern, across mounts and page reloads.
 */
export interface ProceduralTextureSpec {
  /** Fixed seed for the noise lattices. */
  seed: number;
  /** Two-tone palette (light, dark) mixed by the noise. */
  palette: [string, string];
  /** How many times the pattern tiles across the part's UV space. */
  repeat?: [number, number];
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * Builds a seamless two-octave value-noise texture on a 256×256 canvas: a
 * coarse lattice (broad blotches) blended with a finer lattice (surface
 * grain). Both lattices wrap their last row/column onto the first, so the
 * texture tiles without seams — required for the ground, which repeats it
 * 150×150 times. Returns a THREE.CanvasTexture configured for repeating,
 * sRGB sampling.
 */
export function makeNoiseTexture(spec: ProceduralTextureSpec): THREE.CanvasTexture {
  const size = 256;
  const rand = mulberry32(spec.seed);

  // A periodic value-noise lattice: the last row/column mirrors the first, so
  // bilinear interpolation is continuous across the tile's wrap boundary.
  const makeWrappedLattice = (period: number): number[] => {
    const lattice = Array.from({ length: (period + 1) * (period + 1) }, () => rand());
    for (let i = 0; i < period; i++) {
      lattice[i * (period + 1) + period] = lattice[i * (period + 1)];
      lattice[period * (period + 1) + i] = lattice[i];
    }
    lattice[period * (period + 1) + period] = lattice[0];
    return lattice;
  };

  const sample = (lattice: number[], period: number, gx: number, gy: number): number => {
    const x0 = Math.floor(gx);
    const x1 = Math.min(x0 + 1, period);
    const fx = smoothstep(gx - x0);
    const y0 = Math.floor(gy);
    const y1 = Math.min(y0 + 1, period);
    const fy = smoothstep(gy - y0);
    const row0 = y0 * (period + 1);
    const row1 = y1 * (period + 1);
    const top = lattice[row0 + x0] + (lattice[row0 + x1] - lattice[row0 + x0]) * fx;
    const bottom = lattice[row1 + x0] + (lattice[row1 + x1] - lattice[row1 + x0]) * fx;
    return top + (bottom - top) * fy;
  };

  const COARSE_PERIOD = 16;
  const FINE_PERIOD = 48;
  const coarse = makeWrappedLattice(COARSE_PERIOD);
  const fine = makeWrappedLattice(FINE_PERIOD);

  const [light, dark] = [hexToRgb(spec.palette[0]), hexToRgb(spec.palette[1])];

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y++) {
    const gyCoarse = (y / size) * COARSE_PERIOD;
    const gyFine = (y / size) * FINE_PERIOD;
    for (let x = 0; x < size; x++) {
      const gxCoarse = (x / size) * COARSE_PERIOD;
      const gxFine = (x / size) * FINE_PERIOD;
      // Convex blend of the two seamless octaves stays within [0, 1]. The fine
      // octave is kept low-weight: high-frequency detail is what shimmers under
      // mipmap transitions when the camera moves over a huge textured plane.
      const value =
        sample(coarse, COARSE_PERIOD, gxCoarse, gyCoarse) * 0.8 + sample(fine, FINE_PERIOD, gxFine, gyFine) * 0.2;
      const idx = (y * size + x) * 4;
      data[idx] = dark[0] + (light[0] - dark[0]) * value;
      data[idx + 1] = dark[1] + (light[1] - dark[1]) * value;
      data[idx + 2] = dark[2] + (light[2] - dark[2]) * value;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (spec.repeat) texture.repeat.set(spec.repeat[0], spec.repeat[1]);
  // High anisotropy keeps off-axis (grazing-angle) views crisp so the ground
  // doesn't blur/shimmer as the camera orbits. 8 is safe on virtually all GPUs.
  texture.anisotropy = 8;
  return texture;
}
