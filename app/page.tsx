import type { Metadata } from "next";
import { Overview } from "./Overview";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Two tracks, Excel and SQL, each taught through short interactive exercises. Pick one up where you left it.",
};

export default function HomePage() {
  return <Overview />;
}
