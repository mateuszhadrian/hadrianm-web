// Logika formularza kontaktowego (src/lib/contact-form.ts) — walidacja,
// pułapki na boty, escapowanie i treści maili. Kontrakt:
// docs/contact-me-form-analysis-implementation.md §4–§5.
import { describe, expect, it } from "vitest";
import {
  buildConfirmEmail,
  buildNotifyEmail,
  escapeHtml,
  isBotTrap,
  MESSAGE_MAX,
  NAME_MAX,
  stripNewlines,
  TOPICS,
  validateSubmission,
  type ContactData,
  type ContactRaw,
} from "../../src/lib/contact-form";

const validRaw: ContactRaw = {
  name: "Anna",
  email: "anna@example.com",
  temat: "Wizerunek",
  message: "Chciałabym zapytać o stronę dla mojej pracowni.",
  firma: "",
  elapsed: "12000",
  lang: "pl",
};

const validData: ContactData = {
  name: "Anna",
  email: "anna@example.com",
  temat: "Wizerunek",
  message: "Chciałabym zapytać o stronę dla mojej pracowni.",
  lang: "pl",
};

describe("kontakt: isBotTrap", () => {
  it("czysty submit (pusty honeypot, elapsed ≥ 4000) NIE jest botem", () => {
    expect(isBotTrap({ firma: "", elapsed: "4000" })).toBe(false);
  });

  it("wypełniony honeypot = bot", () => {
    expect(isBotTrap({ firma: "ACME Sp. z o.o.", elapsed: "12000" })).toBe(
      true,
    );
  });

  it("submit szybszy niż 4 s = bot", () => {
    expect(isBotTrap({ firma: "", elapsed: "3999" })).toBe(true);
  });

  it("brak/niesparsowalny elapsed (POST z pominięciem JS) = bot", () => {
    expect(isBotTrap({ firma: "", elapsed: "" })).toBe(true);
    expect(isBotTrap({ firma: "", elapsed: "abc" })).toBe(true);
  });
});

describe("kontakt: validateSubmission", () => {
  it("poprawne zgłoszenie przechodzi i jest znormalizowane (trim)", () => {
    const result = validateSubmission({
      ...validRaw,
      name: "  Anna  ",
      email: " anna@example.com ",
    });
    expect(result).toEqual({ ok: true, data: validData });
  });

  it("puste / za długie imię odpada", () => {
    expect(validateSubmission({ ...validRaw, name: "   " })).toEqual({
      ok: false,
      field: "name",
    });
    expect(
      validateSubmission({ ...validRaw, name: "x".repeat(NAME_MAX + 1) }),
    ).toEqual({ ok: false, field: "name" });
  });

  it("e-mail: ta sama reguła co walidacja kliencka referencji", () => {
    for (const bad of ["abc@x", "abc", "a b@example.com", "a@b.c", ""]) {
      expect(validateSubmission({ ...validRaw, email: bad }), bad).toEqual({
        ok: false,
        field: "email",
      });
    }
    const ok = validateSubmission({ ...validRaw, email: "a.b+c@sub.dom.pl" });
    expect(ok.ok).toBe(true);
  });

  it("wiadomość poza widełkami 10–5000 znaków odpada", () => {
    expect(validateSubmission({ ...validRaw, message: "za krótko" })).toEqual({
      ok: false,
      field: "message",
    });
    expect(
      validateSubmission({
        ...validRaw,
        message: "x".repeat(MESSAGE_MAX + 1),
      }),
    ).toEqual({ ok: false, field: "message" });
  });

  it("temat spoza listy TOPICS jest ignorowany (nie odrzucany)", () => {
    const result = validateSubmission({ ...validRaw, temat: "<script>" });
    expect(result.ok && result.data.temat).toBe("");
    for (const topic of TOPICS) {
      const r = validateSubmission({ ...validRaw, temat: topic });
      expect(r.ok && r.data.temat).toBe(topic);
    }
  });

  it("nieznany lang spada do pl; en zostaje", () => {
    const pl = validateSubmission({ ...validRaw, lang: "de" });
    expect(pl.ok && pl.data.lang).toBe("pl");
    const en = validateSubmission({ ...validRaw, lang: "en" });
    expect(en.ok && en.data.lang).toBe("en");
  });
});

