#!/usr/bin/env bash
# Публикация демо на GitHub Pages. Запуск из Git Bash в папке bar-tent:  bash tools/publish.sh "что сделано"
# Собирает docs/ (статическое демо), коммитит в main, пушит main и ветку gh-pages (= содержимое docs/).
set -e
cd "$(dirname "$0")/.."
MSG="${1:-Обновление демо}"
node tools/build-static.mjs
git add -A
git -c core.safecrlf=false commit -q -m "$MSG

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" || echo "нет изменений в main"
GIT_TERMINAL_PROMPT=0 git push -q origin main
# ветка gh-pages из папки docs
git branch -D gh-pages >/dev/null 2>&1 || true
git subtree split --prefix docs -b gh-pages >/dev/null
GIT_TERMINAL_PROMPT=0 git push -q -f origin gh-pages
git branch -D gh-pages >/dev/null 2>&1 || true
echo "опубликовано: $(git log --oneline | head -1)"
echo "демо: https://vetaliytsepelev-pixel.github.io/bar-tent-menu/   бар: …/bar.html"
