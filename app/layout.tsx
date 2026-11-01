import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Pipa Clara",
    default: "Pipa Clara",
  },
  description:
    "Mide cuántos litros entraron de verdad a tu cisterna y reparte el costo de la pipa con pruebas, no con sospechas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted">
          Pipa Clara no vende pipas ni califica piperos. Solo mide cantidad, no calidad del agua.
        </footer>
      </body>
    </html>
  );
}
