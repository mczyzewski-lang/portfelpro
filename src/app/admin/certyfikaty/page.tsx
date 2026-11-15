import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Stat, Table } from "@/components/admin";
import { db } from "@/db";
import { partnerTraining, partners, services, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fmtDate, partnerId } from "@/lib/labels";

export const metadata = { title: "Szkolenia i certyfikaty" };

/** Zaangażowanie partnerów: kto ogląda filmy, podchodzi do testów i ma certyfikaty. */
export default async function AdminCertificates() {
  await requireAdmin();
  const rows = await db.select({ t: partnerTraining, number: partners.number, pid: partners.id, firstName: users.firstName, lastName: users.lastName, s: { name: services.name, id: services.id, videos: services.trainingVideos, quiz: services.quiz, area: services.certArea } })
    .from(partnerTraining).innerJoin(partners, eq(partners.id, partnerTraining.partnerId)).innerJoin(users, eq(users.id, partners.userId)).innerJoin(services, eq(services.id, partnerTraining.serviceId))
    .orderBy(desc(partnerTraining.lastActivityAt)).limit(500);
  const certified = rows.filter((r) => r.t.certifiedAt);
  return (
    <>
      <PageHeader title="Szkolenia i certyfikaty" sub="Kto ogląda filmy o usługach, odpowiada na pytania i zdobył certyfikat. Filmy i pytania ustawia się w edycji usługi." />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Zaangażowani partnerzy" value={new Set(rows.map((r) => r.pid)).size} />
        <Stat label="Rozpoczęte szkolenia" value={rows.length} />
        <Stat label="Podejścia do testów" value={rows.reduce((a, r) => a + r.t.attempts, 0)} />
        <Stat label="Wydane certyfikaty" value={certified.length} />
      </div>
      <Table head={["Partner", "Obszar / usługa", "Filmy", "Test", "Certyfikat", "Ostatnia aktywność"]} data-testid="admin-training">
        {rows.map(({ t, number, pid, firstName, lastName, s }) => (
          <tr key={t.id} data-testid="admin-training-row">
            <td><Link href={`/admin/partnerzy/${pid}`} className="font-semibold hover:underline">{firstName} {lastName}</Link><span className="tabular block text-xs text-muted">{partnerId(number)}</span></td>
            <td><span className="first-letter:uppercase">{t.certArea || s.area || s.name}</span><Link href={`/admin/uslugi/${s.id}`} className="block text-xs text-muted hover:underline">{s.name}</Link></td>
            <td className="tabular">{t.watched.length}/{s.videos.length}</td>
            <td className="tabular">{t.attempts === 0 ? "—" : `${t.bestScore}/${s.quiz.length} · podejść: ${t.attempts}`}</td>
            <td>{t.certifiedAt ? <span className="success-soft rounded-full px-2.5 py-1 text-xs font-bold">{t.certNumber} · {fmtDate(t.certifiedAt)}</span> : <span className="text-muted">—</span>}</td>
            <td className="tabular whitespace-nowrap">{fmtDate(t.lastActivityAt)}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">Nikt jeszcze nie zaczął szkolenia.</td></tr>}
      </Table>
    </>
  );
}
