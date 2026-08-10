import type { AssetKind } from "@/features/editor/types";

export type AssetCategory =
  | "buildings"
  | "infrastructure"
  | "nature"
  | "energy"
  | "civic"
  | "utilities"
  | "ethiopia";

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  buildings: "Buildings",
  infrastructure: "Roads & Infrastructure",
  nature: "Nature & Parks",
  energy: "Energy",
  civic: "Civic & Public Services",
  utilities: "Utilities",
  ethiopia: "Ethiopian Heritage",
};

// Icon names are resolved against lucide-react by AssetPaletteItem — kept as
// strings here so this module stays free of React/component dependencies
// (the simulation engine and AI assistant both read from this catalog).
export interface AssetCatalogEntry {
  kind: AssetKind;
  label: string;
  category: AssetCategory;
  description: string;
  iconName:
    | "Building2"
    | "House"
    | "Landmark"
    | "Route"
    | "TreePine"
    | "Trees"
    | "Sun"
    | "Wind"
    | "TrafficCone"
    | "Hospital"
    | "School"
    | "Droplets"
    | "Lamp"
    | "Church"
    | "Mosque"
    | "Mountain"
    | "WavesHorizontal"
    | "Waypoints"
    | "Torus"
    | "CircleDot"
    | "Waves"
    | "Warehouse"
    | "Store"
    | "Clock"
    | "Milestone"
    | "Bus"
    | "Wheat"
    | "TrainFront";
  defaultTags: string[];
}

