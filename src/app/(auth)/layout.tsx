import { Wordmark } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="tresc" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-12 pt-6">
      <Wordmark />
      <div className="mt-8">{children}</div>
    </main>
  );
}
