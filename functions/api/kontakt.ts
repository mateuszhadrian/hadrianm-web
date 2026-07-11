// Pages Function: POST /api/kontakt — endpoint formularza kontaktowego.
// Przepływ i kody odpowiedzi: docs/contact-me-form-analysis-implementation.md
// §4.1/§4.4. Sekrety (RESEND_API_KEY, TURNSTILE_SECRET_KEY) żyją w
// ustawieniach projektu Pages; binding KONTAKT_KV jest OPCJONALNY
// (dzienny bezpiecznik limitu Resend — §5.4).
import {
  buildConfirmEmail,
  buildNotifyEmail,
  CONTACT_FROM_CONFIRM,
  CONTACT_FROM_NOTIFY,
  CONTACT_TO,
  isBotTrap,
  validateSubmission,
} from "../../src/lib/contact-form";

// Minimalne typy zamiast @cloudflare/workers-types — używamy wyłącznie
// standardowych API (Request/Response/FormData/fetch), które pokrywa lib DOM.
interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  KONTAKT_KV?: KVNamespaceLike;
}

interface PagesContext {
  request: Request;
  env: Env;
}

// 80 < 100/dzień (limit Resend), z zapasem na potwierdzenia i retry.
const DAILY_LIMIT = 80;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequest = async (ctx: PagesContext): Promise<Response> => {
  if (ctx.request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  return handlePost(ctx);
};

async function handlePost({ request, env }: PagesContext): Promise<Response> {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return json(400, { ok: false, error: "bad-form" });
  }
  const field = (key: string): string => {
    const value = fd.get(key);
    return typeof value === "string" ? value : "";
  };

  const raw = {
    name: field("name"),
    email: field("email"),
    temat: field("temat"),
    message: field("message"),
    firma: field("firma"),
    elapsed: field("elapsed"),
    lang: field("lang"),
  };

  // Bot-trap: udawany sukces bez wysyłki — bot nie wie, że został odsiany.
  if (isBotTrap(raw)) return json(200, { ok: true });

  const validated = validateSubmission(raw);
  if (!validated.ok) return json(400, { ok: false, error: validated.field });

  // Turnstile — token jest jednorazowy i żyje 300 s; frontend pobiera
  // świeży przy każdym submicie.
  let turnstile: { success?: boolean };
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: field("cf-turnstile-response"),
          remoteip: request.headers.get("cf-connecting-ip") ?? "",
        }),
      },
    );
    turnstile = await res.json();
  } catch {
    return json(502, { ok: false, error: "turnstile-unreachable" });
  }
  if (!turnstile.success) return json(403, { ok: false, error: "turnstile" });

  // Dzienny bezpiecznik — aktywny tylko gdy projekt ma binding KONTAKT_KV.
  if (env.KONTAKT_KV) {
    const key = `quota:${new Date().toISOString().slice(0, 10)}`;
    const used = Number((await env.KONTAKT_KV.get(key)) ?? "0");
    if (used >= DAILY_LIMIT) return json(503, { ok: false, error: "quota" });
    await env.KONTAKT_KV.put(key, String(used + 1), {
      expirationTtl: 172800,
    });
  }

  const sentAt = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Mail #1 — powiadomienie do skrzynki; Reply-To = nadawca z formularza,
  // więc „Odpowiedz" w Outlooku pisze wprost do klienta.
  const notify = buildNotifyEmail(validated.data, sentAt);
  const sent = await sendEmail(env.RESEND_API_KEY, {
    from: CONTACT_FROM_NOTIFY,
    to: [CONTACT_TO],
    reply_to: validated.data.email,
    ...notify,
  });
  if (!sent.ok) {
    console.error(`kontakt: mail #1 nie wyszedł (HTTP ${sent.status})`);
    return json(502, { ok: false, error: "send" });
  }

  // Mail #2 — potwierdzenie dla nadawcy; porażka NIE psuje odpowiedzi
  // (wiadomość dotarła do skrzynki — to sedno usługi).
  const confirm = buildConfirmEmail(validated.data);
  const confirmSent = await sendEmail(env.RESEND_API_KEY, {
    from: CONTACT_FROM_CONFIRM,
    to: [validated.data.email],
    reply_to: CONTACT_TO,
    ...confirm,
  });
  if (!confirmSent.ok) {
    console.error(
      `kontakt: potwierdzenie nie wyszło (HTTP ${confirmSent.status})`,
    );
  }

  return json(200, { ok: true });
}

interface OutgoingEmail {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(
  apiKey: string,
  mail: OutgoingEmail,
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(mail),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