export const ASSET_CATALOG: AssetCatalogEntry[] = [
  {
    kind: "building-residential",
    label: "Residential Building",
    category: "buildings",
    description: "Housing block — contributes to population capacity.",
    iconName: "House",
    defaultTags: ["residential", "population"],
  },
  {
    kind: "building-commercial",
    label: "Commercial Building",
    category: "buildings",
    description: "Offices and retail — contributes to jobs and traffic demand.",
    iconName: "Building2",
    defaultTags: ["commercial", "jobs"],
  },
  {
    kind: "building-civic",
    label: "Civic Building",
    category: "buildings",
    description: "City hall, courts, and other government buildings.",
    iconName: "Landmark",
    defaultTags: ["civic", "government"],
  },
  {
    kind: "road",
    label: "Road",
    category: "infrastructure",
    description: "Drivable segment used by the traffic simulation.",
    iconName: "Route",
    defaultTags: ["infrastructure", "traffic"],
  },
  {
    kind: "tree",
    label: "Tree",
    category: "nature",
    description: "Improves air quality and reduces the pollution heatmap.",
    iconName: "TreePine",
    defaultTags: ["nature", "air-quality"],
  },
  {
    kind: "park",
    label: "Park",
    category: "nature",
    description: "Green space — improves quality of life and air quality.",
    iconName: "Trees",
    defaultTags: ["nature", "recreation"],
  },
  {
    kind: "solar-panel",
    label: "Solar Panel",
    category: "energy",
    description: "Generates clean power; output varies with the day/night cycle.",
    iconName: "Sun",
    defaultTags: ["energy", "renewable"],
  },
  {
    kind: "wind-turbine",
    label: "Wind Turbine",
    category: "energy",
    description: "Generates clean power; output varies with weather.",
    iconName: "Wind",
    defaultTags: ["energy", "renewable"],
  },
  {
    kind: "traffic-light",
    label: "Traffic Light",
    category: "infrastructure",
    description: "Regulates the traffic simulation at intersections.",
    iconName: "TrafficCone",
    defaultTags: ["infrastructure", "traffic"],
  },
  {
    kind: "hospital",
    label: "Hospital",
    category: "civic",
    description: "Public health facility — serves the surrounding population.",
    iconName: "Hospital",
    defaultTags: ["civic", "health"],
  },
  {
    kind: "school",
    label: "School",
    category: "civic",
    description: "Education facility — serves the surrounding population.",
    iconName: "School",
    defaultTags: ["civic", "education"],
  },
  {
    kind: "water-tank",
    label: "Water Tank",
    category: "utilities",
    description: "Water storage — feeds the water-consumption simulation.",
    iconName: "Droplets",
    defaultTags: ["utilities", "water"],
  },
  {
    kind: "street-light",
    label: "Street Light",
    category: "utilities",
    description: "Consumes power at night; part of the energy simulation.",
    iconName: "Lamp",
    defaultTags: ["utilities", "energy"],
  },
  {
    kind: "monument",
    label: "Monument",
    category: "ethiopia",
    description: "A commemorative monument or obelisk, e.g. Axum-style stelae.",
    iconName: "Landmark",
    defaultTags: ["ethiopia", "culture", "landmark"],
  },
  {
    kind: "church",
    label: "Orthodox Church",
    category: "ethiopia",
    description: "Ethiopian Orthodox church, e.g. Lalibela-style architecture.",
    iconName: "Church",
    defaultTags: ["ethiopia", "culture", "religion"],
  },
  {
    kind: "mosque",
    label: "Mosque",
    category: "ethiopia",
    description: "Mosque with minaret, reflecting Ethiopia's Islamic heritage.",
    iconName: "Mosque",
    defaultTags: ["ethiopia", "culture", "religion"],
  },
  {
    kind: "mountain",
    label: "Mountain",
    category: "ethiopia",
    description: "Highland terrain feature, e.g. Simien Mountains-style peak.",
    iconName: "Mountain",
    defaultTags: ["ethiopia", "terrain", "geography"],
  },
  {
    kind: "river",
    label: "River",
    category: "ethiopia",
    description: "Waterway feature, e.g. Blue Nile / Abay-style river.",
    iconName: "WavesHorizontal",
    defaultTags: ["ethiopia", "terrain", "water"],
  },
  {
    kind: "bridge",
    label: "Bridge",
    category: "infrastructure",
    description: "Span across rivers or valleys — connects the road network.",
    iconName: "Waypoints",
    defaultTags: ["infrastructure", "connectivity"],
  },
  {
    kind: "stadium",
    label: "Stadium",
    category: "civic",
    description: "Sports arena — landmark venue; adds event-day population.",
    iconName: "Torus",
    defaultTags: ["civic", "recreation", "landmark", "population"],
  },
  {
    kind: "fountain",
    label: "Fountain",
    category: "nature",
    description: "Ornamental water feature — improves local air quality.",
    iconName: "CircleDot",
    defaultTags: ["nature", "water", "recreation", "air-quality"],
  },
  {
    kind: "lake",
    label: "Lake",
    category: "nature",
    description: "Freshwater body — blue space that improves air quality.",
    iconName: "Waves",
    defaultTags: ["nature", "water", "air-quality"],
  },
  {
    kind: "warehouse",
    label: "Warehouse",
    category: "infrastructure",
    description: "Industrial storage and logistics — provides warehouse jobs and emits industrial emissions.",
    iconName: "Warehouse",
    defaultTags: ["infrastructure", "industry", "jobs"],
  },
  {
    kind: "market-stall",
    label: "Market Stall",
    category: "buildings",
    description: "Open-air bazaar stall, e.g. Merkato-style trading — small commercial jobs contributor.",
    iconName: "Store",
    defaultTags: ["commercial", "jobs", "ethiopia", "market"],
  },
  {
    kind: "clock-tower",
    label: "Clock Tower",
    category: "civic",
    description: "Ornamental civic landmark that anchors a town square.",
    iconName: "Clock",
    defaultTags: ["civic", "landmark"],
  },
  {
    kind: "well",
    label: "Water Well",
    category: "utilities",
    description: "Communal borehole well — small-scale water infrastructure.",
    iconName: "Droplets",
    defaultTags: ["utilities", "water"],
  },
  {
    kind: "obelisk",
    label: "Obelisk",
    category: "ethiopia",
    description: "Carved stone stele with a gilded tip, e.g. Axum-style obelisk — distinct from the general monument.",
    iconName: "Milestone",
    defaultTags: ["ethiopia", "culture", "landmark"],
  },
  {
    kind: "bus-station",
    label: "Bus Station",
    category: "infrastructure",
    description: "Minibus/bus stop with shelter — transit hub for the traffic simulation.",
    iconName: "Bus",
    defaultTags: ["infrastructure", "traffic", "transit"],
  },
  {
    kind: "grain-silo",
    label: "Grain Silo",
    category: "infrastructure",
    description: "Grain storage and milling — industrial jobs, like a smaller warehouse.",
    iconName: "Wheat",
    defaultTags: ["infrastructure", "industry", "jobs"],
  },
  {
    kind: "railway-station",
    label: "Railway Station",
    category: "infrastructure",
    description: "Passenger rail terminal, e.g. Addis Ababa–Djibouti line-style station — transit jobs hub.",
    iconName: "TrainFront",
    defaultTags: ["infrastructure", "transit", "jobs"],
  },
];

export function getCatalogEntry(kind: AssetKind): AssetCatalogEntry {
  const entry = ASSET_CATALOG.find((item) => item.kind === kind);
  if (!entry) throw new Error(`No catalog entry for asset kind "${kind}"`);
  return entry;
}

export function catalogByCategory(): Map<AssetCategory, AssetCatalogEntry[]> {
  const map = new Map<AssetCategory, AssetCatalogEntry[]>();
  for (const entry of ASSET_CATALOG) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return map;
}
