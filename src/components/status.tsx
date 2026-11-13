import { commissionStatusLabel, leadStatusShort, partnerStatusLabel, publishLabel } from "@/lib/labels";
import { Badge, type Tone } from "./ui";

const leadTone: Record<string, Tone> = { registered: "neutral", contacted: "gold", qualified: "gold", in_progress: "gold", won: "ok", rejected: "danger", cancelled: "danger" };
const commTone: Record<string, Tone> = { pending: "warn", approved: "gold", paid: "ok", cancelled: "danger" };
const partnerTone: Record<string, Tone> = { pending: "warn", active: "ok", suspended: "danger" };
const pubTone: Record<string, Tone> = { draft: "warn", published: "ok", hidden: "neutral" };

export const LeadStatusBadge = ({ status }: { status: string }) => <Badge tone={leadTone[status]}>{leadStatusShort[status] ?? status}</Badge>;
export const CommissionStatusBadge = ({ status }: { status: string }) => <Badge tone={commTone[status]}>{commissionStatusLabel[status] ?? status}</Badge>;
export const PartnerStatusBadge = ({ status }: { status: string }) => <Badge tone={partnerTone[status]}>{partnerStatusLabel[status] ?? status}</Badge>;
export const PublishBadge = ({ status }: { status: string }) => <Badge tone={pubTone[status]}>{publishLabel[status] ?? status}</Badge>;
