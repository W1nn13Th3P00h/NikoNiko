// Flattens a séance's blocs into a linear sequence of timed segments for
// the "profile bar" visualization (see the design mockup's séance detail /
// editor screens): a repeated group expands into N copies of its children,
// each colored by its target zone.

import { computeBlocOwnVolume, type BlocSeanceInput } from "./volume";
import type { PerformanceReference, ZoneManualOverrides } from "./paces";
import { ZONE_COLORS } from "./zone-colors";

export interface ProfileSegment {
  weightSeconds: number;
  color: string;
}

export function computeProfileSegments(
  blocs: BlocSeanceInput[],
  performances: PerformanceReference[],
  overrides: ZoneManualOverrides = {}
): ProfileSegment[] {
  const childrenByParent = new Map<string, BlocSeanceInput[]>();
  for (const b of blocs) {
    if (b.parentBlocId === null) continue;
    const list = childrenByParent.get(b.parentBlocId) ?? [];
    list.push(b);
    childrenByParent.set(b.parentBlocId, list);
  }

  const segments: ProfileSegment[] = [];

  function colorFor(bloc: BlocSeanceInput): string {
    return bloc.cibleZone ? ZONE_COLORS[bloc.cibleZone] : "var(--muted)";
  }

  function visit(bloc: BlocSeanceInput) {
    const children = childrenByParent.get(bloc.id) ?? [];
    for (let i = 0; i < bloc.repetitions; i++) {
      if (children.length > 0) {
        for (const child of children) visit(child);
      } else {
        const own = computeBlocOwnVolume(bloc, performances, overrides);
        // A zero-duration segment (e.g. missing reference) would otherwise
        // collapse to an invisible sliver — keep it visible with a floor.
        segments.push({ weightSeconds: own.dureeSecondes || 1, color: colorFor(bloc) });
      }
    }
  }

  const topLevel = blocs.filter((b) => b.parentBlocId === null);
  for (const bloc of topLevel) visit(bloc);

  return segments;
}
