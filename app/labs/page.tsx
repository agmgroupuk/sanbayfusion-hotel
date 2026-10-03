import type { Metadata } from "next";
import { LabsLanding } from "./labs-landing";

export const metadata: Metadata = {
  title: "Labs",
  description: "Explore provider-backed text experiments from Sanbay Fusion.",
};

export default function LabsPage() {
  return <LabsLanding />;
}
