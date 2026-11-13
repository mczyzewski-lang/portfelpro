"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="tresc" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-leather-dark">Coś poszło nie tak</h1>
      <p className="mt-2 text-[15px] text-muted">Spróbuj ponownie. Jeśli problem się powtarza, odśwież stronę za chwilę.</p>
      <button onClick={reset} className="mt-6 min-h-11 rounded-full bg-leather px-6 font-semibold text-white">Spróbuj ponownie</button>
    </main>
  );
}
