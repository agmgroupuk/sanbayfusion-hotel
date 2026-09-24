import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const brandNoir = "#1a1712";
export const brandGold = "#dcb56a";

let fontDataPromise: Promise<ArrayBuffer> | null = null;
let logoDataPromise: Promise<string> | null = null;

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

export function logoDataUri() {
  if (!logoDataPromise) {
    logoDataPromise = readFile(join(process.cwd(), "public/brand/sanbayfusion-logo.png"), "base64").then((data) => `data:image/png;base64,${data}`);
  }
  return logoDataPromise;
}

/** The site's monogram: a single Fraunces "M" over a thin rule, gold on noir. */
export function BrandMark({ size, src }: { size: number; src?: string }) {
  if (src) {
    return <img src={src} alt="Sanbay Fusion" style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
  }

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
