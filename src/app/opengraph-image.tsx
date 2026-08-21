import { ImageResponse } from "next/og";

export const alt = "Cherry Converter — free image tools, processed in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#221F1F",
          color: "#F5F5F1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, letterSpacing: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#F2013F",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            C
          </div>
          CHERRY CONVERTER
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 0.95,
              letterSpacing: -3,
              fontWeight: 500,
            }}
          >
            <span>Free image tools.</span>
            <span>100% Privacy.</span>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#B81D24" }}>
            Compress · 50KB · Passport · Aadhaar · HEIC · PDF
          </div>
        </div>
      </div>
    ),
    size,
  );
}
