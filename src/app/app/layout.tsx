import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { avatarSrc, initialsOf } from "@/lib/avatar";
import { StarMark } from "@/components/star";
import { PartnerNav } from "@/components/partner-nav";
import { Notice, Wordmark } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { levelFor, newSince } from "@/lib/gamification";
import { partnerId } from "@/lib/labels";
import { getPartnerStats } from "@/lib/partner-data";
import { unreadForPartner } from "@/lib/messages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Twój Portfel", robots: { index: false } };

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, partner } = await requirePartner();
  const [unread, stats] = await Promise.all([unreadForPartner(partner.id), getPartnerStats(partner)]);
  const levelsNew = newSince(partner.gamificationSeen, stats).any;
  const level = levelFor(stats.clients).current;
  const starShown = !!partner.starterConfirmedAt || !partner.starterCode;
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-2.5">
          <Wordmark href="/app" size={30} />
          <PartnerNav variant="top" unread={unread} levelsNew={levelsNew} />
          <Link href="/app/konto" aria-label="Konto" className="press flex min-w-0 items-center gap-2.5 rounded-full bg-white py-1 pl-3.5 pr-2 ring-1 ring-line">
            <span className="min-w-0 text-right leading-tight">
              <span className="block max-w-[150px] truncate text-[13px] font-extrabold text-leather-dark" data-testid="partner-name">{user.firstName} {user.lastName}</span>
              <span className="tabular block text-[10px] font-semibold text-muted" data-testid="partner-id">{partnerId(partner.number)}</span>
            </span>
            <span data-avatar-target className="relative block rounded-full">
              <Avatar src={avatarSrc(partner)} initials={initialsOf(user)} size={32} className="ring-1" />
              {/* gwiazda poziomu przy awatarze — pojawia się po potwierdzeniu pakietu startowego */}
              {starShown && <span className="absolute -bottom-1.5 -right-1.5 grid size-[20px] place-items-center rounded-full bg-white shadow ring-1 ring-line" data-testid="avatar-star"><StarMark tier={level.tier} size={15} /></span>}
            </span>
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
      <PartnerNav variant="bottom" unread={unread} levelsNew={levelsNew} />
    </>
  );
}
