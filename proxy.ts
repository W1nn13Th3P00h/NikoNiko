import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      // <Link> prefetches (e.g. the bottom nav in app/mon-plan/layout.tsx)
      // hit this same matcher. Running the auth redirect logic on them lets
      // a background prefetch to /login — queued just before login, still
      // in flight after it succeeds — resolve as authenticated and 307 to
      // /apres-connexion, which the router applies as a real navigation and
      // bounces the visible page (the infinite loop from issue #1).
      // Prefetch requests must never trigger a redirect, so skip proxy.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
