// Tiny deterministic PRNG (mulberry32), shared by every procedural generator
// in the app (ground noise, cloud sprites, precipitation). Deterministic so
// patterns reproduce across mounts and page reloads, and pure — safe to call
// during render, unlike Math.random (the React purity lint forbids the latter).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
