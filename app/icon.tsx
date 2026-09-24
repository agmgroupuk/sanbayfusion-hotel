import { ImageResponse } from "next/og";
import { BrandMark, logoDataUri } from "@/lib/brand-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await logoDataUri();
  return new ImageResponse(<BrandMark size={size.width} src={logo} />, {
    ...size,
  });
}
