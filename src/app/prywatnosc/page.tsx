import { LegalPage } from "@/components/legal";

export const metadata = { title: "Polityka prywatności i cookies" };

export default function Privacy() {
  return (
    <LegalPage title="Polityka prywatności i cookies">
      <section><h2>Jakie dane przetwarzamy</h2><ul>
        <li><b>Partnerzy:</b> imię, nazwisko, e-mail, forma działalności, nazwa firmy i NIP (jeśli dotyczy), branża, historia poleceń i rozliczeń.</li>
        <li><b>Osoby korzystające z linków:</b> losowy identyfikator wizyty, skrót (hash) adresu IP, informacja o przeglądarce i źródle wejścia.</li>
        <li><b>Osoby wysyłające formularz:</b> imię, e-mail i opcjonalnie telefon — wyłącznie w celu kontaktu w sprawie wybranej usługi. Nie zbieramy w formularzach opisu sytuacji zdrowotnej, rodzinnej ani finansowej.</li>
      </ul></section>
      <section><h2>Kto widzi dane klienta</h2><p>Dane kontaktowe klienta widzi wyłącznie administrator i spółka realizująca usługę. Partner polecający <b>nie ma do nich dostępu</b> — widzi jedynie numer i status polecenia.</p></section>
      <section><h2>Pliki cookies</h2><ul>
        <li><b>pp_session</b> — niezbędny, utrzymuje zalogowanie partnera (HttpOnly).</li>
        <li><b>pp_vid</b> — losowy identyfikator ustawiany po kliknięciu linku polecającego, ważny przez okno atrybucji (domyślnie 30 dni). Służy wyłącznie do przypisania polecenia właściwemu partnerowi. Nie jest używany do reklam ani profilowania.</li>
      </ul><p>Nie stosujemy zewnętrznych skryptów analitycznych ani reklamowych.</p></section>
      <section><h2>Twoje prawa</h2><p>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu oraz wniesienia skargi do Prezesa UODO. Kontakt: [uzupełnić dane administratora].</p></section>
    </LegalPage>
  );
}
