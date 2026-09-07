import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Placeholder icon for iOS "Add to Home Screen" — swap for a real brand
// icon later. Needed for Web Push reminders: iOS only grants Notification
// permission to an installed (home-screen) PWA.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b4f3f",
          color: "#ffffff",
          fontSize: 90,
          fontWeight: 700,
        }}
      >
        NN
      </div>
    ),
    { ...size }
  );
}
