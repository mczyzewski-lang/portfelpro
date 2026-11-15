import Link from "next/link";
import { redirect } from "next/navigation";
import { PhoneSignup } from "@/components/phone-signup";
import { Wordmark } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Logowanie numerem telefonu" };

export default async function PhonePage() {
  const cu = await getCurrentUser();
  if (cu) redirect(cu.user.role === "admin" ? "/admin" : "/app");
  return (
    <main id="tresc" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 pt-6">
      <Wordmark />
      <h1 className="mt-8 text-[28px] font-extrabold leading-tight text-leather-dark">Wejdź numerem telefonu</h1>
      <p className="mt-2 text-[15px] text-muted">Podaj numer — wyślemy kod. Nowy numer założy konto, znany zaloguje.</p>
      <div className="mt-6"><PhoneSignup cta="Wyślij kod" /></div>
      <p className="mt-4 text-center text-sm text-muted">Wolisz e-mail i hasło? <Link href="/logowanie" className="font-semibold text-leather underline">Zaloguj się e-mailem</Link></p>
    </main>
  );
}
