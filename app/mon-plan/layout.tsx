import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getCurrentAthlete } from "./_lib/current-athlete";

function initials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

export default async function MonPlanLayout({ children }: { children: React.ReactNode }) {
  const athlete = await getCurrentAthlete();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 pt-5">
        <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          NikoNiko
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="flex size-8 items-center justify-center rounded-[4px] bg-primary text-xs font-bold text-primary-foreground"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            {athlete ? initials(athlete.prenom, athlete.nom) : "?"}
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pt-7 pb-[calc(96px+env(safe-area-inset-bottom))]">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex h-[calc(72px+env(safe-area-inset-bottom))] border-t bg-card pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Link
          href="/mon-plan"
          className="flex flex-1 flex-col items-center justify-center gap-[5px] text-muted-foreground"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
          <span className="text-[11px] font-medium">Aujourd&apos;hui</span>
        </Link>
        <Link
          href="/mon-plan/calendrier"
          className="flex flex-1 flex-col items-center justify-center gap-[5px] text-muted-foreground"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="1" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span className="text-[11px] font-medium">Ma semaine</span>
        </Link>
      </nav>
    </div>
  );
}
