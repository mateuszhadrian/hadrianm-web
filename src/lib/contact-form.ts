// Logika formularza kontaktowego — czysty TS, bez zależności od runtime'u
// Workers. Konsumenci: functions/api/kontakt.ts (Pages Function) i testy
// unit. Kontrakt endpointu i treści maili:
// docs/contact-me-form-analysis-implementation.md §4–§5.

export const CONTACT_TO = "info@hadrianm.pl";
export const CONTACT_FROM_NOTIFY =
  "Formularz hadrianm.pl <no-reply@hadrianm.pl>";
export const CONTACT_FROM_CONFIRM = "Mateusz Hadrian <no-reply@hadrianm.pl>";

export const MIN_FILL_MS = 4000;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

// Ta sama reguła co walidacja kliencka (referencja kontakt.js).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Chipsy tematu = nazwy pakietów z Oferty (services.pk*.name w ui.ts,
// PL i EN) + „inny temat". Wartość spoza listy jest ignorowana, nie
// odrzucana (kontrakt §4.2).
export const TOPICS = [
  "Start",
  "Wizerunek",
  "Biznes",
  "Inny temat",
  "Image",
  "Business",
  "Other",
] as const;

export type ContactLang = "pl" | "en";

/** Surowe pola z multipart/form-data (zawsze stringi, mogą być puste). */
export interface ContactRaw {
  name: string;
  email: string;
  temat: string;
  message: string;
  firma: string;
  elapsed: string;
  lang: string;
}

export interface ContactData {
  name: string;
  email: string;
  /** "" gdy nie wybrano albo wartość spoza TOPICS. */
  temat: string;
  message: string;
  lang: ContactLang;
}

/**
 * Pułapka na boty: honeypot `firma` niepusty LUB `elapsed` < MIN_FILL_MS.
 * Brak/niesparsowalny `elapsed` = POST z pominięciem naszego JS = bot.
 */
export function isBotTrap(raw: Pick<ContactRaw, "firma" | "elapsed">): boolean {
  if (raw.firma !== "") return true;
  const elapsed = Number(raw.elapsed);
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
}

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; field: "name" | "email" | "message" };

export function validateSubmission(raw: ContactRaw): ValidationResult {
  const name = raw.name.trim();
  const email = raw.email.trim();
  const message = raw.message.trim();

  if (name.length === 0 || name.length > NAME_MAX) {
    return { ok: false, field: "name" };
  }
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return { ok: false, field: "email" };
  }
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return { ok: false, field: "message" };
  }

  const tematRaw = raw.temat.trim();
  const temat = (TOPICS as readonly string[]).includes(tematRaw)
    ? tematRaw
    : "";
  const lang: ContactLang = raw.lang === "en" ? "en" : "pl";

  return { ok: true, data: { name, email, temat, message, lang } };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Do Subject: jedna linia (porządek w temacie, nie mechanizm security). */
