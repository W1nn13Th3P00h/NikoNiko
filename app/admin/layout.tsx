import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/admin" className="font-semibold">
          App Coaching — Coach
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Se déconnecter
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
