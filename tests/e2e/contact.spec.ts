// Sekcja „Kontakt": reveal danych (antyscraping), walidacja, chipsy,
// pułapki antyspamowe (honeypot / submit < 4 s = udawany sukces BEZ
// requestu), wysyłka z mockiem endpointu (200 → .sent, 500 → .kt-srv),
// fallbacki reduce/no-JS. Checklista: docs/design/kontakt-referencja/
// README.md; kontrakt endpointu: docs/contact-me-form-analysis-implementation.md §4.
//
// Turnstile jest STUBOWANY (route na challenges.cloudflare.com → atrapa
// window.turnstile) — testy deterministyczne i offline; prawdziwy widget
// weryfikuje Etap 4 na preview PR-a. Endpoint /api/kontakt jest MOCKOWANY
// przez page.route — astro preview nie serwuje Pages Functions; żywotność
// produkcyjną sprawdza sonda @prod-smoke w smoke.spec.ts.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { CONTACT_DESKTOP_MIN_PX } from "../../src/components/sections/contact/contact-config";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

const STUB_TOKEN = "e2e-turnstile-stub-token";

/* ── ster zegara antyspamu: contact-ui.ts liczy elapsed z Date.now()
   (próg MIN_FILL_MS = 4000 od initu strony). Wyścig z REALNYM czasem
   flake'ował na CI (wolny runner webkit: networkidle + scroll + fill
   przekraczały 4 s i „za szybki" submit przestawał być za szybki) —
   shim z przestawnym offsetem czyni obie strony progu deterministycznymi:
   skew −10⁷ ms = pułapka NA PEWNO wpada, +10⁷ ms = próg NA PEWNO minięty.
   Offset jest stały między zmianami, więc nie rozjeżdża timerów UI. ── */
const SKEW_TRAP_MS = -10_000_000;
const SKEW_PASS_MS = 10_000_000;

async function installClockSkew(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const real = Date.now.bind(Date);
    const w = window as unknown as { __skewMs: number };
    w.__skewMs = 0;
    Date.now = () => real() + w.__skewMs;
  });
}

function setClockSkew(page: Page, ms: number): Promise<void> {
  return page.evaluate((v) => {
    (window as unknown as { __skewMs: number }).__skewMs = v;
  }, ms);
}

/** Atrapa Turnstile: skrypt ładowany leniwie przez contact-ui.ts (pierwszy
 *  focus w formularzu) dostaje z route'a implementację, która na execute()
 *  natychmiast oddaje stały token. */
