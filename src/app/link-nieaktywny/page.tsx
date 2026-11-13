import { LinkButton, Logo } from "@/components/ui";

export const metadata = { title: "Link nieaktywny", robots: { index: false } };

export default function InactiveLink() {
  return (
    <main id="tresc" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Logo size={64} />
      <h1 className="mt-5 text-2xl font-extrabold text-leather-dark">Ten link jest nieaktywny</h1>
      <p className="mt-2 text-[15px] text-muted">Adres mógł zostać błędnie skopiowany albo materiał nie jest już dostępny. Poproś osobę, która go przesłała, o aktualny link.</p>
      <LinkButton href="/" variant="secondary" className="mt-6">Przejdź do Portfel.pro</LinkButton>
    </main>
  );
}
