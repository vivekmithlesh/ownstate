// OwnState — default Open Graph image (Brick 15), generated with next/og.

import { ImageResponse } from "next/og";

export const alt = "OwnState — Own Anything. Anywhere. On Earth.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "#eafff7",
          background:
            "radial-gradient(900px 500px at 20% 10%, #1D9E75 0%, transparent 55%), radial-gradient(800px 500px at 90% 95%, #0a2540 0%, transparent 60%), #05060a",
        }}
      >
        <div style={{ fontSize: 34, color: "#5DCAA5", letterSpacing: 8 }}>
          OWNSTATE
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "white",
            maxWidth: 900,
          }}
        >
          Own Anything. Anywhere. On Earth.
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#bfe9da", maxWidth: 820 }}>
          Buy, sell, rent &amp; fence any property on the planet.
        </div>
      </div>
    ),
    { ...size }
  );
}
