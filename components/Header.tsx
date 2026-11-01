import Link from "next/link";
import { Logo } from "./Logo";

// Shared header: brand on the left, "Entrar" on the right, page links below on phones
export function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-2xl font-bold text-teal">Pipa Clara</span>
        </Link>

        <Link
          href="/app"
          className="rounded-xl bg-teal px-5 py-2.5 text-lg font-semibold text-white hover:bg-teal-dark sm:order-last"
        >
          Entrar
        </Link>

        <nav className="flex w-full gap-6 text-base font-medium text-teal sm:w-auto sm:flex-1 sm:justify-end">
          <Link href="/product" className="py-1 underline-offset-4 hover:underline">
            Cómo funciona
          </Link>
          <Link href="/about" className="py-1 underline-offset-4 hover:underline">
            Por qué
          </Link>
        </nav>
      </div>
    </header>
  );
}
