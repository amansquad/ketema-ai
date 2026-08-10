import { beforeEach, describe, expect, it } from "vitest";

import { weatherWeightsForDay } from "@/features/simulation/lib/weatherSchedule";

import { useSimulationStore } from "./useSimulationStore";

// Reset the singleton store before each test. Actions survive setState, so the
// store keeps working; only the data fields are reset.
beforeEach(() => {
  useSimulationStore.setState({
    running: true,
    hour24: 8,
    dayOfYear: 0,
    speedHoursPerSecond: 0.25,
    weather: "clear",
    weatherHoursLeft: 1000, // large enough that auto-weather never fires mid-test
    autoWeather: true,
    showPollutionHeatmap: false,
  });
});

describe("advanceHour", () => {
  it("wraps the clock and rolls the calendar across midnight", () => {
    useSimulationStore.getState().advanceHour(20); // 8 AM + 20 h → 4 AM next day
    const state = useSimulationStore.getState();
    expect(state.hour24).toBe(4);
    expect(state.dayOfYear).toBe(1);
  });

  it("wraps the year after 365 simulated days", () => {
    useSimulationStore.getState().advanceHour(365 * 24);
    const state = useSimulationStore.getState();
    expect(state.dayOfYear).toBe(0);
    expect(state.hour24).toBe(8);
  });

  it("does not change the weather while the event countdown is running", () => {
    useSimulationStore.setState({ weather: "clear", weatherHoursLeft: 10 });
    useSimulationStore.getState().advanceHour(5);
    expect(useSimulationStore.getState().weather).toBe("clear");
  });
});

describe("auto weather", () => {
  it("rolls a weather from the day's probability curve when the countdown expires", () => {
    useSimulationStore.setState({ dayOfYear: 151, weatherHoursLeft: 0.5 }); // Jun 1
    useSimulationStore.getState().advanceHour(1);
    const state = useSimulationStore.getState();
    // The pick must carry positive weight on that specific day's curve.
    expect(weatherWeightsForDay(state.dayOfYear)[state.weather]).toBeGreaterThan(0);
    expect(state.weatherHoursLeft).toBeGreaterThan(0);
  });

  it("stops rolling when autoWeather is turned off", () => {
    useSimulationStore.setState({ autoWeather: false, weather: "clear", weatherHoursLeft: 0.5 });
    useSimulationStore.getState().advanceHour(5);
    expect(useSimulationStore.getState().weather).toBe("clear");
  });

  it("resets the countdown when the user picks a weather manually", () => {
    useSimulationStore.setState({ weatherHoursLeft: 0.1 });
    useSimulationStore.getState().setWeather("storm");
    const state = useSimulationStore.getState();
    expect(state.weather).toBe("storm");
    expect(state.weatherHoursLeft).toBeGreaterThanOrEqual(4);
  });

  it("resets the countdown when auto-weather is re-enabled, so it can't fire instantly", () => {
    useSimulationStore.setState({ autoWeather: false, weatherHoursLeft: -5 });
    useSimulationStore.getState().setAutoWeather(true);
    expect(useSimulationStore.getState().weatherHoursLeft).toBeGreaterThanOrEqual(4);
  });

  it("auto-weather never repeats the current weather back-to-back", () => {
    // Force a fire while the season has many options; the picked weather must
    // differ from the current one.
    useSimulationStore.setState({ dayOfYear: 151, weather: "rain", weatherHoursLeft: 0.5 });
    useSimulationStore.getState().advanceHour(1);
    expect(useSimulationStore.getState().weather).not.toBe("rain");
  });
});

describe("randomizeWeather", () => {
  it("picks a weather from the current day's curve", () => {
    useSimulationStore.setState({ dayOfYear: 151 }); // Jun 1 — wet season ramp-up
    useSimulationStore.getState().randomizeWeather();
    expect(weatherWeightsForDay(151)[useSimulationStore.getState().weather]).toBeGreaterThan(0);
  });

  it("still works while auto-weather is off", () => {
    useSimulationStore.setState({ autoWeather: false, dayOfYear: 0 }); // Jan 1 — dry
    useSimulationStore.getState().randomizeWeather();
    expect(weatherWeightsForDay(0)[useSimulationStore.getState().weather]).toBeGreaterThan(0);
  });
});
