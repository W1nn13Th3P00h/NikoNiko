import { redirect } from "next/navigation";

// No public landing page for this app: the proxy sends an authenticated
// user straight back to /apres-connexion, so redirecting here just to
// /login is enough to route everyone correctly.
export default function Home() {
  redirect("/login");
}
