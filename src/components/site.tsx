import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white/50 px-5 py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Portfel.pro — Portfel Profesjonalisty</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Stopka">
          <Link href="/regulamin" className="hover:text-ink">Regulamin</Link>
          <Link href="/prywatnosc" className="hover:text-ink">Prywatność i cookies</Link>
          <Link href="/logowanie" className="hover:text-ink">Logowanie</Link>
        </nav>
      </div>
    </footer>
  );
}
