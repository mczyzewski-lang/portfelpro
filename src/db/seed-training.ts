/**
 * Startowe szkolenia do certyfikatów: obszar + 10 pytań na usługę. Zapis: [pytanie, poprawna odpowiedź, błędna, błędna].
 * To treści przykładowe (training_demo) — przed pokazaniem partnerom poza trybem demo musi je potwierdzić właściciel i eksperci.
 */
type Row = [q: string, correct: string, wrong1: string, wrong2: string];
const NO_DETAILS: Row = ["Czy przy przekazaniu klienta zbierasz szczegóły jego sytuacji?", "Nie — wystarczy kontakt, szczegóły klient omawia poufnie ze specjalistą", "Tak, im więcej szczegółów zapiszę, tym lepiej", "Tak, i przesyłam je e-mailem do firmy"];

export const TRAINING: Record<string, { area: string; quiz: Row[] }> = {
  "znak-towarowy": { area: "znaki towarowe", quiz: [
    ["Gdzie zgłasza się znak, który ma być chroniony tylko w Polsce?", "W Urzędzie Patentowym RP", "W Krajowym Rejestrze Sądowym", "W urzędzie skarbowym"],
    ["Który urząd rejestruje znak chroniony w całej Unii Europejskiej?", "EUIPO", "CEIDG", "Komisja Europejska"],
    ["Jak długo trwa ochrona zarejestrowanego znaku?", "10 lat, z możliwością przedłużania na kolejne okresy", "5 lat, bez możliwości przedłużenia", "Bezterminowo od chwili zgłoszenia"],
    ["Co można zastrzec jako znak towarowy?", "Między innymi nazwę, logo lub hasło", "Wyłącznie logo graficzne", "Wyłącznie nazwę spółki z KRS"],
    ["Czy wpis firmy do CEIDG lub KRS daje wyłączne prawo do nazwy jako znaku towarowego?", "Nie — rejestracja firmy i ochrona znaku to dwie różne sprawy", "Tak, automatycznie", "Tak, po roku działalności"],
    ["Klient rusza z dużą kampanią reklamową nowej marki. Co warto zrobić?", "Zaproponować sprawdzenie i zastrzeżenie nazwy, zanim wyda budżet", "Poczekać, aż marka stanie się rozpoznawalna", "Nic — reklama sama chroni markę"],
    ["Co specjaliści robią przed zgłoszeniem znaku?", "Sprawdzają, czy nie istnieją wcześniejsze podobne znaki", "Rejestrują domenę internetową", "Zmieniają nazwę firmy w KRS"],
    ["Dla czego rejestruje się znak?", "Dla wskazanych klas towarów i usług", "Zawsze dla wszystkich branż naraz", "Tylko dla jednego produktu"],
    ["Czego nie wolno obiecywać klientowi?", "Że urząd na pewno zarejestruje znak", "Że specjalista oceni szanse rejestracji", "Że dostanie informację o kosztach"],
    ["Platforma sprzedażowa pyta klienta o prawo do marki. To sygnał, żeby:", "Polecić rozmowę o rejestracji znaku", "Zmienić platformę", "Usunąć logo z ofert"],
  ] },
  "upadlosc-konsumencka": { area: "upadłość konsumencka", quiz: [
    ["Dla kogo jest upadłość konsumencka?", "Dla osoby fizycznej, która nie prowadzi działalności gospodarczej", "Dla spółek z o.o.", "Wyłącznie dla emerytów"],
    ["Kto decyduje o ogłoszeniu upadłości?", "Sąd", "Bank, w którym klient ma kredyt", "Komornik"],
    ["Co jest podstawową przesłanką upadłości?", "Niewypłacalność — brak możliwości regulowania wymagalnych zobowiązań", "Samo posiadanie kredytu", "Niskie zarobki"],
    ["Co dzieje się z majątkiem po ogłoszeniu upadłości?", "Wchodzi do masy upadłości, którą zarządza syndyk", "Pozostaje bez zmian w rękach dłużnika", "Przejmuje go największy wierzyciel"],
    ["Jaki jest cel postępowania z punktu widzenia dłużnika?", "Oddłużenie — umorzenie zobowiązań po wykonaniu ustaleń sądu", "Zaciągnięcie nowego kredytu", "Ukrycie majątku"],
    ["Których zobowiązań co do zasady nie obejmuje umorzenie?", "Alimentów", "Chwilówek", "Kart kredytowych"],
    ["Który sygnał w rozmowie sugeruje, że warto wspomnieć o usłudze?", "Klient spłaca pożyczki kolejnymi pożyczkami i wspomina o komorniku", "Klient planuje wakacje", "Klient pyta o lokatę"],
    ["Jak rozmawiać o tym z klientem?", "Dyskretnie, bez oceniania — proponując poufną rozmowę ze specjalistą", "Publicznie, przy innych osobach", "Naciskając na szybką decyzję"],
    ["Czego nie wolno obiecywać?", "Że wszystkie długi na pewno zostaną umorzone", "Że rozmowa ze specjalistą jest poufna", "Że specjalista oceni sytuację"],
    NO_DETAILS,
  ] },
  "sankcja-kredytu-darmowego": { area: "sankcja kredytu darmowego", quiz: [
    ["Czym jest sankcja kredytu darmowego?", "Uprawnieniem konsumenta do spłaty kredytu bez odsetek i innych kosztów, gdy kredytodawca naruszył ustawowe obowiązki", "Karą dla klienta za spóźnioną ratę", "Promocją banku na kredyt 0%"],
    ["Z jakiej ustawy wynika?", "Z ustawy o kredycie konsumenckim", "Z ustawy o podatku dochodowym", "Z kodeksu pracy"],
    ["Kto może z niej skorzystać?", "Konsument", "Wyłącznie spółka kapitałowa", "Tylko bank"],
    ["Jakich umów najczęściej dotyczy?", "Kredytów konsumenckich, np. gotówkowych i ratalnych", "Umów najmu mieszkania", "Umów o pracę"],
    ["Jak konsument korzysta z uprawnienia?", "Składa kredytodawcy pisemne oświadczenie", "Przestaje płacić raty bez słowa", "Zgłasza się do urzędu skarbowego"],
    ["Do kiedy można skorzystać z uprawnienia?", "Do roku od wykonania umowy", "Bez żadnego terminu", "Tylko w pierwszym miesiącu kredytu"],
    ["Co jest potrzebne, żeby specjalista ocenił sprawę?", "Umowa kredytu do analizy", "Zeznanie podatkowe", "Akt notarialny"],
    ["Który sygnał sugeruje polecenie usługi?", "Klient ma lub niedawno spłacił kredyt gotówkowy i mówi o wysokich kosztach", "Klient kupuje samochód za gotówkę", "Klient zakłada firmę"],
    ["Czego nie wolno obiecywać?", "Że każda umowa kredytu ma wady i klient na pewno odzyska pieniądze", "Że umowa zostanie przeanalizowana", "Że klient pozna wynik analizy"],
    ["Klient spłacił kredyt kilka miesięcy temu. Czy warto polecić analizę?", "Tak — uprawnienie może jeszcze przysługiwać", "Nie — po spłacie nigdy nic nie przysługuje", "Tylko jeśli ma nowy kredyt"],
  ] },
  "ip-box": { area: "ulga IP Box", quiz: [
    ["Czym jest IP Box?", "Preferencyjnym opodatkowaniem dochodu z kwalifikowanych praw własności intelektualnej", "Dotacją na zakup komputera", "Zwolnieniem ze składek ZUS"],
    ["Kto jest typowym odbiorcą usługi?", "Programista na B2B lub firma tworząca własne rozwiązania", "Osoba na umowie o pracę bez działalności", "Emeryt"],
    ["Jaki warunek dotyczy sposobu powstania prawa?", "Musi powstać w ramach działalności badawczo-rozwojowej", "Musi być kupione od zagranicznej firmy", "Musi mieć ponad 10 lat"],
    ["Co trzeba prowadzić, żeby rozliczyć ulgę?", "Odrębną ewidencję pozwalającą wyliczyć kwalifikowany dochód", "Wyłącznie kasę fiskalną", "Nic dodatkowego"],
    ["Kiedy rozlicza się ulgę?", "W zeznaniu rocznym", "Co tydzień", "Tylko przy zamknięciu firmy"],
    ["Co zwiększa bezpieczeństwo podatnika?", "Indywidualna interpretacja podatkowa", "Ustne zapewnienie znajomego", "Brak dokumentacji"],
    ["Co jest przykładem kwalifikowanego prawa?", "Autorskie prawo do programu komputerowego", "Prawo jazdy", "Umowa najmu biura"],
    ["Który sygnał sugeruje polecenie usługi?", "Programista na B2B tworzy własny kod i przenosi prawa na klienta", "Klient zatrudnia sprzątaczkę", "Klient kupuje auto w leasingu"],
    ["Czego nie wolno obiecywać?", "Że każdy programista na pewno skorzysta z ulgi", "Że specjalista sprawdzi warunki", "Że klient dostanie rzetelną ocenę"],
    ["Czy z ulgi korzysta się w ramach wynagrodzenia z umowy o pracę?", "Nie — ulga dotyczy dochodów z działalności gospodarczej", "Tak, zawsze", "Tak, po pierwszym roku pracy"],
  ] },
  "restrukturyzacja": { area: "restrukturyzacja przedsiębiorstwa", quiz: [
    ["Jaki jest cel restrukturyzacji?", "Zawarcie układu z wierzycielami i uniknięcie upadłości", "Szybka likwidacja firmy", "Ukrycie majątku przed wierzycielami"],
    ["Dla kogo jest restrukturyzacja?", "Dla przedsiębiorcy niewypłacalnego lub zagrożonego niewypłacalnością", "Tylko dla firm z zyskiem", "Dla konsumentów bez firmy"],
    ["Czym różni się od upadłości?", "Firma co do zasady działa dalej, a upadłość zmierza do likwidacji majątku", "Niczym", "Restrukturyzacja zawsze kończy działalność"],
    ["Czym jest układ?", "Porozumieniem z wierzycielami co do sposobu spłaty, np. raty, odroczenie, redukcja", "Nowym kredytem z banku", "Umową sprzedaży firmy"],
    ["Kto głosuje nad układem?", "Wierzyciele", "Pracownicy urzędu skarbowego", "Klienci firmy"],
    ["Kto profesjonalnie wspiera postępowanie?", "Doradca restrukturyzacyjny", "Notariusz", "Rzecznik patentowy"],
    ["Który sygnał sugeruje polecenie usługi?", "Zaległości wobec ZUS, urzędu skarbowego lub dostawców, zajęcia rachunku", "Rekordowa sprzedaż", "Zakup nowego biura za gotówkę"],
    ["Kiedy najlepiej reagować?", "Jak najwcześniej — zanim problemy z płynnością się pogłębią", "Dopiero po zajęciu całego majątku", "Po zamknięciu firmy"],
    ["Czego nie wolno obiecywać?", "Że wierzyciele na pewno przyjmą układ", "Że specjalista przeanalizuje sytuację", "Że klient pozna możliwe ścieżki"],
    ["Kto dobiera rodzaj postępowania do sytuacji firmy?", "Specjalista po analizie sytuacji", "Partner polecający podczas pierwszej rozmowy", "Największy dłużnik firmy"],
  ] },
  "rozwod-za-porozumieniem": { area: "rozwód za porozumieniem i mediacje", quiz: [
    ["Czym jest mediacja?", "Dobrowolną, poufną rozmową stron z udziałem bezstronnego mediatora", "Rozprawą sądową", "Przesłuchaniem świadków"],
    ["Kto orzeka rozwód?", "Sąd", "Mediator", "Notariusz"],
    ["Jaka jest rola mediatora?", "Pomaga stronom wypracować porozumienie, niczego nie narzuca", "Wydaje wyrok", "Reprezentuje jedną ze stron"],
    ["Co małżonkowie mogą ustalić w porozumieniu?", "Między innymi opiekę nad dziećmi, kontakty, alimenty i sprawy majątkowe", "Wyłącznie datę rozprawy", "Nic — o wszystkim decyduje urząd"],
    ["Co zwykle daje porozumienie stron?", "Spokojniejszy i zazwyczaj krótszy przebieg sprawy", "Gwarancję wygranej jednej strony", "Brak jakichkolwiek formalności"],
    ["Czy mediacja jest obowiązkowa?", "Nie — jest dobrowolna", "Tak, zawsze", "Tak, dla osób z dziećmi"],
    ["Który sygnał sugeruje, że można wspomnieć o usłudze?", "Klient sam mówi o rozstaniu, np. przy sprzedaży wspólnego mieszkania", "Klient planuje ślub", "Klient zmienia pracę"],
    ["Jak rozmawiać z klientem?", "Delikatnie, bez dopytywania o szczegóły i bez oceniania", "Dopytując o powody rozstania", "Doradzając, kto ma rację"],
    ["Czego nie wolno obiecywać?", "Konkretnego wyniku sprawy ani terminu orzeczenia", "Że rozmowa jest poufna", "Że specjalista wyjaśni możliwe drogi"],
    NO_DETAILS,
  ] },
  "psychoterapia-online": { area: "psychoterapia online", quiz: [
    ["Jak odbywa się psychoterapia online?", "Podczas sesji na żywo z psychoterapeutą przez internet", "Wyłącznie przez wypełnianie ankiet", "Przez automatyczne wiadomości bez specjalisty"],
    ["Czym różni się psychiatra od psychoterapeuty?", "Psychiatra jest lekarzem i może zlecić leki; psychoterapeuta prowadzi terapię", "Niczym", "Psychoterapeuta przepisuje leki, psychiatra nie"],
    ["Co obowiązuje psychoterapeutę?", "Tajemnica zawodowa", "Obowiązek informowania pracodawcy klienta", "Publikowanie notatek z sesji"],
    ["Kiedy można wspomnieć o usłudze?", "Gdy klient sam mówi o przewlekłym stresie, wypaleniu lub trudnym okresie", "Zawsze, każdemu klientowi na powitanie", "Gdy klient spóźni się na spotkanie"],
    ["Jak polecać?", "Z szacunkiem, jako możliwość — bez nacisku", "Stanowczo, do skutku", "Żartując z problemu"],
    ["Czy partner może stawiać diagnozę?", "Nie — od tego jest specjalista", "Tak, jeśli zna klienta od dawna", "Tak, po obejrzeniu szkolenia"],
    ["Co zrobić, gdy ktoś jest w bezpośrednim zagrożeniu życia?", "Wskazać numer alarmowy 112 — to nie jest sytuacja na formularz", "Wysłać link edukacyjny", "Poczekać do następnego spotkania"],
    ["Czego nie wolno obiecywać?", "Wyleczenia ani szybkich efektów", "Że rozmowa ze specjalistą jest poufna", "Że terapia odbywa się online"],
    ["Co jest zaletą formy online?", "Dostęp do specjalisty z dowolnego miejsca", "Brak udziału terapeuty", "Gwarancja efektu po jednej sesji"],
    NO_DETAILS,
  ] },
  "duo-terapia-dla-malzenstw": { area: "terapia dla par i małżeństw", quiz: [
    ["Dla kogo jest terapia DUO?", "Dla par i małżeństw", "Wyłącznie dla osób po rozwodzie", "Dla zespołów w firmach"],
    ["Kto zwykle uczestniczy w sesji?", "Oboje partnerzy i terapeuta", "Tylko jedna osoba i jej prawnik", "Cała rodzina z sąsiadami"],
    ["Jaki jest cel terapii par?", "Lepsza komunikacja i zrozumienie tego, co dzieje się w relacji", "Wskazanie winnego", "Przygotowanie pozwu"],
    ["Jaką postawę zachowuje terapeuta?", "Nie staje po żadnej ze stron", "Wspiera osobę, która się zgłosiła", "Ocenia, kto ma rację"],
    ["Kiedy można wspomnieć o usłudze?", "Gdy klient sam mówi o kryzysie lub ciągłych konfliktach w związku", "Przy każdej okazji, także przy innych osobach", "Gdy klient się spieszy"],
    ["Jak polecać?", "Dyskretnie, w cztery oczy, jako możliwość", "Przy partnerze klienta, bez uprzedzenia", "W wiadomości grupowej"],
    ["Czego nie wolno obiecywać?", "Że terapia na pewno uratuje związek", "Że sesje są poufne", "Że para porozmawia ze specjalistą"],
    ["Kiedy terapia ma sens?", "Im wcześniej, tym lepiej — nie tylko tuż przed rozstaniem", "Wyłącznie po złożeniu pozwu", "Tylko po wielu latach kryzysu"],
    ["Co obowiązuje terapeutę?", "Poufność", "Obowiązek informowania rodziny", "Udostępnianie nagrań"],
    NO_DETAILS,
  ] },
  "domy-modulowe": { area: "domy modułowe i szkieletowe", quiz: [
    ["Czym wyróżnia się dom modułowy?", "Powstaje z elementów przygotowanych w hali i montowanych na działce", "Jest budowany wyłącznie z cegły na miejscu", "Nie wymaga fundamentu ani działki"],
    ["Co jest konstrukcją nośną domu szkieletowego?", "Szkielet, najczęściej drewniany", "Ściany z pustaków", "Żelbetowe słupy"],
    ["Co jest główną zaletą prefabrykacji?", "Krótszy czas prac na działce", "Brak jakichkolwiek formalności", "Zawsze najniższa cena na rynku"],
    ["Co klient powinien mieć lub sprawdzić na początku?", "Działkę i możliwość jej zabudowy", "Tylko meble", "Wyłącznie kolor elewacji"],
    ["Kto ustala, jakich formalności wymaga dany projekt?", "Specjalista — zależy to od projektu i działki", "Partner polecający podczas rozmowy", "Sąsiad klienta"],
    ["Który sygnał sugeruje polecenie usługi?", "Klient kupił działkę albo szuka domu", "Klient wynajmuje biuro", "Klient zmienia telefon"],
    ["Od czego zależy cena domu?", "Między innymi od metrażu, standardu i projektu", "Wyłącznie od pory roku", "Jest jedna dla wszystkich"],
    ["Czego nie wolno obiecywać?", "Konkretnej ceny i terminu przed wyceną", "Że klient dostanie wycenę", "Że specjalista odpowie na pytania"],
    ["Kto decyduje o finansowaniu kredytem?", "Bank — warto, by klient omówił to ze specjalistą i bankiem", "Partner polecający", "Producent okien"],
    ["Jaki jest pierwszy krok dla zainteresowanego klienta?", "Rozmowa ze specjalistą i wstępna wycena", "Wpłata całej kwoty", "Samodzielny zakup materiałów"],
  ] },
};

/** Pytania w formacie bazy; pozycja poprawnej odpowiedzi zmienia się między pytaniami. */
export function quizFor(slug: string) {
  const t = TRAINING[slug];
  if (!t) return null;
  return {
    area: t.area,
    quiz: t.quiz.map(([q, ok, w1, w2], i) => {
      const correct = (i * 2 + slug.length) % 3;
      const options = [w1, w2]; options.splice(correct, 0, ok);
      return { q, options, correct };
    }),
  };
}
