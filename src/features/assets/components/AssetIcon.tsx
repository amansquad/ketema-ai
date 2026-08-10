import {
  Building2,
  Bus,
  Church,
  CircleDot,
  Clock,
  Droplets,
  Hospital,
  House,
  Lamp,
  Landmark,
  Milestone,
  Mosque,
  Mountain,
  Route,
  School,
  Store,
  Sun,
  Torus,
  TrafficCone,
  TrainFront,
  TreePine,
  Trees,
  Warehouse,
  Waves,
  WavesHorizontal,
  Waypoints,
  Wheat,
  Wind,
} from "lucide-react";
import type { ComponentType } from "react";

import type { AssetCatalogEntry } from "@/features/assets/catalog/catalog";

const ICONS: Record<AssetCatalogEntry["iconName"], ComponentType<{ className?: string }>> = {
  Building2,
  House,
  Landmark,
  Route,
  TreePine,
  Trees,
  Sun,
  Wind,
  TrafficCone,
  Hospital,
  School,
  Droplets,
  Lamp,
  Church,
  Mosque,
  Mountain,
  WavesHorizontal,
  Waypoints,
  Torus,
  CircleDot,
  Waves,
  Warehouse,
  Store,
  Clock,
  Milestone,
  Bus,
  Wheat,
  TrainFront,
};

export function AssetIcon({
  name,
  className,
}: {
  name: AssetCatalogEntry["iconName"];
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}
