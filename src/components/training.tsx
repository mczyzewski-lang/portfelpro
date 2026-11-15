"use client";

import { Check, CircleCheck, Lock, PlayCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markVideoWatchedAction, submitQuizAction, type QuizResult } from "@/app/actions/training";
import { cn } from "@/lib/cn";
import { ConfettiBurst } from "./confetti";

/** Filmy szkoleniowe: obejrzenie do końca odhacza film; po wszystkich odblokowuje się test. */
export function TrainingVideos({ serviceId, videos, watched: initial }: { serviceId: string; videos: { title: string; url: string }[]; watched: number[] }) {
  const router = useRouter();
  const [watched, setWatched] = useState(initial);
  const done = async (i: number) => {
    if (watched.includes(i)) return;
    setWatched((w) => [...w, i]);
    const res = await markVideoWatchedAction(serviceId, i);
    if (res) { setWatched(res.watched); router.refresh(); }
  };
  return (
    <ol className="space-y-3" data-testid="training-videos">
      {videos.map((v, i) => {
        const ok = watched.includes(i);
        return (
          <li key={v.url + i} className="overflow-hidden rounded-3xl border border-line bg-white" data-testid="training-video" data-watched={ok}>
            <div className="flex items-center gap-2.5 px-4 py-3">
              {ok ? <CircleCheck className="size-5 shrink-0 text-ok" aria-label="Obejrzany" /> : <PlayCircle className="size-5 shrink-0 text-gold-deep" aria-hidden />}
              <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-leather-dark">{i + 1}. {v.title}</p>
              {ok && <span className="success-soft rounded-full px-2 py-0.5 text-[11px] font-bold">obejrzany</span>}
            </div>
            <video src={v.url} controls playsInline preload="metadata" onEnded={() => done(i)} className="max-h-[70vh] w-full bg-black" />
          </li>
        );
      })}
    </ol>
  );
}

/** Test wiedzy. Odpowiedzi sprawdza serwer; po zaliczeniu strona odświeża się i pokazuje certyfikat. */
export function Quiz({ serviceId, questions, locked, passScore }: { serviceId: string; questions: { q: string; options: string[] }[]; locked: boolean; passScore: number }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<Exclude<QuizResult, { error: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (locked) return (
    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-line bg-white/60 px-4 py-5 text-sm text-muted" data-testid="quiz-locked">
      <Lock className="size-5 shrink-0" aria-hidden />Test odblokuje się po obejrzeniu wszystkich filmów do końca.
    </div>
  );
  const left = answers.filter((a) => a === null).length;
  const submit = () => start(async () => {
    setError(null);
    const res = await submitQuizAction(serviceId, answers.map((a) => a ?? -1));
    if ("error" in res) return setError(res.error);
    setResult(res);
    if (res.passed) router.refresh();
    else window.scrollTo({ top: document.getElementById("test")?.offsetTop ?? 0 });
  });
  if (result?.passed) return (
    <div className="success-grad rounded-3xl px-5 py-6 text-center" data-testid="quiz-passed">
      <ConfettiBurst />
      <p className="text-lg font-extrabold">Zaliczone: {result.score}/{result.total}</p>
      <p className="mt-1 text-sm">Certyfikat jest już na Twoim koncie.</p>
    </div>
  );
  return (
    <div className="space-y-3" data-testid="quiz">
      {result && (
        <div role="status" className="rounded-2xl bg-warn-bg px-4 py-3 text-sm font-medium text-warn" data-testid="quiz-failed">
          Wynik: {result.score}/{result.total}. Do certyfikatu potrzeba {passScore}. Pytania do poprawy są zaznaczone — możesz wrócić do filmów i spróbować ponownie.
        </div>
      )}
      {questions.map((q, i) => (
        <fieldset key={i} className={cn("rounded-3xl border bg-white p-4", result?.wrong.includes(i) ? "border-danger/50" : "border-line")} data-testid="quiz-question">
          <legend className="float-left mb-2.5 w-full text-[15px] font-bold leading-snug text-leather-dark"><span className="tabular text-gold-deep">{i + 1}/{questions.length}</span> {q.q}</legend>
          <div className="clear-both space-y-2">
            {q.options.map((o, j) => {
              const on = answers[i] === j;
              return (
                <label key={j} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 text-[14px] leading-snug", on ? "border-leather bg-cream font-semibold text-leather-dark" : "border-line text-ink")}>
                  <input type="radio" name={`q${i}`} checked={on} onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))} className="sr-only" />
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", on ? "border-leather bg-leather text-white" : "border-line bg-white")}>{on && <Check className="size-3.5" aria-hidden />}</span>
                  {o}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <button type="button" onClick={submit} disabled={pending || left > 0} className="leather-grad press flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold disabled:opacity-50" data-testid="quiz-submit">
        {result && <RotateCcw className="size-4" aria-hidden />}{pending ? "Sprawdzam…" : left > 0 ? `Zostało pytań: ${left}` : result ? "Sprawdź ponownie" : "Sprawdź odpowiedzi"}
      </button>
    </div>
  );
}
