import { logoutAction } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin-nav";
import { Badge, Wordmark } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { unreadForManagers } from "@/lib/messages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administracja", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3"><Wordmark href="/admin" size={30} /><Badge tone="dark">Admin</Badge>{env.demoMode && <Badge tone="warn">Tryb demo</Badge>}</div>
        <form action={logoutAction} className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{user.email}</span><button className="min-h-10 rounded-full px-3 text-sm font-bold text-leather hover:bg-sand">Wyloguj</button></form>
      </header>
      <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start"><AdminNav unread={await unreadForManagers()} /></aside>
        <main id="tresc" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
