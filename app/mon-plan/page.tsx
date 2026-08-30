import { redirect } from "next/navigation";

// Le calendrier est la vue par défaut de l'athlète (voir CLAUDE.md, issue #15).
// Le contenu qui vivait ici (résumé semaine, prochaine séance, zones...) a
// déménagé vers /mon-plan/dashboard.
export default function MonPlanRootPage() {
  redirect("/mon-plan/calendrier");
}
