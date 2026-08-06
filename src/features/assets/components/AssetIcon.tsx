import {
  Building2,
  Church,
  Droplets,
  Hospital,
  House,
  Lamp,
  Landmark,
  Mosque,
  Mountain,
  Route,
  School,
  Sun,
  TrafficCone,
  TreePine,
  Trees,
  WavesHorizontal,
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
