import type { Metadata } from "next";
import { SqlIndex } from "./SqlIndex";

export const metadata: Metadata = {
  title: "SQL",
  description:
    "SQL lessons that run entirely in your browser. Three exercises each, nothing locked.",
};

export default function SqlPage() {
  return <SqlIndex />;
}
