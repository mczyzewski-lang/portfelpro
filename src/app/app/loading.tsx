/** Szkielet pokazywany natychmiast po dotknięciu zakładki — zanim serwer odda treść ekranu. */
export default function Loading() {
  const bar = "animate-pulse rounded-2xl bg-sand";
  return (
    <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Wczytywanie">
      <div className={`${bar} h-7 w-44`} />
      <div className={`${bar} h-40 rounded-[28px]`} />
      <div className="grid grid-cols-3 gap-2.5"><div className={`${bar} h-20`} /><div className={`${bar} h-20`} /><div className={`${bar} h-20`} /></div>
      <div className={`${bar} h-24 rounded-3xl`} />
      <div className={`${bar} h-24 rounded-3xl`} />
    </div>
  );
}
