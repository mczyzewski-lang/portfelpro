import { ArrowLeft, Award, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Certificate } from "@/components/certificate";
import { Quiz, TrainingVideos } from "@/components/training";
import { requirePartner } from "@/lib/auth";
import { fmtDate } from "@/lib/labels";
import { getServiceBySlug } from "@/lib/queries";
import { CERT_TITLE, getTraining, PASS_SCORE, trainingOf, watchedAll } from "@/lib/training";

export const metadata = { title: "Szkolenie i certyfikat" };

/** Szkolenie jednej usługi: filmy → test 10 pytań → certyfikat. */
export default async function TrainingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user, partner } = await requirePartner();
  const found = await getServiceBySlug((await params).slug);
  const training = found && found.service.status === "published" && found.company.published ? trainingOf(found.service) : null;
  if (!found || !training) notFound();
  const { service } = found;
  const row = await getTraining(partner.id, service.id);
  const ready = watchedAll(row?.watched ?? [], training.videos.length);
  return (
    <div className="mx-auto max-w-2xl space-y-5" data-testid="training-page">
      <Link href="/app/konto?tab=certyfikaty" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Certyfikaty</Link>
      <header>
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-deep"><Award className="size-4" aria-hidden />{CERT_TITLE}</p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-leather-dark first-letter:uppercase">{training.area}</h1>
        <p className="mt-1 text-sm text-muted">Usługa: <Link href={`/app/uslugi/${service.slug}`} className="font-semibold text-leather underline">{service.name}</Link> · ok. 15 minut</p>
        {training.demo && <p className="mt-2 rounded-xl bg-warn-bg px-3 py-2 text-xs font-medium text-warn">Materiał przykładowy (demo): filmy to plansze zastępcze, a pytania czekają na potwierdzenie przez ekspertów.</p>}
      </header>

      {row?.certifiedAt && row.certNumber ? (
        <section aria-label="Twój certyfikat">
          <Certificate name={`${user.firstName} ${user.lastName}`} area={row.certArea || training.area} number={row.certNumber} date={fmtDate(row.certifiedAt)} />
          <p className="mt-3 text-center text-sm text-muted">Wynik testu: {row.bestScore}/{training.questions}. Filmy poniżej możesz obejrzeć ponownie w każdej chwili.</p>
        </section>
      ) : (
        <p className="flex gap-2.5 rounded-2xl bg-white px-4 py-3 text-[14px] leading-snug text-ink/90 ring-1 ring-line"><Lightbulb className="mt-0.5 size-[18px] shrink-0 text-gold-deep" aria-hidden /><span>Obejrzyj filmy do końca, a potem odpowiedz na {training.questions} pytań. {PASS_SCORE} poprawnych odpowiedzi daje certyfikat. Im lepiej znasz niuanse, tym łatwiej wyłapiesz moment, by zaproponować usługę.</span></p>
      )}

      {training.videos.length > 0 && (
        <section aria-labelledby="filmy">
          <h2 id="filmy" className="mb-2.5 text-lg font-extrabold text-leather-dark">1. Filmy <span className="tabular text-sm font-bold text-muted" data-testid="training-progress">{(row?.watched ?? []).filter((i) => i < training.videos.length).length}/{training.videos.length}</span></h2>
          <TrainingVideos serviceId={service.id} videos={training.videos} watched={row?.watched ?? []} />
        </section>
      )}

      {!row?.certifiedAt && (
        <section id="test" aria-labelledby="test-h" className="scroll-mt-20">
          <h2 id="test-h" className="mb-2.5 text-lg font-extrabold text-leather-dark">2. Test — {training.questions} pytań</h2>
          {/* do przeglądarki idą tylko pytania i odpowiedzi do wyboru, bez wskazania poprawnej */}
          <Quiz serviceId={service.id} locked={!ready} passScore={Math.min(PASS_SCORE, training.questions)} questions={service.quiz.map((q) => ({ q: q.q, options: q.options }))} />
        </section>
      )}
    </div>
  );
}
