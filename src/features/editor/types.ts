export type Vector3Tuple = [x: number, y: number, z: number];

/**
 * Every placeable asset in the catalog (features/assets, features/ethiopia)
 * maps to one of these kinds. The editor and simulation engine key off this
 * discriminant rather than the free-form `tags` field.
 */
export type AssetKind =
  | "building-residential"
  | "building-commercial"
  | "building-civic"
  | "road"
  | "tree"
  | "park"
  | "solar-panel"
  | "wind-turbine"
  | "traffic-light"
  | "hospital"
  | "school"
  | "water-tank"
  | "street-light"
  | "monument"
  | "church"
  | "mosque"
  | "mountain"
  | "river";

export interface SceneObjectMaterial {
  color: string; // hex, e.g. "#8899aa"
  roughness: number;
  metalness: number;
}

export interface SceneObject {
  id: string;
  assetKind: AssetKind;
  name: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple; // Euler, radians
  scale: Vector3Tuple;
  material: SceneObjectMaterial;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
}

export type TransformMode = "translate" | "rotate" | "scale";

export type SceneObjectDraft = Pick<SceneObject, "assetKind"> &
  Partial<Omit<SceneObject, "id" | "assetKind" | "createdAt" | "updatedAt">>;
