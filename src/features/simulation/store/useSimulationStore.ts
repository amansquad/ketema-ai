import { create } from "zustand";

import {
  pickWeatherForDay,
  randomWeatherDurationHours,
} from "@/features/simulation/lib/weatherSchedule";

export type WeatherKind =
  | "clear"
  | "cloudy"
  | "overcast"
  | "rain"
  | "drizzle"
  | "storm"
  | "snow"
  | "fog"
  | "haze"
  | "dust"
  | "windy";

const DAYS_PER_YEAR = 365;

interface SimulationState {
  running: boolean;
  hour24: number; // 0-24, wraps
  dayOfYear: number; // 0..364, Jan 1 = 0 — drives the season cycle
  speedHoursPerSecond: number;
  weather: WeatherKind;
  /** Simulated hours until the next automatic weather change (only rolls while autoWeather is on). */
  weatherHoursLeft: number;
  autoWeather: boolean;
  showPollutionHeatmap: boolean;

  toggleRunning: () => void;
  setHour: (hour24: number) => void;
  advanceHour: (deltaHours: number) => void;
  setSpeed: (speedHoursPerSecond: number) => void;
  setWeather: (weather: WeatherKind) => void;
  randomizeWeather: () => void;
  setAutoWeather: (autoWeather: boolean) => void;
  toggleHeatmap: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  running: true,
  hour24: 8,
  dayOfYear: 0, // Jan 1 — Bega, the dry season (matches the initial "clear")
  speedHoursPerSecond: 0.25,
  weather: "clear",
  weatherHoursLeft: randomWeatherDurationHours(),
  autoWeather: true,
  showPollutionHeatmap: false,

  toggleRunning: () => set((state) => ({ running: !state.running })),
  setHour: (hour24) => set({ hour24: ((hour24 % 24) + 24) % 24 }),
  // Advances the clock and rolls the calendar: every full 24 simulated hours
  // bumps dayOfYear, and when the auto-weather countdown expires a new weather
  // event is drawn from the current season's distribution.
  advanceHour: (deltaHours) =>
    set((state) => {
      const next = state.hour24 + deltaHours;
      const hour24 = ((next % 24) + 24) % 24;
      // Normalized twice so a (hypothetical) negative delta can't leave a
      // negative dayOfYear behind.
      const dayOfYear =
        (((state.dayOfYear + Math.floor(next / 24)) % DAYS_PER_YEAR) + DAYS_PER_YEAR) %
        DAYS_PER_YEAR;
      let weather = state.weather;
      let weatherHoursLeft = state.weatherHoursLeft - deltaHours;
      if (state.autoWeather && weatherHoursLeft <= 0) {
        // Draw from the day's interpolated seasonal odds; avoid repeating the
        // current weather so consecutive events are visible.
        weather = pickWeatherForDay(dayOfYear, Math.random, state.weather);
        weatherHoursLeft = randomWeatherDurationHours();
      }
      return { hour24, dayOfYear, weather, weatherHoursLeft };
    }),
  setSpeed: (speedHoursPerSecond) => set({ speedHoursPerSecond }),
  // Manual picks reset the countdown so auto-weather doesn't instantly override
  // the user's choice — it resumes with a fresh event length instead.
  setWeather: (weather) => set({ weather, weatherHoursLeft: randomWeatherDurationHours() }),
  randomizeWeather: () =>
    set((state) => ({
      // Same day-based odds as auto-weather; avoid the current kind so the
      // button always produces a visible change.
      weather: pickWeatherForDay(state.dayOfYear, Math.random, state.weather),
      weatherHoursLeft: randomWeatherDurationHours(),
    })),
  // Turning auto back on resets the countdown so it can't fire on the very
  // next frame with a stale, already-expired timer.
  setAutoWeather: (autoWeather) =>
    set((state) => ({
      autoWeather,
      weatherHoursLeft: autoWeather ? randomWeatherDurationHours() : state.weatherHoursLeft,
    })),
  toggleHeatmap: () => set((state) => ({ showPollutionHeatmap: !state.showPollutionHeatmap })),
}));
