import type { Metadata } from "next";
import { DemoFlow } from "./DemoFlow";

export const metadata: Metadata = {
  title: "Demo",
  description: "Prueba Pipa Clara con datos de ejemplo: juntar, pedir, medir y mandar el resumen. Sin cuenta.",
};

// Public, no login, no database (F4). Everything happens in the browser with fixed example data.
export default function DemoPage() {
  return <DemoFlow />;
}
