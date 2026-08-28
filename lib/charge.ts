// Session-RPE training load (Foster) = durée réelle en minutes × RPE.
// Computable only once a retour with an RPE exists — see the mockup's
// retour form, which derives it live from the séance's planned duration.

export function computeCharge(dureeMinutes: number, rpe: number): number {
  return Math.round(dureeMinutes * rpe);
}
