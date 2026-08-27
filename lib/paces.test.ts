import { describe, expect, it } from "vitest";
import {
  computeHeartRateZones,
  computePaceZones,
  computeThresholdPaceSecondsPerKm,
  formatPaceSecondsPerKm,
  getAthletePaceZone,
  riegelEquivalentSeconds,
  selectBasePerformance,
  type PerformanceReference,
} from "./paces";

describe("riegelEquivalentSeconds", () => {
  it("projects a 5k time to its 10k equivalent", () => {
    // 5k in 20:00 -> ~10k in 41:42 (1200 * 2^1.06)
    const result = riegelEquivalentSeconds(1200, 5000, 10000);
    expect(result).toBeCloseTo(2502.06, 0);
  });

  it("returns the same time when source and target distances are equal", () => {
    expect(riegelEquivalentSeconds(2550, 10000, 10000)).toBe(2550);
  });
});

describe("selectBasePerformance", () => {
  const perfs: PerformanceReference[] = [
    { distance: "marathon", tempsSecondes: 12600, datePerf: "2026-07-20", type: "reel" },
    { distance: "10k", tempsSecondes: 2550, datePerf: "2026-01-10", type: "reel" },
    { distance: "5k", tempsSecondes: 1200, datePerf: "2026-06-01", type: "reel" },
  ];

  it("prefers a more reliable distance over a more recent but less reliable one", () => {
    // The marathon is the most recent, but 5k/10k are more reliable.
    const base = selectBasePerformance(perfs);
    expect(base?.distance).toBe("5k");
  });

  it("breaks ties within the same reliability tier by recency", () => {
    const tied: PerformanceReference[] = [
      { distance: "10k", tempsSecondes: 2600, datePerf: "2025-01-01", type: "reel" },
      { distance: "10k", tempsSecondes: 2550, datePerf: "2026-01-10", type: "reel" },
    ];
    expect(selectBasePerformance(tied)?.datePerf).toBe("2026-01-10");
  });

  it("ignores estimated and objective performances", () => {
    const onlyEstimates: PerformanceReference[] = [
      { distance: "10k", tempsSecondes: 2400, datePerf: "2026-01-01", type: "estime" },
      { distance: "10k", tempsSecondes: 2300, datePerf: "2026-02-01", type: "objectif" },
    ];
    expect(selectBasePerformance(onlyEstimates)).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(selectBasePerformance([])).toBeNull();
  });
});

describe("computeThresholdPaceSecondsPerKm", () => {
  it("returns the pace directly for a 10k performance", () => {
    const pace = computeThresholdPaceSecondsPerKm({
      distance: "10k",
      tempsSecondes: 2550,
      datePerf: "2026-01-01",
      type: "reel",
    });
    expect(pace).toBeCloseTo(255, 0); // 42:30 / 10km = 4:15/km
  });
});

describe("computePaceZones", () => {
  const threshold = 240; // 4:00/km

  it("derives every zone as a multiple of the threshold pace", () => {
    const zones = computePaceZones(threshold);
    expect(zones.z4_seuil).toEqual({ minSecondsPerKm: 233, maxSecondsPerKm: 247 });
    expect(zones.z2_endurance).toEqual({ minSecondsPerKm: 276, maxSecondsPerKm: 312 });
  });

  it("leaves z6 with no fast-side bound", () => {
    const zones = computePaceZones(threshold);
    expect(zones.z6_anaerobie.minSecondsPerKm).toBeNull();
    expect(zones.z6_anaerobie.maxSecondsPerKm).toBe(211);
  });
});

describe("computeHeartRateZones", () => {
  it("derives every zone as a percentage of FC max", () => {
    const zones = computeHeartRateZones(190);
    expect(zones.z2_endurance).toEqual({ minBpm: 133, maxBpm: 152 });
    expect(zones.z5_vma).toEqual({ minBpm: 175, maxBpm: 184 });
  });
});

describe("getAthletePaceZone", () => {
  it("returns available: false when the athlete has no reference performance", () => {
    const result = getAthletePaceZone("z4_seuil", []);
    expect(result).toEqual({ available: false, zone: "z4_seuil" });
  });

  it("returns a computed range when a reference performance exists", () => {
    const result = getAthletePaceZone("z4_seuil", [
      { distance: "10k", tempsSecondes: 2400, datePerf: "2026-01-01", type: "reel" },
    ]);
    expect(result.available).toBe(true);
  });
});

describe("formatPaceSecondsPerKm", () => {
  it("formats seconds/km as mm:ss/km", () => {
    expect(formatPaceSecondsPerKm(255)).toBe("4:15/km");
    expect(formatPaceSecondsPerKm(180)).toBe("3:00/km");
    expect(formatPaceSecondsPerKm(65)).toBe("1:05/km");
  });
});
