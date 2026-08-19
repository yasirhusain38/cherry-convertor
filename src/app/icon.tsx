import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F2013F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          color: "#F5F5F1",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: -1,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
