import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, children, sub }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold text-leather-dark">{title}</h1>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="tabular mt-0.5 text-2xl font-extrabold text-leather-dark">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
export function Table({ head, children, className, ...p }: { head: ReactNode[] } & ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table {...p} className={cn("w-full min-w-[560px] text-sm", className)}>
        <thead className="border-b border-line bg-cream/60 text-left text-xs text-muted">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-3.5 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}
export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-4 sm:p-5", className)}>
      {title && <h2 className="mb-3 text-base font-extrabold text-leather-dark">{title}</h2>}
      {children}
    </section>
  );
}
export const textareaCls = "block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20";
