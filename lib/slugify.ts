// Derives a candidate athlete.identifiant from a first name — the coach can
// still edit it before saving. Matches the ^[a-z0-9_-]{3,20}$ DB constraint
// as closely as possible without guaranteeing it (a very short name still
// needs the coach to adjust).
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 20);
}
