# Opcjonalne TODO — rzeczy do rozważenia „kiedyś"

Lista zadań, które **nie blokują** wdrożenia, ale warto do nich okresowo wracać.
Konwencja: `[ ]` = do zrobienia / do rozważenia, `[x]` = zrobione (dopisz datę).
Przy zadaniach cyklicznych nie odhaczaj — aktualizuj pole „ostatnio zrobione".

---

## Cykliczne (sprawdzaj co jakiś czas)

### [ ] Odśwież Workera `sveltia-cms-auth` (co ~3–6 miesięcy)

Worker był wdrożony ręcznie przez `wrangler deploy` (kreator „Deploy to
Cloudflare Workers" nie działał), więc **nie dostaje automatycznie** poprawek
z repo `sveltia/sveltia-cms-auth`. Kod jest mały i stabilny, ale raz na kilka
miesięcy (albo gdy logowanie do `/admin` zacznie kaprysić) warto wgrać świeżą
wersję:

```bash
git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth /tmp/sveltia-cms-auth
cd /tmp/sveltia-cms-auth
npx wrangler deploy   # wymaga zalogowania: npx wrangler login
```

Sekrety (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`) są
przypięte do Workera w Cloudflare i **przeżywają** redeploy — nic nie trzeba
ustawiać ponownie.

- Wdrożono pierwotnie: 2026-07-03
- Ostatnio odświeżono: — (jeszcze nie)

### [ ] Przegląd dostępów i sekretów (co ~6 miesięcy)

- Czy Client Secret aplikacji OAuth leży bezpiecznie (menedżer haseł)?
  W razie wątpliwości: GitHub → Settings → Developer settings → OAuth Apps →
  „Sveltia CMS — hadrianm.pl" → **Generate a new client secret** → podmień
  `GITHUB_CLIENT_SECRET` w Cloudflare (Workers & Pages → sveltia-cms-auth →
  Settings → Variables and Secrets) → redeploy Workera.
- Czy 2FA jest włączone na GitHubie i Cloudflare? (te dwa konta kontrolują
  kod, treść, logowanie do panelu, hosting i domenę)
- Czy w `ALLOWED_DOMAINS` nie wiszą wpisy, które nie są już potrzebne?

---

## Jednorazowe (zrób, gdy będzie chwila / gdy nadejdzie właściwy etap)

### [ ] Zweryfikuj `robots.txt` na produkcji (przy Etapie 4)

Po wdrożeniu strony na Cloudflare Pages sprawdź, że
`https://hadrianm.pl/robots.txt` faktycznie się serwuje i blokuje `/admin`
(plik dodany w Etapie 2). Jedno wejście w przeglądarce, 10 sekund.

### [ ] `pages.dev` w `ALLOWED_DOMAINS` — tylko wąsko i tylko jeśli potrzebne

W Etapie 4 strona stanie najpierw na adresie typu `hadrianm-web.pages.dev`.
Jeśli zechcesz testować `/admin` z tego adresu **zanim** podepniesz domenę,
dodaj do `ALLOWED_DOMAINS` w Workerze **konkretną** wartość
(np. `hadrianm-web.pages.dev`), nigdy szeroki wildcard `*.pages.dev` —
szeroki wpuszczałby cudze strony na Pages do Twojego proxy logowania.
Po podpięciu domeny wpis można usunąć.

### [ ] Własna subdomena dla Workera: `auth.hadrianm.pl`

Zamiast `sveltia-cms-auth.tenhadrian.workers.dev` — wygląda profesjonalniej
(szczególnie przy pracy z klientami). Robić **dopiero gdy domena jest w
Cloudflare** (po Etapie 4). Kroki:

1. Cloudflare → Workers & Pages → `sveltia-cms-auth` → Settings → Domains &
   Routes → **Add custom domain** → `auth.hadrianm.pl`.
2. GitHub → OAuth App „Sveltia CMS — hadrianm.pl" → zmień callback na
   `https://auth.hadrianm.pl/callback`.
3. `public/admin/config.yml` → `base_url: https://auth.hadrianm.pl` → push.
4. Przetestuj logowanie na `/admin` (localhost i produkcja).

Uwaga: wszystkie 3 miejsca muszą być zmienione spójnie, inaczej logowanie
przestanie działać.

---

## Dopisane później

<!-- tu dopisuj kolejne pomysły w miarę realizacji planu -->
