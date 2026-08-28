import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Connexion</h1>
      </div>

      <form action={signIn} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="identifiant">Identifiant</Label>
          <Input id="identifiant" name="identifiant" required autoComplete="username" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit">Se connecter</Button>
      </form>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </main>
  );
}
