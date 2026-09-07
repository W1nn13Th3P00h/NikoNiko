import type { MetadataRoute } from "next";

// Needed for Web Push reminders to work on iOS Safari, which only grants
// Notification permission to a site installed via "Add to Home Screen".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NikoNiko",
    short_name: "NikoNiko",
    description: "Suivi de plans d'entraînement en course à pied",
    start_url: "/mon-plan",
    display: "standalone",
    background_color: "#f1f4f4",
    theme_color: "#0b4f3f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
