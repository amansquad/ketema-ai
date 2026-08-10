import { z } from "zod";

// Kept in sync by hand with AssetKind in @/features/editor/types — duplicated
// here (rather than imported) because this schema is also compiled into a
// JSON schema for the LLM provider, which needs plain string literals.
const ASSET_KINDS = [
  "building-residential",
  "building-commercial",
  "building-civic",
  "road",
  "tree",
  "park",
  "solar-panel",
  "wind-turbine",
  "traffic-light",
  "hospital",
  "school",
  "water-tank",
  "street-light",
  "monument",
  "church",
  "mosque",
  "mountain",
  "river",
  "bridge",
  "stadium",
  "fountain",
  "lake",
  "warehouse",
  "market-stall",
  "clock-tower",
  "well",
  "obelisk",
  "bus-station",
  "grain-silo",
  "railway-station",
] as const;

export const AssetKindSchema = z.enum(ASSET_KINDS);

export const DistrictTypeSchema = z.enum(["residential", "commercial", "solar-farm", "park", "civic"]);

const PlaceAssetsCommandSchema = z.object({
  type: z.literal("placeAssets"),
  assetKind: AssetKindSchema,
  count: z.number().describe("How many to place, 1-200"),
  layout: z.enum(["grid", "scatter"]),
  originX: z.number().describe("World X coordinate for the placement center"),
  originZ: z.number().describe("World Z coordinate for the placement center"),
});

const CreateDistrictCommandSchema = z.object({
  type: z.literal("createDistrict"),
  districtType: DistrictTypeSchema,
  count: z.number().describe("Roughly how many buildings/objects the district should contain, 1-200"),
  originX: z.number().describe("World X coordinate for the district center"),
  originZ: z.number().describe("World Z coordinate for the district center"),
});

export const SceneCommandSchema = z.discriminatedUnion("type", [
  PlaceAssetsCommandSchema,
  CreateDistrictCommandSchema,
]);

export const SceneCommandsResponseSchema = z.object({
  commands: z.array(SceneCommandSchema),
});

export type SceneCommand = z.infer<typeof SceneCommandSchema>;
export type SceneCommandsResponse = z.infer<typeof SceneCommandsResponseSchema>;