async function stubTurnstile(page: Page): Promise<void> {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile = {
        _cb: null,
        render(el, opts) { this._cb = opts.callback; return "stub-widget"; },
        execute() { const cb = this._cb; queueMicrotask(() => cb && cb(${JSON.stringify(STUB_TOKEN)})); },
        reset() {},
      };`,
    }),
  );
}

/** Mock endpointu + licznik requestów (pułapki assertują ZERO wywołań). */
async function mockEndpoint(
  page: Page,
  respond: (n: number) => { status: number; delayMs?: number },
): Promise<{ count: () => number; bodies: string[] }> {
  let n = 0;
  const bodies: string[] = [];
  await page.route("**/api/kontakt", async (route) => {
    n += 1;
    bodies.push(route.request().postData() ?? "");
    const { status, delayMs } = respond(n);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status, body: status === 200 ? "OK" : "ERR" });
  });
  return { count: () => n, bodies };
}

async function gotoContact(page: Page, path = "/"): Promise<void> {
  await gotoReady(page, path);
  await page.locator("#contact .kt-frame").scrollIntoViewIfNeeded();
  // Wejścia (klasy .on z progów ScrollTriggera) muszą usiąść przed interakcją.
  await settle(page, 800);
}

async function fillForm(
  page: Page,
  over: { name?: string; email?: string; message?: string } = {},
): Promise<void> {
  await page.fill("#kt-name", over.name ?? "Anna Testowa");
  await page.fill("#kt-email", over.email ?? "anna.testowa@example.com");
  await page.fill(
    "#kt-msg",
    over.message ?? "Wiadomość testowa z Playwrighta — co najmniej 10 znaków.",
  );
}

const frame = (page: Page) => page.locator("#contact .kt-frame");
const submitBtn = (page: Page) => page.locator("#contact .kt-send");

test("walidacja: pusty submit → 3 błędy + fokus na Imię; wpisywanie czyści; zły e-mail", async ({
  page,
}) => {
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Pusty submit: 3 pola z błędem, aria-invalid, fokus na pierwszym błędnym.
  await submitBtn(page).click();
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(3);
  await expect(page.locator("#kt-name")).toBeFocused();
  await expect(page.locator("#kt-name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#kt-msg")).toHaveAttribute("aria-invalid", "true");

  // Wpisanie w pole czyści JEGO błąd (pozostałe zostają).
  await page.fill("#kt-name", "Anna");
  await expect(page.locator("#kt-name")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(2);

  // Zły e-mail (bez TLD) → błąd tylko na e-mailu.
  await fillForm(page, { email: "abc@x" });
  await submitBtn(page).click();
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(1);
  await expect(page.locator("#kt-email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#kt-email")).toBeFocused();

  // Walidacja kliencka NIE wypuściła żadnego requestu.
  expect(mock.count()).toBe(0);
});

test("chipsy tematu: wybór przenosi .sel, jedno zaznaczenie naraz", async ({
  page,
}) => {
  await gotoContact(page);
  const chips = page.locator("#contact .kt-chip");
  await expect(chips).toHaveCount(4);
  await expect(page.locator("#contact .kt-chip.sel")).toHaveCount(0);

  await chips.nth(1).click();
  await expect(chips.nth(1)).toHaveClass(/sel/);
  await expect(page.locator("#contact .kt-chip.sel")).toHaveCount(1);
  await expect(chips.nth(1).locator("input")).toBeChecked();

  await chips.nth(3).click();
  await expect(chips.nth(3)).toHaveClass(/sel/);
  await expect(chips.nth(1)).not.toHaveClass(/sel/);
  await expect(page.locator("#contact .kt-chip.sel")).toHaveCount(1);
});

test("pułapka: submit < 4 s od załadowania → potwierdzenie BEZ requestu", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  await fillForm(page);
  // Cofnięty zegar = elapsed na pewno poniżej progu (deterministycznie,
  // bez wyścigu z czasem ładowania na wolnych runnerach).
  await setClockSkew(page, SKEW_TRAP_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-done h3")).toBeVisible();
  expect(mock.count()).toBe(0);
});

test("pułapka: wypełniony honeypot → potwierdzenie BEZ requestu (mimo odczekania)", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Strażnik regresu autofillu: honeypot MUSI startować jako readonly
  // (Chrome nie autofilluje pól readonly — incydent z preview, Etap 4),
  // a focus „po bocie" zdejmuje blokadę, żeby pułapka dalej łapała.
  const hp = page.locator("#kt-firma");
  await expect(hp).toHaveAttribute("readonly");
  await page.evaluate(() =>
    document.querySelector<HTMLInputElement>("#kt-firma")?.focus(),
  );
  await expect(hp).not.toHaveAttribute("readonly");

  // Honeypot jest poza ekranem (left: -9999px) — wartość wchodzi jak u bota,
  // wprost w DOM (fill() wymagałby widoczności).
  await page.evaluate(() => {
    const el = document.querySelector<HTMLInputElement>("#kt-firma");
    if (el) el.value = "Bot Sp. z o.o.";
  });
  await fillForm(page);
  // Zegar przestawiony ZA próg antyspamu — izoluje pułapkę honeypota od
  // pułapki „za szybko".
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(0);
});

test("mock 200: wysyłka → .sent + fokus na h3; payload ma lang, elapsed i token Turnstile", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  await fillForm(page);
  await page.locator("#contact .kt-chip").first().click();
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-done h3")).toBeFocused();
  expect(mock.count()).toBe(1);

  // Kontrakt endpointu (§4.2): pola z formularza + dokładane przez skrypt.
  const body = mock.bodies[0];
  expect(body).toContain('name="name"');
  expect(body).toContain("anna.testowa@example.com");
  expect(body).toContain('name="temat"');
  expect(body).toContain('name="firma"');
  expect(body).toContain(STUB_TOKEN);
  expect(body).toMatch(/name="lang"\r\n\r\npl/);
  const elapsed = Number(/name="elapsed"\r\n\r\n(\d+)/.exec(body)?.[1]);
  expect(elapsed).toBeGreaterThanOrEqual(4000);
});

test("mock 500: w trakcie disabled + „Wysyłam…”; błąd → .kt-srv, formularz aktywny; ponowna próba → .sent", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  // Pierwszy POST pada (z opóźnieniem — łapiemy stan „w trakcie"), drugi wchodzi.
  const mock = await mockEndpoint(page, (n) =>
    n === 1 ? { status: 500, delayMs: 700 } : { status: 200 },
  );
  await gotoContact(page);

  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  // Stan „w trakcie": przycisk disabled, etykieta z data-sending, aria-busy.
  await expect(submitBtn(page)).toBeDisabled();
  const sending = await submitBtn(page).getAttribute("data-sending");
  await expect(submitBtn(page).locator(".lb")).toHaveText(sending ?? "…");
  await expect(page.locator("#contact .kt-form")).toHaveAttribute(
    "aria-busy",
    "true",
  );

  // 500 → komunikat serwerowy, formularz dalej aktywny (bez .sent).
  await expect(page.locator("#contact .kt-srv")).toBeVisible();
  await expect(frame(page)).not.toHaveClass(/sent/);
  await expect(submitBtn(page)).toBeEnabled();
  const send = await submitBtn(page).getAttribute("data-send");
  await expect(submitBtn(page).locator(".lb")).toHaveText(send ?? "");

  // Ponowny submit (Turnstile zresetowany → świeży token) → sukces.
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-srv")).toBeHidden();
  expect(mock.count()).toBe(2);
});

test("[ Wyślij kolejną ]: reset pól, chipsów i zegara antyspamu", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Pierwsza wysyłka REALNA (zegar za progiem) — po niej [ Wyślij kolejną ].
  await page.locator("#contact .kt-chip").nth(2).click();
  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(1);

  await page.locator("#contact .kt-done .again").click();
  await expect(frame(page)).not.toHaveClass(/sent/);
  await expect(page.locator("#kt-name")).toHaveValue("");
  await expect(page.locator("#kt-email")).toHaveValue("");
  await expect(page.locator("#kt-msg")).toHaveValue("");
  await expect(page.locator("#contact .kt-chip.sel")).toHaveCount(0);
  await expect(page.locator("#kt-name")).toBeFocused();

  // Zegar zresetowany: skew bez zmian, więc elapsed drugiego submitu to
  // tylko czas wypełniania (≪ 4 s) → pułapka „za szybko", .sent BEZ
  // drugiego requestu. Regresja (brak resetu t0) dałaby elapsed ~10⁷ ms
  // i prawdziwy POST — licznik mocka by ją wyłapał.
  await fillForm(page);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(1);
});

const toastOf = (page: Page, type: string) =>
  page.locator(`.toast-region .toast[data-type="${type}"]`);

test("toast warning: pusty submit → toast walidacji; ponowny klik NIE stackuje (dedup)", async ({
  page,
}) => {
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Pusty submit: obok błędów pod polami wyskakuje jeden toast warning.
  await submitBtn(page).click();
  const warn = toastOf(page, "warning");
  await expect(warn).toHaveCount(1);
  await expect(warn.locator(".toast__title")).toHaveText("Uzupełnij formularz");

  // Ponowny pusty submit: klucz dedup → nadal JEDEN toast (bez stackowania).
  await submitBtn(page).click();
  await expect(toastOf(page, "warning")).toHaveCount(1);

  // Walidacja kliencka nie wypuściła requestu.
  expect(mock.count()).toBe(0);
});

test("toast success: wysyłka 200 → toast success obok panelu .sent", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  const ok = toastOf(page, "success");
  await expect(ok).toBeVisible();
  await expect(ok).toHaveAttribute("role", "status");
  await expect(ok.locator(".toast__title")).toHaveText("Wiadomość wysłana");
  expect(mock.count()).toBe(1);
});

test("toast error: mock 500 → toast error (role=alert) obok .kt-srv", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 500 }));
  await gotoContact(page);

  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  // Trwały komunikat serwerowy ORAZ transientny toast error.
  await expect(page.locator("#contact .kt-srv")).toBeVisible();
  const err = toastOf(page, "error");
  await expect(err).toBeVisible();
  await expect(err).toHaveAttribute("role", "alert");
  await expect(frame(page)).not.toHaveClass(/sent/);
  expect(mock.count()).toBe(1);
});

test("reveal e-mail: [ POKAŻ ] → wartość + mailto, [ KOPIUJ ] → [ SKOPIOWANO ] i powrót", async ({
  page,
}) => {
  await gotoContact(page);
  const rev = page.locator('#contact .kt-rev[data-kind="email"]');
  const act = rev.locator(".kt-act");

  // Przed odsłonięciem wartość jest zamaskowana.
  await expect(rev.locator(".kt-val")).toContainText("•");

  await act.click();
  const link = rev.locator(".kt-val a");
  await expect(link).toHaveAttribute("href", "mailto:info@hadrianm.pl");
  await expect(link).toHaveText("info@hadrianm.pl");
  const copyLbl = (await act.getAttribute("data-copy")) ?? "[ KOPIUJ ]";
  await expect(act).toHaveText(copyLbl);

  // Drugi klik: feedback kopiowania (także gdy Clipboard API odmówi) i
  // powrót etykiety po ~1.9 s.
  await act.click();
  await expect(act).toHaveText((await act.getAttribute("data-copied")) ?? "");
  await expect(act).toHaveClass(/ok/);
  await expect(act).toHaveText(copyLbl, { timeout: 3500 });
});

test("reveal telefon: tel: bez spacji, tekst ze spacjami", async ({ page }) => {
  await gotoContact(page);
  const rev = page.locator('#contact .kt-rev[data-kind="phone"]');
  await rev.locator(".kt-act").click();
  const link = rev.locator(".kt-val a");
  await expect(link).toHaveAttribute("href", "tel:+48783983600");
  await expect(link).toHaveText("+48 783 983 600");
});

test("antyscraping: pełny e-mail i telefon nie występują w źródle ani bundlach", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "grep dist jest niezależny od przeglądarki — wystarczy raz",
  );
  const FORBIDDEN = ["info@hadrianm.pl", "783983600", "783 983 600"];

  // HTML serwowany do przeglądarki (przed jakimkolwiek revealem).
  await gotoReady(page);
  const html = await page.content();
  for (const s of FORBIDDEN) expect(html).not.toContain(s);

  // Cały build: HTML + bundle JS/CSS (dynamiczne chunki też).
  const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
  test.skip(!existsSync(dist), "brak dist/ (testy przeciw BASE_URL)");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(html|js|mjs|css|json|txt|xml)$/.test(name)) files.push(p);
    }
  };
  walk(dist.replace(/\/$/, ""));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const s of FORBIDDEN) {
      expect(content.includes(s), `${file} zawiera „${s}"`).toBe(false);
    }
  }
});

