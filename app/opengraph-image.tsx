import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — Michelin-Starred Dining`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card on the warm-noir palette. Uses the default font bundled
// with next/og — no asset loading, statically generated at build time.
export default function Image() {
  const noir = "#1a1712";
  const gold = "#dcb56a";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${noir} 0%, #221d16 60%, #2b2319 100%)`,
          color: "#f4efeb",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: gold,
          }}
        >
          Michelin-Starred · Paris
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 150,
              fontWeight: 600,
              color: "#f5efe9",
              lineHeight: 1,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 34,
              color: "#cdc4b8",
              maxWidth: 900,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#a89f92",
          }}
        >
          <div style={{ display: "flex" }}>{site.address.line2}</div>
          <div style={{ display: "flex", color: gold }}>Reserve a Table</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
