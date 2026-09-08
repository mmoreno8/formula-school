import type { Metadata } from "next";
import { FormulasIndex } from "./FormulasIndex";

export const metadata: Metadata = {
  title: "Excel",
  description:
    "Eighteen Excel lessons, three exercises each. Nothing is locked and you keep what you finish.",
};

export default function FormulasPage() {
  return <FormulasIndex />;
}
