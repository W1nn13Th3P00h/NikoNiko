// Computes a séance's total volume (distance, duration) from its blocs.
// A bloc stored in time is converted to an estimated distance via the
// athlete's target pace, and vice versa, so the two totals stay consistent
// regardless of which unit each bloc happens to be recorded in.

import {
  type PerformanceReference,
  type ZoneAllure,
  getAthletePaceZone,
} from "./paces";

export type ModeDuree = "distance" | "temps" | "libre";
export type CibleType = "zone_allure" | "allure_absolue" | "zone_fc" | "rpe" | "libre";

export interface BlocSeanceInput {
  id: string;
  parentBlocId: string | null;
  repetitions: number;
  modeDuree: ModeDuree;
  distanceMetres: number | null;
  dureeSecondes: number | null;
  cibleType: CibleType;
  cibleZone: ZoneAllure | null;
  cibleAllureSecondesParKm: number | null;
}

export interface VolumeSeance {
  distanceMetres: number;
  distanceKm: number;
  dureeSecondes: number;
  dureeMinutes: number;
  /**
   * False when at least one bloc targets a pace/HR zone but the athlete
   * has no reference performance to derive it from — the totals below
   * then undercount that bloc's contribution. Blocs with no pace target
   * at all (RPE, libre) never affect this flag: they're not a data gap.
   */
  estimationComplete: boolean;
}

interface SubtreeVolume {
  distanceMetres: number;
  dureeSecondes: number;
}

function resolvePaceSecondsPerKm(
  bloc: BlocSeanceInput,
  performances: PerformanceReference[]
): { paceSecondsPerKm: number | null; missingReference: boolean } {
  if (bloc.cibleType === "allure_absolue" && bloc.cibleAllureSecondesParKm !== null) {
    return { paceSecondsPerKm: bloc.cibleAllureSecondesParKm, missingReference: false };
  }

  if ((bloc.cibleType === "zone_allure" || bloc.cibleType === "zone_fc") && bloc.cibleZone) {
    const result = getAthletePaceZone(bloc.cibleZone, performances);
    if (!result.available) {
      return { paceSecondsPerKm: null, missingReference: true };
    }
    const { minSecondsPerKm, maxSecondsPerKm } = result.range;
    const pace = minSecondsPerKm === null ? maxSecondsPerKm : (minSecondsPerKm + maxSecondsPerKm) / 2;
    return { paceSecondsPerKm: pace, missingReference: false };
  }

  // cible_type 'rpe' or 'libre': no pace target by design, not a data gap.
  return { paceSecondsPerKm: null, missingReference: false };
}

export function computeBlocOwnVolume(
  bloc: BlocSeanceInput,
  performances: PerformanceReference[]
): SubtreeVolume & { missingReference: boolean } {
  const { paceSecondsPerKm, missingReference } = resolvePaceSecondsPerKm(bloc, performances);

  if (bloc.modeDuree === "distance" && bloc.distanceMetres !== null) {
    return {
      distanceMetres: bloc.distanceMetres,
      dureeSecondes: paceSecondsPerKm !== null ? (bloc.distanceMetres / 1000) * paceSecondsPerKm : 0,
      missingReference,
    };
  }

  if (bloc.modeDuree === "temps" && bloc.dureeSecondes !== null) {
    return {
      distanceMetres: paceSecondsPerKm !== null ? (bloc.dureeSecondes / paceSecondsPerKm) * 1000 : 0,
      dureeSecondes: bloc.dureeSecondes,
      missingReference,
    };
  }

  // 'libre': count a duration if one was still recorded, no distance.
  return {
    distanceMetres: 0,
    dureeSecondes: bloc.dureeSecondes ?? 0,
    missingReference,
  };
}

export function computeSeanceVolume(
  blocs: BlocSeanceInput[],
  performances: PerformanceReference[]
): VolumeSeance {
  const childrenByParent = new Map<string, BlocSeanceInput[]>();
  for (const bloc of blocs) {
    if (bloc.parentBlocId === null) continue;
    const siblings = childrenByParent.get(bloc.parentBlocId) ?? [];
    siblings.push(bloc);
    childrenByParent.set(bloc.parentBlocId, siblings);
  }

  let missingReference = false;

  function subtreeVolume(bloc: BlocSeanceInput): SubtreeVolume {
    const own = computeBlocOwnVolume(bloc, performances);
    if (own.missingReference) missingReference = true;

    const children = childrenByParent.get(bloc.id) ?? [];
    const childrenTotal = children.reduce<SubtreeVolume>(
      (acc, child) => {
        const v = subtreeVolume(child);
        return {
          distanceMetres: acc.distanceMetres + v.distanceMetres,
          dureeSecondes: acc.dureeSecondes + v.dureeSecondes,
        };
      },
      { distanceMetres: 0, dureeSecondes: 0 }
    );

    return {
      distanceMetres: bloc.repetitions * (own.distanceMetres + childrenTotal.distanceMetres),
      dureeSecondes: bloc.repetitions * (own.dureeSecondes + childrenTotal.dureeSecondes),
    };
  }

  const topLevelBlocs = blocs.filter((b) => b.parentBlocId === null);
  const total = topLevelBlocs.reduce<SubtreeVolume>(
    (acc, bloc) => {
      const v = subtreeVolume(bloc);
      return {
        distanceMetres: acc.distanceMetres + v.distanceMetres,
        dureeSecondes: acc.dureeSecondes + v.dureeSecondes,
      };
    },
    { distanceMetres: 0, dureeSecondes: 0 }
  );

  return {
    distanceMetres: Math.round(total.distanceMetres),
    distanceKm: Math.round((total.distanceMetres / 1000) * 100) / 100,
    dureeSecondes: Math.round(total.dureeSecondes),
    dureeMinutes: Math.round(total.dureeSecondes / 60),
    estimationComplete: !missingReference,
  };
}
