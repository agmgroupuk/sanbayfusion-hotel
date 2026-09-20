import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const brandNoir = "#1a1712";
export const brandGold = "#dcb56a";

let fontDataPromise: Promise<ArrayBuffer> | null = null;

/** Fraunces (the site's display serif) as raw bytes, for use inside ImageResponse. */
export function frauncesFontData() {
  if (!fontDataPromise) {
    fontDataPromise = readFile(
      join(process.cwd(), "assets/fonts/Fraunces-Icon.ttf"),
    ).then(
      (buffer) =>
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
    );
  }
  return fontDataPromise;
}

/** The site's monogram: a single Fraunces "M" over a thin rule, gold on noir. */
export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: brandNoir,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces",
          fontSize: size * 0.72,
          fontWeight: 600,
          color: brandGold,
          lineHeight: 1,
          marginTop: size * 0.05,
        }}
      >
        M
      </div>
      <div
        style={{
          display: "flex",
          width: size * 0.34,
          height: Math.max(1, size * 0.045),
          background: brandGold,
          marginTop: size * 0.07,
        }}
      />
    </div>
  );
}
