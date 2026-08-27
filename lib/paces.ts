// Pace and heart-rate zone calculations. All tunable coefficients live in
// the exported config objects below — adjust the numbers, not the logic.

export type DistanceRef = "5k" | "10k" | "semi" | "marathon";
export type PerformanceType = "reel" | "estime" | "objectif";

export type ZoneAllure =
  | "z1_recup"
  | "z2_endurance"
  | "z3_marathon"
  | "z4_seuil"
  | "z5_vma"
  | "z6_anaerobie";

export interface PerformanceReference {
  distance: DistanceRef;
  tempsSecondes: number;
  datePerf: string; // ISO date (YYYY-MM-DD)
  type: PerformanceType;
}

export interface PaceRange {
  /** Fastest edge of the zone, in seconds/km. Null = no fast-side bound (z6). */
  minSecondsPerKm: number | null;
  /** Slowest edge of the zone, in seconds/km. */
  maxSecondsPerKm: number;
}

export interface HeartRateRange {
  minBpm: number;
  maxBpm: number;
}

export type PaceZoneResult =
  | { available: true; zone: ZoneAllure; range: PaceRange }
  | { available: false; zone: ZoneAllure };

// --- Config: adjust freely, the logic below never hardcodes a number. ---

export const DISTANCE_METRES: Record<DistanceRef, number> = {
  "5k": 5000,
  "10k": 10000,
  semi: 21097,
  marathon: 42195,
};

/** Riegel cross-distance time equivalence: T2 = T1 * (D2/D1)^RIEGEL_EXPONENT */
export const RIEGEL_EXPONENT = 1.06;

/**
 * Reliability ranking for estimating threshold pace: lower is more
 * reliable. 5k and 10k are tied for most reliable, marathon least.
 */
export const RELIABILITY_RANK: Record<DistanceRef, number> = {
  "5k": 1,
  "10k": 1,
  semi: 2,
  marathon: 3,
};

/**
 * Pace zone bounds as a multiplier of threshold pace (seconds/km). A
 * smaller multiplier means a faster pace. z6 has no fast-side bound.
 */
export const PACE_ZONE_COEFFICIENTS: Record<ZoneAllure, { min: number | null; max: number }> = {
  z1_recup: { min: 1.30, max: 1.45 },
  z2_endurance: { min: 1.15, max: 1.30 },
  z3_marathon: { min: 1.06, max: 1.12 },
  z4_seuil: { min: 0.97, max: 1.03 },
  z5_vma: { min: 0.88, max: 0.94 },
  z6_anaerobie: { min: null, max: 0.88 },
};

export const ZONE_LABELS: Record<ZoneAllure, string> = {
  z1_recup: "Z1 — Récupération",
  z2_endurance: "Z2 — Endurance",
  z3_marathon: "Z3 — Marathon",
  z4_seuil: "Z4 — Seuil",
  z5_vma: "Z5 — VMA",
  z6_anaerobie: "Z6 — Anaérobie",
};

export const DISTANCE_LABELS: Record<DistanceRef, string> = {
  "5k": "5 km",
  "10k": "10 km",
  semi: "Semi-marathon",
  marathon: "Marathon",
};

export const PERFORMANCE_TYPE_LABELS: Record<PerformanceType, string> = {
  reel: "Réel",
  estime: "Estimé",
  objectif: "Objectif",
};

/** Heart-rate zone bounds as a percentage of FC max. */
export const FC_ZONE_COEFFICIENTS: Record<ZoneAllure, { min: number; max: number }> = {
  z1_recup: { min: 60, max: 70 },
  z2_endurance: { min: 70, max: 80 },
  z3_marathon: { min: 80, max: 87 },
  z4_seuil: { min: 87, max: 92 },
  z5_vma: { min: 92, max: 97 },
  z6_anaerobie: { min: 97, max: 100 },
};

// --- Logic ---

export function riegelEquivalentSeconds(
  knownTimeSeconds: number,
  knownDistanceMetres: number,
  targetDistanceMetres: number
): number {
  return knownTimeSeconds * Math.pow(targetDistanceMetres / knownDistanceMetres, RIEGEL_EXPONENT);
}

/**
 * Picks the reference performance threshold pace is based on: the most
 * reliable distance available among "reel" performances (5k/10k > semi >
 * marathon), and within that distance the most recent one. A recent
 * marathon does not override an older but more reliable 10k — reliability
 * is the primary criterion, recency the tie-breaker.
 */
export function selectBasePerformance(
  performances: PerformanceReference[]
): PerformanceReference | null {
  const reels = performances.filter((p) => p.type === "reel");
  if (reels.length === 0) return null;

  const bestRank = Math.min(...reels.map((p) => RELIABILITY_RANK[p.distance]));
  const candidates = reels.filter((p) => RELIABILITY_RANK[p.distance] === bestRank);

  return candidates.reduce((mostRecent, current) =>
    current.datePerf > mostRecent.datePerf ? current : mostRecent
  );
}

/**
 * Threshold pace in seconds/km, derived from a reference performance via
 * Riegel projection to a 10k-equivalent effort.
 */
export function computeThresholdPaceSecondsPerKm(performance: PerformanceReference): number {
  const equivalent10kSeconds = riegelEquivalentSeconds(
    performance.tempsSecondes,
    DISTANCE_METRES[performance.distance],
    DISTANCE_METRES["10k"]
  );
  return equivalent10kSeconds / 10;
}

export function computePaceZones(thresholdSecondsPerKm: number): Record<ZoneAllure, PaceRange> {
  const zones = {} as Record<ZoneAllure, PaceRange>;
  for (const zone of Object.keys(PACE_ZONE_COEFFICIENTS) as ZoneAllure[]) {
    const { min, max } = PACE_ZONE_COEFFICIENTS[zone];
    zones[zone] = {
      minSecondsPerKm: min === null ? null : Math.round(thresholdSecondsPerKm * min),
      maxSecondsPerKm: Math.round(thresholdSecondsPerKm * max),
    };
  }
  return zones;
}

export function computeHeartRateZones(fcMax: number): Record<ZoneAllure, HeartRateRange> {
  const zones = {} as Record<ZoneAllure, HeartRateRange>;
  for (const zone of Object.keys(FC_ZONE_COEFFICIENTS) as ZoneAllure[]) {
    const { min, max } = FC_ZONE_COEFFICIENTS[zone];
    zones[zone] = {
      minBpm: Math.round((fcMax * min) / 100),
      maxBpm: Math.round((fcMax * max) / 100),
    };
  }
  return zones;
}

/**
 * Resolves one athlete's real pace range for a given zone. Returns
 * `available: false` (never throws) when the athlete has no usable
 * reference performance, so callers can fall back to displaying the zone
 * name with a prompt to add one instead of breaking the page.
 */
export function getAthletePaceZone(
  zone: ZoneAllure,
  performances: PerformanceReference[]
): PaceZoneResult {
  const base = selectBasePerformance(performances);
  if (!base) return { available: false, zone };

  const threshold = computeThresholdPaceSecondsPerKm(base);
  const zones = computePaceZones(threshold);
  return { available: true, zone, range: zones[zone] };
}

export function formatPaceSecondsPerKm(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

/** Formats a race/rest duration as "h:mm:ss" (or "m:ss" under an hour). */
export function formatDurationHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
