import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-xs font-bold tracking-[0.14em] uppercase text-muted-foreground"
          >
            NikoNiko
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="hover:underline">
              Athlètes
            </Link>
            <Link href="/admin/bibliotheque" className="hover:underline">
              Bibliothèque
            </Link>
            <Link href="/admin/retours" className="hover:underline">
              Retours
            </Link>
          </nav>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Se déconnecter
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
