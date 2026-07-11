// Sekcja „Kontakt" — logika ZAWSZE aktywna (niezależna od
// prefers-reduced-motion): reveal danych kontaktowych, chipsy tematu,
// walidacja, wysyłka z tokenem Turnstile, ekran potwierdzenia.
// Port kontakt.js z referencji docs/design/kontakt-referencja/;
// kontrakt endpointu: docs/contact-me-form-analysis-implementation.md §4.
//
// Reguły walidacji (EMAIL_RE, MESSAGE_MIN, MIN_FILL_MS) importowane z
// src/lib/contact-form.ts — jedno źródło prawdy dla klienta i serwera.
// Teksty UI (etykiety [ KOPIUJ ] / „Wysyłam…") przychodzą przez
// data-atrybuty z Contact.astro — moduł nie zna i18n.
import { EMAIL_RE, MESSAGE_MIN, MIN_FILL_MS } from "@/lib/contact-form";
import {
  CONTACT_ENDPOINT,
  TURNSTILE_SITE_KEY,
  TURNSTILE_SRC,
  TURNSTILE_TIMEOUT_MS,
} from "./contact-config";

/* ── e-mail i telefon NIE istnieją w bundle'u w całości — składane z
   fragmentów dopiero w handlerze kliknięcia (antyscraping; testy e2e
   grepują bundle o pełne ciągi). ── */
const FR = { e: ["info", "hadrianm", "pl"], p: [48, 783, 983, 600] };
const buildEmail = () =>
  FR.e[0] + String.fromCharCode(64) + FR.e[1] + "." + FR.e[2];
const buildPhone = (sep: string) => "+" + FR.p.join(sep);

/* ── Turnstile: skrypt ładowany leniwie (pierwszy focus w formularzu),
   widget renderowany jawnie, egzekucja dopiero przy submit (token żyje
   300 s — render przy wejściu mógłby wygasnąć, zanim ktoś dopisze
   wiadomość). Brak skryptu/timeout → token "" → serwer odpowie 403 →
   komunikat .kt-srv z fallbackiem „napisz bezpośrednio". ── */
interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  execute(el: HTMLElement): void;
  reset(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoad: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      turnstileLoad = null;
      reject(new Error("turnstile: skrypt nie wstał"));
    };
    document.head.appendChild(s);
  });
  return turnstileLoad;
}

export function initContactUi(section: HTMLElement): void {
  initReveal(section);
  initForm(section);
  initFooterTop(section);
}

/* ── 1. reveal danych: [ POKAŻ ] → wartość + link, potem [ KOPIUJ ] ── */
function initReveal(section: HTMLElement): void {
  for (const rev of section.querySelectorAll<HTMLElement>(".kt-rev")) {
    const kind = rev.getAttribute("data-kind");
    const val = rev.querySelector<HTMLElement>(".kt-val");
    const act = rev.querySelector<HTMLButtonElement>(".kt-act");
    if (!val || !act) continue;
    let value = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    act.addEventListener("click", () => {
      if (!rev.classList.contains("open")) {
        /* pierwsze kliknięcie: złóż + pokaż + podlinkuj */
        value = kind === "email" ? buildEmail() : buildPhone(" ");
        const href =
          kind === "email" ? `mailto:${value}` : `tel:${buildPhone("")}`;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = value;
        val.textContent = "";
        val.appendChild(link);
        rev.classList.add("open");
        act.textContent = act.dataset.copy ?? "[ KOPIUJ ]";
        act.setAttribute("aria-label", act.dataset.ariaCopy ?? "");
        return;
      }
      /* kolejne kliknięcia: kopiuj (feedback także gdy Clipboard API
         odmówi — użytkownik i tak widzi już wartość) */
      const done = () => {
        act.textContent = act.dataset.copied ?? "[ SKOPIOWANO ]";
        act.classList.add("ok");
        clearTimeout(timer);
        timer = setTimeout(() => {
          act.textContent = act.dataset.copy ?? "[ KOPIUJ ]";
          act.classList.remove("ok");
        }, 1900);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, done);
      } else {
        done();
      }
    });
  }
}