describe("kontakt: escapowanie", () => {
  it("escapeHtml neutralizuje wszystkie znaki specjalne HTML", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;",
    );
  });

  it("stripNewlines skleja wieloliniowy tekst w jedną linię", () => {
    expect(stripNewlines("Anna\r\n Nowak \n")).toBe("Anna Nowak");
  });
});

describe("kontakt: mail #1 (powiadomienie do info@)", () => {
  it("subject zawiera temat i imię; bez tematu — samo imię", () => {
    const withTopic = buildNotifyEmail(validData, "11 lip 2026, 12:00");
    expect(withTopic.subject).toBe(
      "[hadrianm.pl] Wizerunek: wiadomość od Anna",
    );
    const noTopic = buildNotifyEmail(
      { ...validData, temat: "" },
      "11 lip 2026, 12:00",
    );
    expect(noTopic.subject).toBe("[hadrianm.pl] wiadomość od Anna");
  });

  it("subject jest zawsze jedną linią, nawet gdy imię zawiera newline", () => {
    const mail = buildNotifyEmail(
      { ...validData, name: "Anna\nBcc: spam@evil.com" },
      "x",
    );
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("treść zawiera adres do odpowiedzi i wiadomość; HTML jest escapowany", () => {
    const mail = buildNotifyEmail(
      { ...validData, message: "Oferta <b>specjalna</b> & co dalej?" },
      "11 lip 2026, 12:00",
    );
    expect(mail.text).toContain("odpowiedz na ten adres): anna@example.com");
    expect(mail.text).toContain("Oferta <b>specjalna</b> & co dalej?");
    expect(mail.html).toContain("Oferta &lt;b&gt;specjalna&lt;/b&gt; &amp;");
    expect(mail.html).not.toContain("<b>specjalna</b>");
  });
});

describe("kontakt: mail #2 (auto-potwierdzenie)", () => {
  it("subject jest STAŁY per język — treść użytkownika nie steruje tematem", () => {
    const pl = buildConfirmEmail({
      ...validData,
      name: "PILNE!!!",
      message: "Wygrałeś milion — kliknij tutaj żeby odebrać nagrodę!",
    });
    expect(pl.subject).toBe("Dziękuję za wiadomość — hadrianm.pl");
    const en = buildConfirmEmail({ ...validData, lang: "en" });
    expect(en.subject).toBe("Thanks for your message — hadrianm.pl");
  });

  it("zawiera kopię wiadomości (cytowaną w text, escapowaną w html)", () => {
    const mail = buildConfirmEmail({
      ...validData,
      message: "linia 1\nlinia 2 <i>kursywą</i>",
    });
    expect(mail.text).toContain("> linia 1\n> linia 2 <i>kursywą</i>");
    expect(mail.html).toContain("linia 2 &lt;i&gt;kursywą&lt;/i&gt;");
    expect(mail.html).not.toContain("<i>kursywą</i>");
  });

  it("wersje językowe: PL i EN mają komplet elementów (podziękowanie, kopia, stopka anti-abuse)", () => {
    const pl = buildConfirmEmail(validData);
    expect(pl.text).toContain("Cześć Anna");
    expect(pl.text).toContain("24 godzin");
    expect(pl.text).toContain("temat: Wizerunek");
    expect(pl.text).toContain("zignoruj ją");
    const en = buildConfirmEmail({ ...validData, temat: "Image", lang: "en" });
    expect(en.text).toContain("Hi Anna");
    expect(en.text).toContain("24 hours");
    expect(en.text).toContain("topic: Image");
    expect(en.text).toContain("please ignore this email");
  });
});
