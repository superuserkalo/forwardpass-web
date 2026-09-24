import { ImageResponse } from "next/og";

export const alt = "The Forward Pass: What's changing in AI engineering.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: "#101010",
          color: "#eeede7",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>
          THE FORWARD PASS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            What’s changing in AI engineering.
          </div>
          <div style={{ fontSize: 28, color: "#aaa9a3" }}>
            Daily intelligence for people who build with AI.
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid #444",
            paddingTop: 24,
            fontSize: 22,
            color: "#aaa9a3",
          }}
        >
          theforwardpass.net
        </div>
      </div>
    ),
    size,
  );
}
