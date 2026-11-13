import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { changePasswordAction } from "@/app/actions/partner";
import { ActionForm, SubmitButton } from "@/components/client";
import { Card, Field, inputCls } from "@/components/ui";
import { requirePartner } from "@/lib/auth";

export const metadata = { title: "Zmiana hasła" };

export default async function PasswordPage() {
  await requirePartner();
  return (
    <div className="mx-auto max-w-md">
      <Link href="/app/konto" className="press -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Konto</Link>
      <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-leather-dark">Zmiana hasła</h1>
      <Card className="mt-4 p-5">
        <ActionForm action={changePasswordAction} resetOnOk className="space-y-3">
          <Field label="Obecne hasło"><input name="current" type="password" autoComplete="current-password" required className={inputCls} /></Field>
          <Field label="Nowe hasło" hint="Co najmniej 10 znaków"><input name="next" type="password" autoComplete="new-password" required minLength={10} className={inputCls} /></Field>
          <SubmitButton className="press w-full">Zmień hasło</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
