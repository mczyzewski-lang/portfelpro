import { LinkButton, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="tresc" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Logo size={64} />
      <h1 className="mt-5 text-2xl font-extrabold text-leather-dark">Nie znaleźliśmy tej strony</h1>
      <p className="mt-2 text-[15px] text-muted">Sprawdź adres albo wróć na stronę główną.</p>
      <LinkButton href="/" variant="secondary" className="mt-6">Strona główna</LinkButton>
    </main>
  );
}
