// The identifiant + code login is backed by a regular Supabase Auth user
// with a synthetic email — Auth always requires one, and this lets us
// reuse signInWithPassword instead of building a parallel auth system.
// The domain is never resolved or emailed; it only needs to be unique per
// identifiant and never collide with a real address.

export const INTERNAL_EMAIL_DOMAIN = "athlete.appcoaching.internal";

const IDENTIFIANT_PATTERN = /^[a-z0-9_-]{3,20}$/;

export function isValidIdentifiant(value: string): boolean {
  return IDENTIFIANT_PATTERN.test(value);
}

export function identifiantToInternalEmail(identifiant: string): string {
  return `${identifiant}@${INTERNAL_EMAIL_DOMAIN}`;
}
