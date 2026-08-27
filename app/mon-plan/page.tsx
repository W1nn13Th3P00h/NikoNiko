import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

// Placeholder — remplacé par l'accueil athlète (séance du jour, countdown
// compétition, résumé de semaine) à l'étape 7.
export default async function MonPlanHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <p className="text-sm">
        Connecté en tant qu&apos;athlète : <strong>{user?.email}</strong>
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
