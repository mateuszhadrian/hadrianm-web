#!/bin/bash
# PreToolUse(Edit|Write): blokada recznej edycji JSON-ow realizacji (pisze je Sveltia CMS).
set -u
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

case "$file" in
  */src/content/realizacje/*|src/content/realizacje/*)
    echo 'STOP: src/content/realizacje/*.json pisze Sveltia CMS (panel /admin). Reczna edycja rozjedzie formater i historie CMS. Nowe wpisy tworzy sie w panelu. Jesli Mateusz wyraznie kazal edytowac ten plik, popros go o jednorazowe potwierdzenie.' >&2
    exit 2
    ;;
esac
exit 0
