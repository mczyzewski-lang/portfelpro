import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./form";

export const metadata = { title: "Załóż bezpłatny Portfel" };

export default async function RegisterPage() {
  const cu = await getCurrentUser();
  if (cu) redirect(cu.user.role === "admin" ? "/admin" : "/app");
  return (
    <>
      <h1 className="text-[28px] font-extrabold leading-tight text-leather-dark">Załóż bezpłatny Portfel</h1>
      <p className="mt-2 text-[15px] text-muted">Zajmie to około minuty. Od razu otrzymasz swój numer partnera.</p>
      <div className="mt-6"><RegisterForm /></div>
    </>
  );
}
