import { describe, expect, it } from "vitest";
import { computeSeanceVolume, type BlocSeanceInput } from "./volume";
import type { PerformanceReference } from "./paces";

const perfs10k: PerformanceReference[] = [
  { distance: "10k", tempsSecondes: 2550, datePerf: "2026-01-01", type: "reel" }, // 4:15/km
];

function bloc(overrides: Partial<BlocSeanceInput>): BlocSeanceInput {
  return {
    id: "b",
    parentBlocId: null,
    repetitions: 1,
    modeDuree: "libre",
    distanceMetres: null,
    dureeSecondes: null,
    cibleType: "libre",
    cibleZone: null,
    cibleAllureSecondesParKm: null,
    ...overrides,
  };
}

describe("computeSeanceVolume", () => {
  it("converts a time-based bloc to distance via the athlete's zone pace", () => {
    const result = computeSeanceVolume(
      [
        bloc({
          id: "1",
          modeDuree: "temps",
          dureeSecondes: 1800,
          cibleType: "zone_allure",
          cibleZone: "z2_endurance",
        }),
      ],
      perfs10k
    );

    expect(result.dureeSecondes).toBe(1800);
    expect(result.distanceMetres).toBe(5760);
    expect(result.estimationComplete).toBe(true);
  });

  it("sums a nested repeated bloc (N x (effort + récup))", () => {
    const blocs: BlocSeanceInput[] = [
      bloc({
        id: "parent",
        parentBlocId: null,
        repetitions: 4,
        modeDuree: "libre",
        cibleType: "libre",
      }),
      bloc({
        id: "effort",
        parentBlocId: "parent",
        modeDuree: "distance",
        distanceMetres: 1000,
        cibleType: "zone_allure",
        cibleZone: "z4_seuil",
      }),
      bloc({
        id: "recup",
        parentBlocId: "parent",
        modeDuree: "temps",
        dureeSecondes: 120,
        cibleType: "zone_allure",
        cibleZone: "z1_recup",
      }),
    ];

    const result = computeSeanceVolume(blocs, perfs10k);

    expect(result.dureeSecondes).toBe(1500); // 4 x (255s effort + 120s récup)
    expect(result.distanceMetres).toBe(5368);
    expect(result.distanceKm).toBe(5.37);
    expect(result.dureeMinutes).toBe(25);
    expect(result.estimationComplete).toBe(true);
  });

  it("flags an incomplete estimate when the athlete has no reference performance", () => {
    const result = computeSeanceVolume(
      [
        bloc({
          id: "1",
          modeDuree: "temps",
          dureeSecondes: 1800,
          cibleType: "zone_allure",
          cibleZone: "z2_endurance",
        }),
      ],
      []
    );

    expect(result.dureeSecondes).toBe(1800); // duration is known directly, no pace needed
    expect(result.distanceMetres).toBe(0); // can't convert to distance without a reference
    expect(result.estimationComplete).toBe(false);
  });

  it("does not flag libre/rpe blocs as an incomplete estimate", () => {
    const result = computeSeanceVolume(
      [
        bloc({
          id: "1",
          modeDuree: "temps",
          dureeSecondes: 3600,
          cibleType: "libre",
        }),
      ],
      []
    );

    expect(result.dureeSecondes).toBe(3600);
    expect(result.distanceMetres).toBe(0);
    expect(result.estimationComplete).toBe(true);
  });

  it("handles a flat repeated bloc with an absolute pace target, no children", () => {
    const result = computeSeanceVolume(
      [
        bloc({
          id: "1",
          repetitions: 5,
          modeDuree: "distance",
          distanceMetres: 1000,
          cibleType: "allure_absolue",
          cibleAllureSecondesParKm: 300,
        }),
      ],
      []
    );

    expect(result.distanceMetres).toBe(5000);
    expect(result.dureeSecondes).toBe(1500);
    expect(result.estimationComplete).toBe(true);
  });
});
