#!/bin/bash
# PostToolUse (Edit|Write): mapuje edytowana sciezke na wymagana warstwe
# testow (mapa: .claude/rules/testing.md) i wypisuje przypomnienie do
# kontekstu. NIEBLOKUJACY (exit 0); twarda bramka i tak stoi w CI.
# Throttling: jedno przypomnienie na warstwe na sesje (marker w /tmp).
set -u
input=$(cat)

file=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file" ] && exit 0
sid=$(echo "$input" | jq -r '.session_id // "nosession"' 2>/dev/null)
rel="${file#"${CLAUDE_PROJECT_DIR:-}"/}"

layer=""
msg=""
case "$rel" in
  src/components/sections/hero/*)
    layer="hero"
    msg="Zmiana w hero NIE jest zweryfikowana bez: pnpm test:unit (inwarianty hero-config) + pnpm build && pnpm test:visual (skill /verify-mobile)."
    ;;
  src/content.schema.ts | src/content.config.ts | public/admin/config.yml)
    layer="cms"
    msg="Zmiana schematu CMS: uruchom pnpm test:unit (kontrakt CMS); pamietaj o synchronizacji TRZECH miejsc (content.schema.ts / admin config.yml / sekcja work)."
    ;;
  src/i18n/* | src/lib/img.ts)
    layer="unit"
    msg="Uruchom pnpm test:unit (slowniki i18n / kontrakt imgAt)."
    ;;
  src/scripts/* | src/components/navbar/* | src/components/ui/* | src/components/sections/work/*)
    layer="e2e"
    msg="Uruchom pnpm test:e2e (nawigacja / overlaye WorkDetail / scroll) — wymaga pnpm build."
    ;;
  src/layouts/* | src/styles/*)
    layer="visual"
    msg="Zmiana globalna (layout/tokeny): pnpm build && pnpm test:visual (siatka wizualna, 6 profili)."
    ;;
  *)
    exit 0
    ;;
esac

marker="/tmp/claude-remind-tests-${sid}-${layer}"
[ -e "$marker" ] && exit 0
touch "$marker" 2>/dev/null

printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[remind-tests] %s"}}\n' "$msg"
exit 0
