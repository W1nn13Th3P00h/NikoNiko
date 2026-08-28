import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithIdentifiant, signInWithMagicLink } from "./actions";

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
      </div>

      {sent ? (
        <p className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm">
          Lien envoyé. Vérifie ta boîte mail (et les spams).
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">Lien de connexion par email</p>
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
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">Identifiant et code</p>
            <form action={signInWithIdentifiant} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="identifiant">Identifiant</Label>
                <Input id="identifiant" name="identifiant" required autoComplete="username" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" type="password" required autoComplete="current-password" />
              </div>
              <Button type="submit" variant="outline">
                Se connecter
              </Button>
            </form>
          </div>
        </>
      )}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </main>
  );
}
