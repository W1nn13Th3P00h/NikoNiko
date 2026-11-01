import { describe, expect, it } from "vitest";
import { blankBloc, normalizeContainers } from "./draft";

describe("normalizeContainers", () => {
  it("strips a parent's own duration/target but keeps repetitions, role and commentaire", () => {
    const parent = { ...blankBloc(null), repetitions: 6, commentaire: "3 séries" };
    const child = blankBloc(parent.clientId);
    const [normalizedParent, normalizedChild] = normalizeContainers([parent, child]);

    expect(normalizedParent).toMatchObject({
      repetitions: 6,
      role: parent.role,
      commentaire: "3 séries",
      modeDuree: "libre",
      dureeSecondes: null,
      distanceMetres: null,
      cibleType: "libre",
      cibleZone: null,
    });
    expect(normalizedChild).toEqual(child);
  });

  it("leaves a bloc without sub-blocs untouched", () => {
    const bloc = blankBloc(null);
    expect(normalizeContainers([bloc])).toEqual([bloc]);
  });
});
