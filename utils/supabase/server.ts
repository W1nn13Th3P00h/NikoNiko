import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component: safe to ignore, middleware
          // refreshes the session on every request instead.
        }
      },
    },
  });
}

// Server Components must NOT call supabase.auth.getUser() themselves: that
// creates a client whose cookie writes are a no-op here (see the catch
// above), so if it decides the token needs refreshing, the new refresh
// token never reaches the browser — silently invalidating the one it still
// holds and breaking the very next request. proxy.ts (middleware) is the
// only place allowed to refresh; it resolves the user once per request and
// forwards the id via this header for everything downstream to read.
export async function getCurrentUserId(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("x-user-id");
}
