import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Required: refreshes the auth token and writes it back to cookies.
  // Do not remove — without this call, sessions expire silently.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith("/login");
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mon-plan") ||
    pathname.startsWith("/apres-connexion");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/apres-connexion";
    return NextResponse.redirect(url);
  }

  // RLS is the real security boundary; this redirect only avoids showing a
  // coach-only page to an athlete before their queries come back empty.
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profile")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/mon-plan";
      return NextResponse.redirect(url);
    }
  }

  // Forward the resolved user id to Server Components via a request header
  // instead of letting them call auth.getUser() again themselves — see
  // utils/supabase/server.ts#getCurrentUserId for why a second, independent
  // call is unsafe here (it can silently invalidate the session). Always
  // set/clear it here (never pass the incoming request's header through
  // unchanged) so a client can't spoof it.
  const forwardedHeaders = new Headers(request.headers);
  if (user) {
    forwardedHeaders.set("x-user-id", user.id);
  } else {
    forwardedHeaders.delete("x-user-id");
  }
  const finalResponse = NextResponse.next({ request: { headers: forwardedHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => finalResponse.cookies.set(cookie));
  return finalResponse;
}
