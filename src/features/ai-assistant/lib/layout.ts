export type Vector2Tuple = [x: number, z: number];

export function gridPositions(count: number, origin: Vector2Tuple, spacing: number): Vector2Tuple[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const positions: Vector2Tuple[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions.push([origin[0] + (col - (cols - 1) / 2) * spacing, origin[1] + (row - (cols - 1) / 2) * spacing]);
  }
  return positions;
}

export function scatterPositions(count: number, origin: Vector2Tuple, radius: number): Vector2Tuple[] {
  const positions: Vector2Tuple[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    positions.push([origin[0] + Math.cos(angle) * r, origin[1] + Math.sin(angle) * r]);
  }
  return positions;
}
