import { ImageResponse } from "next/og";
import { BrandMark, frauncesFontData } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await frauncesFontData();
  return new ImageResponse(<BrandMark size={size.width} />, {
    ...size,
    fonts: [{ name: "Fraunces", data: fontData, weight: 600, style: "normal" }],
  });
}