/* ── 2. formularz: walidacja → pułapki → Turnstile → POST ── */
function initForm(section: HTMLElement): void {
  const frame = section.querySelector<HTMLElement>(".kt-frame");
  const form = section.querySelector<HTMLFormElement>(".kt-form");
  if (!frame || !form) return;

  const q = <T extends HTMLElement>(s: string) => form.querySelector<T>(s);
  const sendBtn = q<HTMLButtonElement>(".kt-send");
  const sendLb = sendBtn?.querySelector<HTMLElement>(".lb");
  const srvErr = q<HTMLElement>(".kt-srv");
  const tsBox = q<HTMLElement>(".kt-ts");
  const fName = q<HTMLElement>('[data-f="name"]');
  const fMail = q<HTMLElement>('[data-f="email"]');
  const fMsg = q<HTMLElement>('[data-f="msg"]');
  const iName = q<HTMLInputElement>("#kt-name");
  const iMail = q<HTMLInputElement>("#kt-email");
  const iMsg = q<HTMLTextAreaElement>("#kt-msg");
  const hp = q<HTMLInputElement>('[name="firma"]');
  if (
    !sendBtn ||
    !sendLb ||
    !srvErr ||
    !tsBox ||
    !fName ||
    !fMail ||
    !fMsg ||
    !iName ||
    !iMail ||
    !iMsg ||
    !hp
  ) {
    return;
  }

  /* honeypot jest readonly (autofill Chrome'a nie wypełnia readonly —
     naprawa incydentu z preview, patrz komentarz w Contact.astro); focus
     zdejmuje blokadę, żeby bot piszący „po ludzku" nadal się łapał */
  hp.addEventListener("focus", () => hp.removeAttribute("readonly"), {
    once: true,
  });

  let t0 = Date.now();
  let busy = false;
  let widgetId: string | null = null;
  let tokenResolve: ((token: string) => void) | null = null;

  /* rozgrzewka: skrypt Turnstile dociąga się, gdy ktoś zaczyna pisać */
  form.addEventListener("focusin", () => void loadTurnstile().catch(() => {}), {
    once: true,
  });

  function renderWidget(): void {
    if (!window.turnstile || widgetId !== null || !tsBox) return;
    widgetId = window.turnstile.render(tsBox, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: "interaction-only",
      execution: "execute",
      callback: (token: string) => {
        tokenResolve?.(token);
        tokenResolve = null;
      },
      "error-callback": () => {
        tokenResolve?.("");
        tokenResolve = null;
      },
    });
  }

  async function getToken(): Promise<string> {
    try {
      await loadTurnstile();
      renderWidget();
      if (widgetId === null || !tsBox) return "";
    } catch {
      return "";
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        tokenResolve = null;
        resolve("");
      }, TURNSTILE_TIMEOUT_MS);
      tokenResolve = (token) => {
        clearTimeout(timer);
        resolve(token);
      };
      try {
        window.turnstile?.execute(tsBox as HTMLElement);
      } catch {
        clearTimeout(timer);
        tokenResolve = null;
        resolve("");
      }
    });
  }

  function resetTurnstile(): void {
    if (widgetId !== null) {
      try {
        window.turnstile?.reset(widgetId);
      } catch {
        /* widget mógł zniknąć — nieistotne */
      }
    }
  }

  function setErr(wrap: HTMLElement, on: boolean): void {
    wrap.classList.toggle("err", on);
    const input = wrap.querySelector("input, textarea");
    input?.setAttribute("aria-invalid", on ? "true" : "false");
  }
  for (const wrap of [fName, fMail, fMsg]) {
    wrap
      .querySelector("input, textarea")
      ?.addEventListener("input", () => setErr(wrap, false));
  }

  /* chipsy: klasa .sel (niezależnie od :has) */
  for (const radio of form.querySelectorAll<HTMLInputElement>(
    ".kt-chip input",
  )) {
    radio.addEventListener("change", () => {
      for (const chip of form.querySelectorAll(".kt-chip")) {
        chip.classList.remove("sel");
      }
      radio.closest(".kt-chip")?.classList.add("sel");
    });
  }

  function setBusy(on: boolean): void {
    busy = on;
    sendBtn!.disabled = on;
    form!.setAttribute("aria-busy", on ? "true" : "false");
    sendLb!.textContent = on
      ? (sendBtn!.dataset.sending ?? "…")
      : (sendBtn!.dataset.send ?? "");
  }

  function showDone(): void {
    frame!.classList.add("sent");
    frame!
      .querySelector<HTMLElement>(".kt-done h3")
      ?.focus({ preventScroll: true });
  }

  async function handleSubmit(): Promise<void> {
    if (busy) return;

    const okName = iName!.value.trim().length > 0;
    const okMail = EMAIL_RE.test(iMail!.value.trim());
    const okMsg = iMsg!.value.trim().length >= MESSAGE_MIN;
    setErr(fName!, !okName);
    setErr(fMail!, !okMail);
    setErr(fMsg!, !okMsg);
    if (!okName || !okMail || !okMsg) {
      form!.querySelector<HTMLElement>(".err input, .err textarea")?.focus();
      return;
    }

    /* pułapki po stronie klienta: honeypot lub submit < MIN_FILL_MS →
       udawany sukces bez requestu (serwer i tak powtarza test) */
    if (hp!.value !== "" || Date.now() - t0 < MIN_FILL_MS) {
      showDone();
      return;
    }

    srvErr!.hidden = true;
    setBusy(true);
    try {
      const token = await getToken();
      const fd = new FormData(form!);
      fd.append("elapsed", String(Date.now() - t0));
      fd.append("lang", document.documentElement.lang === "en" ? "en" : "pl");
      fd.append("cf-turnstile-response", token);
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showDone();
    } catch {
      srvErr!.hidden = false;
    } finally {
      setBusy(false);
      resetTurnstile();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void handleSubmit();
  });

  /* [ Wyślij kolejną ]: reset formularza i zegara antyspamu */
  frame
    .querySelector<HTMLButtonElement>(".kt-done .again")
    ?.addEventListener("click", () => {
      form.reset();
      for (const chip of form.querySelectorAll(".kt-chip")) {
        chip.classList.remove("sel");
      }
      for (const wrap of [fName!, fMail!, fMsg!]) setErr(wrap, false);
      srvErr!.hidden = true;
      frame.classList.remove("sent");
      t0 = Date.now();
      iName!.focus({ preventScroll: true });
    });
}

/* ── 3. „Do góry ↑" — Lenis jak w navbarze/FAQ, fallback natywny ── */
function initFooterTop(section: HTMLElement): void {
  section
    .querySelector<HTMLAnchorElement>(".kt-fleg .up")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      history.replaceState(null, "", window.location.pathname);
    });
}
