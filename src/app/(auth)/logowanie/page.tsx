import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
      <div className="mt-6"><LoginForm next={next ?? ""} /></div>
    </>
  );
}
