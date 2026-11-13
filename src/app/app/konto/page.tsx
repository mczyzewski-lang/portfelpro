import { changePasswordAction, setProfessionAction } from "@/app/actions/partner";
import { logoutAction } from "@/app/actions/auth";
import { ActionForm, CopyButton, SubmitButton } from "@/components/client";
import { PartnerStatusBadge } from "@/components/status";
import { Card, Field, btn, inputCls } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { activityLabel, fmtDate, partnerId } from "@/lib/labels";
import { getProfessions } from "@/lib/queries";

export const metadata = { title: "Konto" };

export default async function AccountPage() {
  const { user, partner } = await requirePartner();
  const professions = await getProfessions();
  const pid = partnerId(partner.number);
  return (
    <div className="space-y-5">
      <h1 className="text-[26px] font-extrabold leading-tight text-leather-dark">Konto</h1>

      <div className="wallet rounded-[24px] p-5">
        <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Partner ID</p>
        <p className="tabular relative z-10 mt-1 text-3xl font-extrabold tracking-wide">{pid}</p>
        <p className="relative z-10 mt-3 text-sm text-white/80">{user.firstName} {user.lastName}{partner.companyName && ` · ${partner.companyName}`}</p>
        <p className="relative z-10 mt-0.5 text-xs text-white/60">Jeden identyfikator dla wszystkich marek i usług.</p>
      </div>
      <CopyButton small variant="secondary" text={pid} label="Kopiuj Partner ID" />

      <Card className="divide-y divide-line">
        {[["Status konta", <PartnerStatusBadge key="s" status={partner.status} />], ["E-mail", user.email], ["Forma działania", activityLabel[partner.activityType]],
          ...(partner.nip ? [["NIP", partner.nip]] : []), ["W programie od", fmtDate(partner.createdAt)], ["Regulamin zaakceptowano", `${fmtDate(partner.termsAcceptedAt)} (wersja ${partner.termsVersion})`]].map(([l, v]) => (
          <div key={l as string} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-muted">{l}</span><span className="text-right font-semibold">{v}</span></div>
        ))}
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-leather-dark">Czym się zajmujesz?</h2>
        <p className="mt-1 text-sm text-muted">Na tej podstawie podpowiadamy usługi w sekcji „Polecane dla Ciebie”.</p>
        <form action={setProfessionAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="next" value="konto" />
          <select name="profession" defaultValue={partner.professionSlug ?? ""} aria-label="Branża" className={inputCls}>
            <option value="">Inna / nie chcę podawać</option>
            {professions.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
          <button className={btn("secondary", "shrink-0")}>Zapisz</button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-extrabold text-leather-dark">Zmiana hasła</h2>
        <ActionForm action={changePasswordAction} resetOnOk className="mt-3 space-y-3">
          <Field label="Obecne hasło"><input name="current" type="password" autoComplete="current-password" required className={inputCls} /></Field>
          <Field label="Nowe hasło" hint="Co najmniej 10 znaków"><input name="next" type="password" autoComplete="new-password" required minLength={10} className={inputCls} /></Field>
          <SubmitButton variant="secondary">Zmień hasło</SubmitButton>
        </ActionForm>
      </Card>

      <form action={logoutAction}><button className={btn("ghost", "w-full")}>Wyloguj się</button></form>
    </div>
  );
}
