import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_ACCOUNT } from "@/lib/demo";
import { env } from "@/lib/env";
import { LoginForm } from "./form";

export const metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const cu = await getCurrentUser();
  if (cu) redirect(cu.user.role === "admin" ? "/admin" : "/app");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-[28px] font-extrabold leading-tight text-leather-dark">Zaloguj się</h1>
      <p className="mt-2 text-[15px] text-muted">Wróć do swojego Portfela Profesjonalisty.</p>
      <div className="mt-6"><LoginForm next={next ?? ""} demo={env.demoMode ? DEMO_ACCOUNT : null} /></div>
      <p className="mt-4 text-center text-sm text-muted">Konto założone numerem telefonu? <Link href="/telefon" className="font-semibold text-leather underline">Zaloguj się kodem SMS</Link></p>
    </>
  );
}
