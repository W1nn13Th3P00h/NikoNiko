import { ImageResponse } from "next/og";

export const contentType = "image/png";

// Placeholder PWA icon (referenced by app/manifest.ts) — swap for a real
// brand icon later, this only exists so the manifest is valid/installable.
export async function GET() {
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
          fontSize: 256,
          fontWeight: 700,
        }}
      >
        NN
      </div>
    ),
    { width: 512, height: 512 }
  );
}