test("wersja EN: teksty sekcji + payload z lang=en", async ({ page }) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page, "/en/");

  await expect(page.locator("#contact .kt-lead h2")).toContainText("in touch");
  await expect(submitBtn(page)).toContainText("Send message");
  await expect(
    page.locator('#contact .kt-rev[data-kind="email"] .kt-act'),
  ).toHaveText("[ REVEAL ]");
  await expect(page.locator("#contact .kt-chips .tx").nth(1)).toHaveText(
    "Image",
  );

  await fillForm(page, { message: "English test message from Playwright." });
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-done h3")).toHaveText("Message sent");
  expect(mock.bodies[0]).toMatch(/name="lang"\r\n\r\nen/);
});

test("mobile: meta ukryta, desktop: widoczna", async ({ page }) => {
  await gotoContact(page);
  const width = page.viewportSize()?.width ?? 0;
  const meta = page.locator("#contact .kt-meta");
  if (width < CONTACT_DESKTOP_MIN_PX) {
    await expect(meta).toBeHidden();
  } else {
    await expect(meta).toBeVisible();
  }
});

/* Świadomy, PUNKTOWY wyjątek od zakazu emulacji reduced-motion
   (.claude/rules/testing.md) — ten sam wzorzec co w faq.spec.ts: reguła
   chroni przed testami „przechodzącymi" na martwej stronie, a ten describe
   assertuje ODWROTNOŚĆ — że formularz i reveal przy reduce nadal DZIAŁAJĄ
   (contact-ui.ts ładowany poza bramką motion; wymaganie z referencji). */
