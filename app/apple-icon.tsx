import { ImageResponse } from "next/og";
import { BrandMark, logoDataUri } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logo = await logoDataUri();
  return new ImageResponse(<BrandMark size={size.width} src={logo} />, {
    ...size,
  });
}
