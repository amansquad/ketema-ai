import { create } from "zustand";

export type WeatherKind = "clear" | "cloudy" | "rain";

interface SimulationState {
  running: boolean;
  hour24: number; // 0-24, wraps
  speedHoursPerSecond: number;
  weather: WeatherKind;
  showPollutionHeatmap: boolean;

  toggleRunning: () => void;
  setHour: (hour24: number) => void;
  advanceHour: (deltaHours: number) => void;
  setSpeed: (speedHoursPerSecond: number) => void;
  setWeather: (weather: WeatherKind) => void;
  toggleHeatmap: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  running: true,
  hour24: 8,
  speedHoursPerSecond: 0.25,
  weather: "clear",
  showPollutionHeatmap: false,

  toggleRunning: () => set((state) => ({ running: !state.running })),
  setHour: (hour24) => set({ hour24: ((hour24 % 24) + 24) % 24 }),
  advanceHour: (deltaHours) =>
    set((state) => ({ hour24: ((state.hour24 + deltaHours) % 24 + 24) % 24 })),
  setSpeed: (speedHoursPerSecond) => set({ speedHoursPerSecond }),
  setWeather: (weather) => set({ weather }),
  toggleHeatmap: () => set((state) => ({ showPollutionHeatmap: !state.showPollutionHeatmap })),
}));
