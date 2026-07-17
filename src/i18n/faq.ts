import type { Lang } from "./utils";

// Jedno źródło prawdy pytań FAQ (decyzje: docs/analiza-podstrona-faq.md D2).
// Wzorzec pól {pl, en} jak navItems — słownik ui.ts zostaje strings-only.
// Konsumenci: Faq.astro (teaser strony głównej — slice(0, FAQ_TEASER_COUNT))
// i FaqFull.astro (podstrona /faq/ — całość + JSON-LD FAQPage).
// Pozycje 1–6 = teksty dawnych kluczy faq.q1–6/faq.a1–6 przeniesione 1:1;
// 7–30 = PL z referencji docs/design/faq-podstrona-referencja/ + tłumaczenia
// EN (nazewnictwo pakietów jak w istniejących tekstach: Start/Image/Business).
// Kontrakt liczb (6 w teaserze, 30 łącznie) pilnuje tests/unit/faq-config.test.ts.

export interface FaqItem {
  q: Record<Lang, string>;
  a: Record<Lang, string>;
}

export const faqItems: FaqItem[] = [
  {
    q: {
      pl: "Ile czasu zajmuje stworzenie strony internetowej?",
      en: "How long does it take to build a website?",
    },
    a: {
      pl: "Czas realizacji zależy od wybranego pakietu. Najprostsze strony z pakietu Start są zazwyczaj gotowe w 1 do 2 tygodni. Projekty z pakietu Wizerunek i wyższych, które wymagają przygotowania indywidualnych makiet i zaprogramowania płynnych animacji, zajmują najczęściej od 3 do 6 tygodni. Dokładny harmonogram zawsze ustalamy przed rozpoczęciem prac.",
      en: "The timeline depends on the package you choose. The simplest websites from the Start package are usually ready in 1 to 2 weeks. Projects from the Image package and above — which involve a custom mockup and carefully programmed, smooth animations — most often take 3 to 6 weeks. We always agree on the exact schedule before the work begins.",
    },
  },
  {
    q: {
      pl: "Czy będę mógł/mogła samodzielnie edytować stronę po jej oddaniu?",
      en: "Will I be able to edit the website myself after handover?",
    },
    a: {
      pl: "Tak. W pakietach od Wizerunku wzwyż standardowo wdrażam intuicyjny panel zarządzania (CMS). Po zakończeniu prac pokazuję, jak w prosty sposób – przypominający obsługę mediów społecznościowych – samodzielnie zmieniać teksty, dodawać zdjęcia czy aktualizować ofertę. Dla pakietu Start panel CMS jest dostępny jako opcja dodatkowa.",
      en: "Yes. From the Image package upwards I include an intuitive management panel (CMS) as standard. Once the work is done, I show you how to change texts, add photos or update your offer yourself — in a way that feels much like using social media. For the Start package, the CMS panel is available as an add-on.",
    },
  },
  {
    q: {
      pl: "Czy po zrobieniu strony muszę płacić jakiś abonament?",
      en: "Do I have to pay a subscription after the website is built?",
    },
    a: {
      pl: "Samo stworzenie strony to opłata jednorazowa – nie pobieram od Ciebie żadnego comiesięcznego abonamentu. Musisz jednak pamiętać o standardowych, niezależnych ode mnie kosztach utrzymania strony w internecie: opłacie za serwer (hosting) oraz domenę (Twój adres, np. twojafirma.pl). Są to opłaty uiszczane zwykle raz do roku. Pomagam dobrać szybki i opłacalny serwer, żeby te koszty były jak najniższe.",
      en: "Building the website is a one-off payment — I don't charge any monthly subscription. Keep in mind, however, the standard running costs that are independent of me: hosting and your domain (your address, e.g. yourcompany.com). These are usually paid once a year. I help you pick fast, cost-effective hosting so those costs stay as low as possible.",
    },
  },
  {
    q: {
      pl: "Nie mam zdjęć ani tekstów do swojej nowej strony. Czy to problem?",
      en: "I don't have photos or copy for my new website. Is that a problem?",
    },
    a: {
      pl: "Zupełnie nie. Jeśli masz własne materiały – świetnie, wykorzystamy je. Jeśli nie, mogę pomóc. Jako twórca zajmujący się również realizacją wideo i produkcją dźwięku, mogę zająć się stworzeniem dla Ciebie profesjonalnych zdjęć, nagraniem wideo w tle strony czy nawet skomponowaniem autorskiej oprawy dźwiękowej. Pomagam również w redagowaniu tekstów, tak aby przyciągały uwagę Twoich klientów.",
      en: "Not at all. If you have your own materials — great, we'll use them. If not, I can help. As a creator who also works in video and sound production, I can take care of professional photos for you, record a background video for your site, or even compose a custom soundtrack. I also help with editing your copy so it captures your customers' attention.",
    },
  },
  {
    q: {
      pl: "Czy moja strona będzie dobrze działać na smartfonach?",
      en: "Will my website work well on smartphones?",
    },
    a: {
      pl: "Tak, to absolutny priorytet i standard w każdym moim pakiecie. Strony projektuję w podejściu Mobile First, co oznacza, że będą wyglądać i działać perfekcyjnie na każdym ekranie – od najmniejszego telefonu po duże monitory.",
      en: "Yes — it's an absolute priority and a standard in every package. I design websites Mobile First, which means they will look and work perfectly on every screen — from the smallest phone to large monitors.",
    },
  },
  {
    q: {
      pl: "Co w sytuacji, gdy po publikacji strony coś przestanie działać?",
      en: "What if something stops working after the website goes live?",
    },
    a: {
      pl: "Po oddaniu gotowej strony i podpięciu Twojej domeny otrzymujesz ode mnie miesiąc darmowego wsparcia technicznego. Jeśli w tym czasie pojawią się jakieś problemy techniczne, rozwiązuję je w ramach umowy. Po upływie tego czasu możesz zawsze się do mnie odezwać – ewentualne poprawki lub rozbudowę strony wyceniam wtedy na bieżąco.",
      en: "Once the finished website is handed over and your domain is connected, you get a month of free technical support from me. If any technical issues come up during that time, I resolve them as part of our agreement. After that, you can always reach out — I quote any fixes or further development on an ongoing basis.",
    },
  },
  {
    q: {
      pl: "Jak wygląda komunikacja w trakcie tworzenia strony?",
      en: "What does communication look like while the website is being built?",
    },
    a: {
      pl: "Stawiam na transparentność. Kontaktujemy się w sposób dla Ciebie najwygodniejszy – może to być e-mail, komunikator lub cykliczne spotkania wideo. Na bieżąco informuję Cię o tym, na jakim jesteśmy etapie i co dokładnie aktualnie realizuję.",
      en: "I put transparency first. We stay in touch in whatever way suits you best — e-mail, instant messaging or regular video calls. I keep you up to date on where we are and exactly what I'm currently working on.",
    },
  },
  {
    q: {
      pl: "Co muszę przygotować, zanim zaczniemy pracę?",
      en: "What do I need to prepare before we start?",
    },
    a: {
      pl: "Przede wszystkim potrzebuję informacji o Twoim biznesie: kim są Twoi klienci, jakie są cele strony oraz z jakich funkcjonalności chcesz korzystać. Na start poproszę Cię o wypełnienie krótkiego briefu. Jeśli masz już logo, zdjęcia i teksty – świetnie. Jeśli nie, pomogę Ci je zorganizować.",
      en: "First of all, I need information about your business: who your customers are, what the website's goals are and which features you want to use. To get started, I'll ask you to fill in a short brief. If you already have a logo, photos and copy — great. If not, I'll help you get them organised.",
    },
  },
  {
    q: {
      pl: "Czy podpisujemy umowę na wykonanie strony?",
      en: "Do we sign a contract for the website?",
    },
    a: {
      pl: "Tak, zawsze podpisujemy umowę, która jasno określa zakres prac, termin realizacji, koszty oraz przeniesienie praw autorskich do stworzonego kodu i designu na Twoją firmę.",
      en: "Yes, we always sign a contract that clearly defines the scope of work, the delivery date, the costs, and the transfer of copyright for the created code and design to your company.",
    },
  },
  {
    q: {
      pl: "Czy będę widzieć stronę przed jej ostatecznym uruchomieniem?",
      en: "Will I see the website before it finally goes live?",
    },
    a: {
      pl: "Oczywiście. Po etapie projektowania graficznego (makiety) otrzymujesz specjalny link do testowego serwera roboczego. Zobaczysz tam działającą stronę z zakodowanymi interakcjami. Dopiero po Twojej pełnej akceptacji przenosimy projekt na właściwą domenę.",
      en: "Of course. After the design stage (mockups) you receive a special link to a staging server, where you can see the working website with all the coded interactions. Only after your full approval do we move the project to its target domain.",
    },
  },
  {
    q: {
      pl: "Ile poprawek mogę zgłosić do projektu graficznego?",
      en: "How many rounds of design revisions can I request?",
    },
    a: {
      pl: "Zależy mi na Twojej pełnej satysfakcji. W pakietach od Wizerunku wzwyż, zanim przejdę do programowania, ustalamy wygląd strony na makietach. Zazwyczaj pracujemy w oparciu o 2-3 tury darmowych poprawek, aby dopracować detale wizualne.",
      en: "Your full satisfaction is what matters to me. From the Image package upwards, we settle the design on mockups before I start coding. We usually work within 2-3 rounds of free revisions to polish the visual details.",
    },
  },
  {
    q: {
      pl: "Czy realizujesz projekty również dla klientów z zagranicy?",
      en: "Do you also work with clients from abroad?",
    },
    a: {
      pl: "Tak, pracuję zdalnie i tworzę projekty zarówno dla firm w Polsce, jak i na rynkach zagranicznych. Sam interfejs mojej strony jest dowodem na to, że płynnie wdrażam wielojęzyczne aplikacje.",
      en: "Yes, I work remotely and build projects both for companies in Poland and for international markets. The interface of my own website is proof that I'm fluent in shipping multilingual applications.",
    },
  },
  {
    q: {
      pl: "W jakich technologiach powstają Twoje strony?",
      en: "What technologies are your websites built with?",
    },
    a: {
      pl: "Nie ograniczam się do gotowych, ciężkich szablonów. Opieram się na moim wieloletnim doświadczeniu programistycznym w tworzeniu skalowalnych aplikacji webowych (wykorzystując m.in. ekosystem Angular lub React). Mój proces jest wysoce zoptymalizowany – korzystam z nowoczesnych środowisk developerskich wspieranych przez sztuczną inteligencję, co pozwala mi dostarczać bardzo wydajny, czysty i bezpieczny kod.",
      en: "I don't limit myself to ready-made, heavyweight templates. I build on my years of software engineering experience creating scalable web applications (using, among others, the Angular and React ecosystems). My process is highly optimised — I work in modern, AI-assisted development environments, which lets me deliver very fast, clean and secure code.",
    },
  },
  {
    q: {
      pl: "Czym różni się Twoja strona kodowana od zera od gotowego szablonu z WordPressa?",
      en: "How is your hand-coded website different from a ready-made WordPress template?",
    },
    a: {
      pl: "Gotowe szablony często ładują tysiące linijek niepotrzebnego kodu, co spowalnia stronę i naraża ją na ataki. Rozwiązania, które dostarczam, zawierają tylko ten kod, który jest faktycznie potrzebny. Dzięki temu strony są błyskawiczne, bezpieczne, zyskują wyższe pozycje w wyszukiwarkach i pozwalają na wdrożenie unikalnych animacji.",
      en: "Ready-made templates often load thousands of lines of unnecessary code, which slows the website down and exposes it to attacks. The solutions I deliver contain only the code that is actually needed. As a result, the websites are lightning fast and secure, rank higher in search engines, and make unique animations possible.",
    },
  },
  {
    q: {
      pl: "Czy strona będzie bezpieczna (będzie miała „kłódkę”)?",
      en: "Will the website be secure (with the padlock icon)?",
    },
    a: {
      pl: "Tak, instalacja i pełna konfiguracja darmowego certyfikatu SSL, który szyfruje dane użytkowników (zielona kłódka przy adresie WWW), to u mnie absolutny standard przy każdym wdrożeniu.",
      en: "Yes. Installing and fully configuring a free SSL certificate that encrypts your users' data (the padlock next to the web address) is an absolute standard in every deployment I do.",
    },
  },
  {
    q: {
      pl: "Czy pomagasz z wyborem i podpięciem serwera oraz domeny?",
      en: "Do you help with choosing and setting up hosting and a domain?",
    },
    a: {
      pl: "Tak, nie musisz się znać na strefach DNS czy bazach danych. W ramach każdego pakietu pomagam w wyborze najkorzystniejszego rejestratora domeny oraz konfiguruję darmowy lub komercyjny hosting, optymalny dla specyfiki Twojego projektu.",
      en: "Yes — you don't need to know anything about DNS zones or databases. As part of every package I help you pick the best domain registrar and configure free or commercial hosting that fits the specifics of your project.",
    },
  },
  {
    q: {
      pl: "O co chodzi z „nieszablonowymi animacjami” w wyższych pakietach?",
      en: "What are the custom animations in the higher packages all about?",
    },
    a: {
      pl: "Zamiast standardowej, nieruchomej wizytówki, tworzę interaktywne doświadczenia. Elementy strony płynnie reagują na to, jak użytkownik przesuwa kółkiem myszy (scrolluje) i gdzie najeżdża kursorem. Zwiększa to zaangażowanie i nadaje stronie bardzo nowoczesny, „filmowy” charakter.",
      en: "Instead of a standard, static business-card website, I create interactive experiences. Page elements respond smoothly to how the user scrolls and where the cursor moves. This increases engagement and gives the website a very modern, cinematic feel.",
    },
  },
  {
    q: {
      pl: "Nie mam logo ani identyfikacji wizualnej. Pomożesz?",
      en: "I don't have a logo or visual identity. Can you help?",
    },
    a: {
      pl: "Specjalizuję się w tworzeniu interfejsów, animacji oraz kodowaniu. Jeśli nie masz logo, mogę zastosować prostą, estetyczną formę typograficzną lub skontaktować Cię z zaufanym grafikiem, który zaprojektuje dla Ciebie pełną księgę znaku.",
      en: "My specialty is interfaces, animation and code. If you don't have a logo, I can use a simple, elegant typographic form instead — or put you in touch with a trusted graphic designer who will create a full brand book for you.",
    },
  },
  {
    q: {
      pl: "Co z materiałami wideo i audio? Skąd je wziąć?",
      en: "What about video and audio materials? Where do they come from?",
    },
    a: {
      pl: "Jako twórca kreatywny dysponuję własnym, profesjonalnie przygotowanym studiem. Mogę zaoferować nie tylko montaż, ale również produkcję wysokiej jakości wizerunkowego materiału wideo na stronę, a także stworzyć dedykowaną, autorską oprawę dźwiękową, która wyróżni Twoją markę.",
      en: "As a creative professional I have my own, professionally equipped studio. I can offer not only editing, but also the production of high-quality brand video for your website, as well as a custom, original soundtrack that will set your brand apart.",
    },
  },
  {
    q: {
      pl: "Czy na stronie będzie możliwość zmiany języka (np. na angielski)?",
      en: "Can the website support switching languages (e.g. to English)?",
    },
    a: {
      pl: "Tak, jeśli tylko zgłosisz taką potrzebę przed rozpoczęciem prac graficznych, zaprojektuję architekturę umożliwiającą łatwe przełączanie wersji językowych (podobnie jak na moim własnym portfolio).",
      en: "Yes — as long as you mention it before the design work begins, I will architect the website so language versions can be switched easily (just like on my own portfolio).",
    },
  },
  {
    q: {
      pl: "Skąd bierzemy zdjęcia, jeśli nie mam własnych?",
      en: "Where do the photos come from if I don't have my own?",
    },
    a: {
      pl: "Mamy kilka opcji. Mogę zająć się sesją zdjęciową Twoich produktów/usług, możemy wykorzystać starannie wyselekcjonowane i w 100% legalne banki zdjęć (stocki) premium, lub wygenerować unikalne ilustracje przy pomocy zaawansowanych narzędzi AI.",
      en: "We have a few options. I can handle a photo shoot of your products or services, we can use carefully selected, 100% licensed premium stock photography, or generate unique illustrations with advanced AI tools.",
    },
  },
  {
    q: {
      pl: "Czy po oddaniu strony będzie ona widoczna w Google?",
      en: "Will the website be visible in Google after handover?",
    },
    a: {
      pl: "Tak, każda witryna wychodząca spod moich rąk jest w pełni zoptymalizowana pod kątem tzw. technicznego SEO. Oznacza to odpowiednią semantykę kodu, bezbłędne tagi i ultraszybki czas ładowania. To doskonała baza, aby Twoja strona od pierwszego dnia punktowała wysoko w wyszukiwarkach.",
      en: "Yes — every website that leaves my hands is fully optimised for technical SEO. That means proper code semantics, flawless tags and ultra-fast load times. It's an excellent foundation for your website to score high in search engines from day one.",
    },
  },
  {
    q: {
      pl: "Czy zajmujesz się również pozycjonowaniem i płatnymi reklamami?",
      en: "Do you also handle SEO positioning and paid ads?",
    },
    a: {
      pl: "Moim zadaniem jest stworzyć perfekcyjne technologicznie narzędzie biznesowe, gotowe do działań marketingowych. Samo długofalowe pozycjonowanie na konkretne słowa kluczowe (tworzenie linków, artykułów sponsorowanych) polecam powierzyć wyspecjalizowanej agencji SEO.",
      en: "My job is to build a technologically flawless business tool that is ready for marketing. Long-term positioning for specific keywords (link building, sponsored articles) is something I recommend entrusting to a specialised SEO agency.",
    },
  },
  {
    q: {
      pl: "Chcę uruchomić sprzedaż internetową, ale nie od razu. Czy stronę da się rozbudować?",
      en: "I want to sell online, but not right away. Can the website be extended later?",
    },
    a: {
      pl: "Architekturę tworzonych przeze mnie witryn buduję zawsze z myślą o przyszłości. Jeśli wystartujemy z pakietu wizerunkowego, nic nie stoi na przeszkodzie, aby za kilka miesięcy dobudować do niej w pełni funkcjonalny moduł e-commerce, system płatności czy autorski konfigurator.",
      en: "I always architect my websites with the future in mind. If we start with a brand-focused package, nothing stops us from adding a fully functional e-commerce module, a payment system or a custom configurator a few months later.",
    },
  },
  {
    q: {
      pl: "Czy podepniesz pod stronę narzędzia analityczne?",
      en: "Will you connect analytics tools to the website?",
    },
    a: {
      pl: "Tak, na Twoje życzenie zintegruję stronę z narzędziami takimi jak Google Analytics, Google Search Console czy Meta Pixel, abyś miał pełen wgląd w to, kto odwiedza Twoją witrynę i co na niej robi.",
      en: "Yes — on request I will integrate the website with tools such as Google Analytics, Google Search Console or Meta Pixel, so you have full insight into who visits your website and what they do there.",
    },
  },
  {
    q: {
      pl: "Jak wyglądają płatności za projekt?",
      en: "How do payments for the project work?",
    },
    a: {
      pl: "Ze względu na zaangażowanie czasowe, rozliczenie zazwyczaj dzielę na dwie części: zadatek (np. 30-40%) płatny przed rozpoczęciem prac oraz pozostała kwota regulowana dopiero po Twojej akceptacji i opublikowaniu gotowej strony pod adresem docelowym.",
      en: "Because of the time involved, I usually split the payment into two parts: a deposit (e.g. 30-40%) paid before the work begins, and the remaining amount settled only after your approval, once the finished website is published at its target address.",
    },
  },
  {
    q: {
      pl: "Czy wystawiasz faktury?",
      en: "Do you issue invoices?",
    },
    a: {
      pl: "Oczywiście. Na każdą wykonaną usługę i wszystkie etapy prac wystawiam fakturę. Podane w ofercie pakiety to ceny netto.",
      en: "Of course. I issue an invoice for every service and every stage of the work. The package prices listed in the offer are net prices.",
    },
  },
  {
    q: {
      pl: "Co się stanie, jeśli po upływie miesiąca darmowego wsparcia coś przestanie działać?",
      en: "What happens if something breaks after the free month of support ends?",
    },
    a: {
      pl: "Technologie webowe się rozwijają, a standardy ulegają zmianom. Nawet jeśli minie darmowy miesiąc opieki, nie zostawiam Cię na lodzie. Zawsze możesz zgłosić się z problemem – ewentualne interwencje lub aktualizacje systemów zewnętrznych wyceniam wtedy na podstawie przejrzystej stawki godzinowej.",
      en: "Web technologies evolve and standards change. Even after the free month of care is over, I won't leave you out in the cold. You can always come to me with a problem — any interventions or third-party system updates are then billed at a transparent hourly rate.",
    },
  },
  {
    q: {
      pl: "Czy mogę zlecić Ci stałą opiekę nad stroną?",
      en: "Can I hire you for ongoing website maintenance?",
    },
    a: {
      pl: "Tak, to bardzo popularny model współpracy. Oferuję długoterminowe pakiety utrzymaniowe (maintenance), w ramach których regularnie monitoruję wydajność, aktualizuję technologie, wykonuję kopie zapasowe i priorytetowo wprowadzam przesłane przez Ciebie mniejsze zmiany w treściach.",
      en: "Yes, it's a very popular way of working together. I offer long-term maintenance packages under which I regularly monitor performance, keep the technology up to date, run backups and prioritise the smaller content changes you send my way.",
    },
  },
  {
    q: {
      pl: "Czy strona będzie zgodna z przepisami prawa i RODO?",
      en: "Will the website comply with the law and GDPR?",
    },
    a: {
      pl: "Na etapie projektowym uwzględniam wszystkie aspekty zgodności z prawem (tzw. privacy by design). Wdrażam system zarządzania ciasteczkami (cookies), który blokuje kody śledzące do momentu wyrażenia zgody przez użytkownika, oraz umieszczam udostępnioną przez Ciebie Politykę Prywatności i Regulaminy.",
      en: "I take every legal compliance aspect into account at the design stage (privacy by design). I implement a cookie consent system that blocks tracking codes until the user gives consent, and I publish the Privacy Policy and Terms you provide.",
    },
  },
];
