import type { Metadata } from "next";
import { Overview } from "./Overview";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Where you are up to, and the next thing to do. Ten practical Excel formulas, taught through short interactive exercises.",
};

export default function HomePage() {
  return <Overview />;
}
