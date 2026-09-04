import type { Metadata } from "next";
import { FormulasIndex } from "./FormulasIndex";

export const metadata: Metadata = {
  title: "Formulas",
  description:
    "Ten Excel formulas, three exercises each. Nothing is locked and you keep what you finish.",
};

export default function FormulasPage() {
  return <FormulasIndex />;
}
