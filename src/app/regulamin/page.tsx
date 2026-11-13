import { LegalPage } from "@/components/legal";

export const metadata = { title: "Regulamin programu partnerskiego" };

export default function Terms() {
  return (
    <LegalPage title="Regulamin programu partnerskiego">
      <section><h2>1. Czym jest Portfel.pro</h2><p>Portfel.pro to platforma, przez którą partnerzy polecają usługi realizowane przez spółki z grupy AV i mogą otrzymać wynagrodzenie za skuteczne polecenia, na warunkach określonych dla danej usługi.</p></section>
      <section><h2>2. Konto partnera</h2><ul>
        <li>Konto jest bezpłatne. Każdy partner otrzymuje stały identyfikator (Partner ID).</li>
        <li>Konto wymaga zatwierdzenia. Do tego czasu linki polecające są nieaktywne.</li>
        <li>Polecanie wybranych usług (prawnych, finansowych, zdrowotnych, rodzinnych) wymaga odrębnego zatwierdzenia formy współpracy.</li>
      </ul></section>
      <section><h2>3. Zasady polecania</h2><ul>
        <li>Partner nie świadczy usług i nie udziela porad w imieniu spółek — przekazuje link.</li>
        <li>Zakazane są: spam, wprowadzanie w błąd, obietnice rezultatów oraz pozyskiwanie danych wrażliwych klientów.</li>
        <li>Partner stosuje się do wskazówek „Czego nie obiecywać” w karcie usługi.</li>
      </ul></section>
      <section><h2>4. Atrybucja</h2><p>Polecenie jest przypisywane do pierwszego partnera, którego link klient otworzył w oknie atrybucji (domyślnie 30 dni) dla danej usługi. Administrator może skorygować przypisanie, odnotowując powód.</p></section>
      <section><h2>5. Prowizje i wypłaty</h2><ul>
        <li>Stawka i warunek naliczenia są określone w karcie usługi. Stawki oznaczone „DEMO” nie są wiążące.</li>
        <li>Prowizja jest naliczana po spełnieniu warunku, następnie zatwierdzana i wypłacana.</li>
        <li>W razie zwrotu lub odstąpienia klienta prowizja jest anulowana, a jeśli została wypłacona — korygowana.</li>
        <li>Zmiana stawek nie wpływa na prowizje już naliczone.</li>
      </ul></section>
      <section><h2>6. Poufność</h2><p>Partner nie otrzymuje danych osobowych klientów, którzy zgłosili się przez link, ani informacji o treści ich spraw. Widzi numer polecenia, etap procesu i prowizję. Jeśli partner sam przekazuje kontakt klienta do konsultacji, robi to wyłącznie za zgodą klienta i widzi przy tym poleceniu imię i nazwisko, które sam wpisał. Usługi dotyczące zdrowia i spraw rodzinnych nie przyjmują danych przekazanych przez partnera.</p></section>
    </LegalPage>
  );
}
