import { Stitch } from "@/components/stitch";
import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { removeAvatarAction, saveAvatarAction, setProfessionAction } from "@/app/actions/partner";
import { AvatarEditor } from "@/components/avatar";
import { CopyButton } from "@/components/client";
import { ProfessionSelect } from "@/components/profession-select";
import { PublicWalletCard } from "@/components/public-wallet-card";
import { PartnerStatusBadge } from "@/components/status";
import { Card } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { avatarSrc, initialsOf } from "@/lib/avatar";
import { env } from "@/lib/env";
import { activityLabel, fmtDate, partnerId } from "@/lib/labels";
import { getProfessions } from "@/lib/queries";

export const metadata = { title: "Konto" };

export default async function AccountPage() {
  const { user, partner } = await requirePartner();
  const professions = await getProfessions();
  const pid = partnerId(partner.number);
  const rows: [string, React.ReactNode][] = [
    ["Status konta", <PartnerStatusBadge key="s" status={partner.status} />], ["E-mail", user.email], ["Forma działania", activityLabel[partner.activityType]],
    ...(partner.nip ? [["NIP", partner.nip] as [string, string]] : []), ["W programie od", fmtDate(partner.createdAt)],
    ["Regulamin zaakceptowano", `${fmtDate(partner.termsAcceptedAt)} (wersja ${partner.termsVersion})`],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-[24px] font-extrabold leading-tight text-leather-dark">Konto</h1>

      <div className="wallet rounded-[28px] p-5">
<Stitch radius={19} />
        <div className="relative z-10"><AvatarEditor src={avatarSrc(partner)} initials={initialsOf(user)} onSave={saveAvatarAction} onRemove={removeAvatarAction} /></div>
        <p className="relative z-10 mt-4 text-lg font-extrabold leading-tight">{user.firstName} {user.lastName}</p>
        {partner.companyName && <p className="relative z-10 text-sm text-white/75">{partner.companyName}</p>}
        <div className="relative z-10 mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3.5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">IQ ID · inteligentny identyfikator</p>
            <p className="tabular text-2xl font-extrabold tracking-wide">{pid}</p>
          </div>
          <CopyButton small variant="gold" text={pid} label="Kopiuj" />
        </div>
      </div>

      <p className="rounded-2xl border border-gold/40 bg-white px-4 py-3 text-[13px] leading-snug text-ink/85" data-testid="iqid-note">
        <b className="text-leather-dark">IQ ID to Twój inteligentny identyfikator.</b> Jest w każdym linku, który wysyłasz. Gdy klient zostawi kontakt z linku z Twoim IQ ID, zostaje przypisany do Ciebie na stałe.
      </p>

      <Card className="p-5">
        <h2 className="font-extrabold text-leather-dark">Czym się zajmujesz?</h2>
        <p className="mt-1 text-sm text-muted">Na tej podstawie podpowiadamy usługi oznaczone „dla Ciebie”.</p>
        <form action={setProfessionAction} className="mt-3">
          <input type="hidden" name="next" value="konto" />
          <ProfessionSelect professions={professions} value={partner.professionSlug} autoSubmit />
        </form>
      </Card>

      <PublicWalletCard enabled={partner.publicEnabled} bio={partner.publicBio ?? ""} canEnable={partner.status === "active"}
        url={partner.publicSlug ? `${env.appUrl}/p/${partner.publicSlug}` : null} />

      <Card className="divide-y divide-line">
        {rows.map(([l, v]) => (
          <div key={l} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-muted">{l}</span><span className="text-right font-semibold">{v}</span></div>
        ))}
        <Link href="/app/konto/haslo" className="press flex min-h-12 items-center justify-between gap-4 px-4 py-3 text-sm" data-testid="change-password-link">
          <span className="text-muted">Hasło</span><span className="inline-flex items-center gap-1 font-bold text-leather">Zmień hasło<ChevronRight className="size-4" aria-hidden /></span>
        </Link>
        <form action={logoutAction}>
          <button className="press flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm" data-testid="logout">
            <span className="text-muted">Sesja</span><span className="inline-flex items-center gap-1.5 font-bold text-danger"><LogOut className="size-4" aria-hidden />Wyloguj się</span>
          </button>
        </form>
      </Card>

    </div>
  );
}
