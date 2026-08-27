import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="text-muted-foreground text-sm">
          Reçois un lien de connexion par email, pas de mot de passe.
        </p>
      </div>

      {sent ? (
        <p className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm">
          Lien envoyé. Vérifie ta boîte mail (et les spams).
        </p>
      ) : (
        <form action={signInWithMagicLink} className="flex flex-col gap-3">
          <Input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="ton.email@exemple.com"
          />
          <Button type="submit">Recevoir le lien</Button>
        </form>
      )}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </main>
  );
}