test.describe("prefers-reduced-motion: reduce — treść widoczna, funkcje działają", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("sekcja widoczna bez scrolla, reveal i pułapka formularza działają", async ({
    page,
  }) => {
    await installClockSkew(page);
    await stubTurnstile(page);
    const mock = await mockEndpoint(page, () => ({ status: 200 }));
    await page.goto("/", { waitUntil: "networkidle" });

    // Stany startowe wejść bramkuje media query — przy reduce nic nie jest
    // schowane (opacity 1 bez czekania na ScrollTrigger).
    await expect(page.locator("#contact .kt-lead h2")).toBeVisible();
    await expect(frame(page)).toHaveCSS("opacity", "1");

    const rev = page.locator('#contact .kt-rev[data-kind="email"]');
    await rev.locator(".kt-act").click();
    await expect(rev.locator(".kt-val a")).toHaveAttribute(
      "href",
      "mailto:info@hadrianm.pl",
    );

    await fillForm(page);
    await setClockSkew(page, SKEW_TRAP_MS); // pułapka „za szybko" na pewno
    await submitBtn(page).click();
    await expect(frame(page)).toHaveClass(/sent/);
    expect(mock.count()).toBe(0);
  });

  test("toast przy reduce: pojawia się i SAM znika (timer JS, nie animationend)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Przy reduce pasek postępu ma animation:none — auto-znikaniem steruje
    // timer JS (referencja tu nie znikała wcale; świadoma naprawa).
    await page.evaluate(() =>
      (
        window as unknown as {
          __toast?: { info(m: string, o?: { duration?: number }): void };
        }
      ).__toast?.info("Test", { duration: 400 }),
    );
    const t = page.locator(".toast-region .toast");
    await expect(t).toBeVisible();
    // Brak slajdu przy reduce: transform zneutralizowany (matrix tożsamościowy).
    await expect(t).toHaveCSS("transform", "none");
    await expect(t).toHaveCount(0, { timeout: 4000 });
  });
});

test.describe("fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("pełna treść widoczna, dane zamaskowane (świadomy trade-off)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Bez klasy .js na sekcji stany startowe wejść nie są uzbrojone.
    await expect(page.locator("#contact .kt-lead h2")).toBeVisible();
    await expect(page.locator("#contact .kt-form")).toBeVisible();
    await expect(page.locator("#contact .kt-send")).toBeVisible();
    await expect(page.locator("#contact .ft")).toBeVisible();
    // Reveal wymaga JS — wartości zostają zamaskowane, bez pełnych ciągów.
    for (const kind of ["email", "phone"]) {
      await expect(
        page.locator(`#contact .kt-rev[data-kind="${kind}"] .kt-val`),
      ).toContainText("•");
    }
  });
});
