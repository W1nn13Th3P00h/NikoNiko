import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export default function MonPlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Mon plan</span>
        <form action={signOut}>
          <button type="submit" className="text-muted-foreground text-sm">
            Déconnexion
          </button>
        </form>
      </header>

      <main className="flex-1 px-4 py-4 pb-20">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background">
        <Link
          href="/mon-plan"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm"
        >
          Accueil
        </Link>
        <Link
          href="/mon-plan/calendrier"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm"
        >
          Calendrier
        </Link>
      </nav>
    </div>
  );
}