export function stripNewlines(s: string): string {
  return s.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

function quoteText(message: string): string {
  return message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Mail #1 — powiadomienie do skrzynki info@. Format wg D10: czytelnie,
 * bez ozdób; najważniejsze to OD KOGO i NA JAKI ADRES odpisać (samą
 * odpowiedź załatwia Reply-To ustawiane przez endpoint).
 */
export function buildNotifyEmail(
  data: ContactData,
  sentAt: string,
): EmailContent {
  const name = stripNewlines(data.name);
  const subject = data.temat
    ? `[hadrianm.pl] ${data.temat}: wiadomość od ${name}`
    : `[hadrianm.pl] wiadomość od ${name}`;

  const text = [
    "Nowa wiadomość z formularza na hadrianm.pl",
    "",
    `Od: ${name}`,
    `E-mail (odpowiedz na ten adres): ${data.email}`,
    `Temat: ${data.temat || "—"}`,
    `Język strony: ${data.lang}`,
    `Data: ${sentAt}`,
    "",
    "Wiadomość:",
    data.message,
  ].join("\n");

  const html = [
    "<p>Nowa wiadomość z formularza na hadrianm.pl</p>",
    `<p><strong>Od:</strong> ${escapeHtml(name)}<br>`,
    `<strong>E-mail (odpowiedz na ten adres):</strong> ${escapeHtml(data.email)}<br>`,
    `<strong>Temat:</strong> ${escapeHtml(data.temat || "—")}<br>`,
    `<strong>Język strony:</strong> ${data.lang}<br>`,
    `<strong>Data:</strong> ${escapeHtml(sentAt)}</p>`,
    `<div style="white-space:pre-wrap;border-top:1px solid #ccc;padding-top:12px">${escapeHtml(data.message)}</div>`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Mail #2 — auto-potwierdzenie do nadawcy, w języku strony. Subject jest
 * STAŁY (treść użytkownika nie steruje tematem — §5.5); jego wiadomość
 * pojawia się wyłącznie jako oznaczony cytat.
 */
export function buildConfirmEmail(data: ContactData): EmailContent {
  const name = stripNewlines(data.name);

  if (data.lang === "en") {
    const subject = "Thanks for your message — hadrianm.pl";
    const text = [
      `Hi ${name},`,
      "",
      "Thank you for your message sent via the form at hadrianm.pl — it has",
      "just reached me. I reply within 24 hours on business days, and usually",
      "much sooner for quick questions.",
      "",
      `A copy of your message${data.temat ? ` (topic: ${data.temat})` : ""}:`,
      quoteText(data.message),
      "",
      "Best regards",
      "Mateusz Hadrian",
      "https://hadrianm.pl",
      "",
      "—",
      "This is an automated confirmation. If you did not fill in the form at",
      "hadrianm.pl, please ignore this email — your address will not be",
      "stored or added to any list.",
    ].join("\n");
    const html = [
      `<p>Hi ${escapeHtml(name)},</p>`,
      "<p>Thank you for your message sent via the form at hadrianm.pl — it has just reached me. I reply within 24 hours on business days, and usually much sooner for quick questions.</p>",
      `<p>A copy of your message${data.temat ? ` (topic: ${escapeHtml(data.temat)})` : ""}:</p>`,
      `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;margin:0;padding-left:12px">${escapeHtml(data.message)}</blockquote>`,
      '<p>Best regards<br>Mateusz Hadrian<br><a href="https://hadrianm.pl">hadrianm.pl</a></p>',
      '<p style="color:#777;font-size:12px">This is an automated confirmation. If you did not fill in the form at hadrianm.pl, please ignore this email — your address will not be stored or added to any list.</p>',
    ].join("\n");
    return { subject, html, text };
  }

  const subject = "Dziękuję za wiadomość — hadrianm.pl";
  const text = [
    `Cześć ${name},`,
    "",
    "dziękuję za wiadomość wysłaną przez formularz na hadrianm.pl — właśnie",
    "do mnie dotarła. Odpowiadam najpóźniej w ciągu 24 godzin (w dni",
    "robocze), a na szybkie pytania zwykle od ręki.",
    "",
    `Kopia Twojej wiadomości${data.temat ? ` (temat: ${data.temat})` : ""}:`,
    quoteText(data.message),
    "",
    "Pozdrawiam",
    "Mateusz Hadrian",
    "https://hadrianm.pl",
    "",
    "—",
    "Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty",
    "wypełniłeś(-aś) formularz na hadrianm.pl, zignoruj ją — Twój adres nie",
    "zostanie zapisany ani dodany do żadnej listy.",
  ].join("\n");
  const html = [
    `<p>Cześć ${escapeHtml(name)},</p>`,
    "<p>dziękuję za wiadomość wysłaną przez formularz na hadrianm.pl — właśnie do mnie dotarła. Odpowiadam najpóźniej w ciągu 24 godzin (w dni robocze), a na szybkie pytania zwykle od ręki.</p>",
    `<p>Kopia Twojej wiadomości${data.temat ? ` (temat: ${escapeHtml(data.temat)})` : ""}:</p>`,
    `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;margin:0;padding-left:12px">${escapeHtml(data.message)}</blockquote>`,
    '<p>Pozdrawiam<br>Mateusz Hadrian<br><a href="https://hadrianm.pl">hadrianm.pl</a></p>',
    '<p style="color:#777;font-size:12px">Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty wypełniłeś(-aś) formularz na hadrianm.pl, zignoruj ją — Twój adres nie zostanie zapisany ani dodany do żadnej listy.</p>',
  ].join("\n");
  return { subject, html, text };
}
