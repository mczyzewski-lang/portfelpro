import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { avatarSrc, initialsOf } from "@/lib/avatar";
import { PartnerNav } from "@/components/partner-nav";
import { Notice, Wordmark } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { partnerId } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Twój Portfel", robots: { index: false } };

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, partner } = await requirePartner();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-2.5">
          <Wordmark href="/app" size={30} />
          <PartnerNav variant="top" />
          <Link href="/app/konto" aria-label="Konto" className="press flex items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1 ring-1 ring-line">
            <span className="tabular text-xs font-bold text-leather-dark" data-testid="partner-id">{partnerId(partner.number)}</span>
            <Avatar src={avatarSrc(partner)} initials={initialsOf(user)} size={28} className="ring-1" />
          </Link>
        </div>
      </header>
      <main id="tresc" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-32 pt-4 lg:pb-12">
        {partner.status === "pending" && (
          <Notice className="mb-5">Twoje konto czeka na zatwierdzenie. Możesz już przeglądać usługi — linki polecające aktywujemy zaraz po weryfikacji.</Notice>
        )}
        {partner.status === "suspended" && (
          <Notice tone="danger" className="mb-5">Twoje konto jest zawieszone. Linki polecające nie przypisują nowych klientów. Skontaktuj się z nami, aby wyjaśnić sytuację.</Notice>
        )}
        {children}
      </main>
      <PartnerNav variant="bottom" />
    </>
  );
}
