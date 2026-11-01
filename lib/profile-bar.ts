// Flattens a séance's blocs into a linear sequence of timed segments for
// the "profile bar" visualization (see the design mockup's séance detail /
// editor screens): a repeated group expands into N copies of its children,
// each colored by its target zone (or RPE).

import { computeBlocOwnVolume, type BlocSeanceInput } from "./volume";
import type { PerformanceReference, ZoneManualOverrides } from "./paces";
import { blocColor, type ColorableBloc } from "./zone-colors";

export interface ProfileSegment {
  weightSeconds: number;
  color: string;
}

type ProfileBloc = BlocSeanceInput & ColorableBloc;

export function computeProfileSegments(
  blocs: ProfileBloc[],
  performances: PerformanceReference[],
  overrides: ZoneManualOverrides = {}
): ProfileSegment[] {
  const childrenByParent = new Map<string, ProfileBloc[]>();
  for (const b of blocs) {
    if (b.parentBlocId === null) continue;
    const list = childrenByParent.get(b.parentBlocId) ?? [];
    list.push(b);
    childrenByParent.set(b.parentBlocId, list);
  }

  const segments: ProfileSegment[] = [];

  function visit(bloc: ProfileBloc) {
    const children = childrenByParent.get(bloc.id) ?? [];
    for (let i = 0; i < bloc.repetitions; i++) {
      if (children.length > 0) {
        for (const child of children) visit(child);
      } else {
        const own = computeBlocOwnVolume(bloc, performances, overrides);
        // A zero-duration segment (e.g. missing reference) would otherwise
        // collapse to an invisible sliver — keep it visible with a floor.
        segments.push({ weightSeconds: own.dureeSecondes || 1, color: blocColor(bloc) });
      }
    }
  }

  const topLevel = blocs.filter((b) => b.parentBlocId === null);
  for (const bloc of topLevel) visit(bloc);

  return segments;
}
