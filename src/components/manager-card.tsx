import { Stitch } from "./stitch";
import { Mail, Phone, Play } from "lucide-react";
import type { Manager } from "@/lib/messages";
import { visibleVideo } from "@/lib/video";
import { ReelPlayer } from "./reel";

/** Nagłówek rozmowy: opiekun partnera ze zdjęciem, telefonem i szybkim kontaktem. Przypięty nad wiadomościami. */
export function ManagerCard({ manager }: { manager: Manager }) {
  const initials = `${manager.firstName[0] ?? ""}${manager.lastName[0] ?? ""}`.toUpperCase();
  const tel = manager.phone?.replace(/[^\d+]/g, "");
  const video = visibleVideo(manager.welcomeVideoUrl);
  const photo = manager.photoVersion
    // eslint-disable-next-line @next/next/no-img-element -- zdjęcie opiekuna serwowane z trasy wymagającej zalogowania
    ? <img src={`/api/manager-photo/${manager.id}?v=${manager.photoVersion}`} alt="" width={52} height={52} className="size-[52px] shrink-0 rounded-full object-cover ring-2 ring-gold-light" data-testid="manager-photo" />
    : <span aria-hidden className="gold-grad grid size-[52px] shrink-0 place-items-center rounded-full text-lg font-extrabold">{initials}</span>;
  return (
    <section className="sticky top-[60px] z-20 -mx-5 sm:mx-0" aria-label="Twój opiekun" data-testid="manager-card">
      <div className="wallet px-5 py-3.5 sm:rounded-[24px]">
<Stitch radius={0} inset={7} stitches={150} />
      <div className="relative z-10 flex items-center gap-3">
        {video ? (
          <ReelPlayer src={video} title={`${manager.firstName} — przywitanie`} testId="manager-video" className="relative shrink-0 rounded-full">
            {photo}
            <span className="gold-grad absolute -bottom-0.5 -right-0.5 grid size-[22px] place-items-center rounded-full ring-2 ring-[#2f1209]"><Play className="size-3 translate-x-px fill-current" aria-hidden /></span>
          </ReelPlayer>
        ) : photo}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-light">Twój opiekun</p>
          <p className="truncate text-[17px] font-extrabold leading-tight">{manager.firstName} {manager.lastName}</p>
          <p className="truncate text-xs text-white/75">
            {manager.jobTitle || "Opiekun partnerów"}
            {tel && <> · <a href={`tel:${tel}`} className="tabular font-bold text-white underline-offset-2 hover:underline">{manager.phone}</a></>}
          </p>
        </div>
        {tel && <a href={`tel:${tel}`} aria-label={`Zadzwoń: ${manager.phone}`} className="gold-grad press grid size-11 shrink-0 place-items-center rounded-full"><Phone className="size-5" aria-hidden /></a>}
        <a href={`mailto:${manager.email}`} aria-label={`Napisz e-mail: ${manager.email}`} className="press grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-white"><Mail className="size-5" aria-hidden /></a>
      </div>
      </div>
    </section>
  );
}
