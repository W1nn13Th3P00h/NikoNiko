import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// No UI: routes the freshly authenticated user to the right space based on
// profile.is_admin, so the magic link email doesn't need to know in advance
// whether the requester is the coach or an athlete.
export default async function PostLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  redirect(profile?.is_admin ? "/admin" : "/mon-plan");
}
