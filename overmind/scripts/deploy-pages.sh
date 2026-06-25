#!/usr/bin/env bash
# Deploy the compiled Overmind site to the PUBLIC `overmind-live` repo's GitHub Pages.
# The source repo (sunstead) stays private; only the built static bundle is published.
#
#   ./scripts/deploy-pages.sh
#
# Result: https://toukkelipoukkeli-glitch.github.io/overmind-live/
set -euo pipefail

OWNER="toukkelipoukkeli-glitch"
PAGES_REPO="overmind-live"
BASE="/${PAGES_REPO}/"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # overmind/
cd "$HERE"

echo "▶ building with base=${BASE}"
PAGES_BASE="${BASE}" npx vite build

echo "▶ publishing dist → ${OWNER}/${PAGES_REPO} (gh-pages via branch main)"
WORK="$(mktemp -d)"
cp -R dist/. "$WORK"/
touch "$WORK/.nojekyll"        # don't run Jekyll over the Vite output
cp dist/index.html "$WORK/404.html" 2>/dev/null || true  # hash-routing SPA fallback

cd "$WORK"
git init -q
git checkout -q -b main
git add -A
git -c user.email=deploy@overmind -c user.name=overmind-deploy commit -qm "deploy: overmind-live $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git remote add origin "https://github.com/${OWNER}/${PAGES_REPO}.git"
git push -f -q origin main

echo "▶ ensuring Pages is enabled (branch main, root)"
gh api --method POST "repos/${OWNER}/${PAGES_REPO}/pages" \
  -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api --method PUT "repos/${OWNER}/${PAGES_REPO}/pages" \
       -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 || true

rm -rf "$WORK"
echo "✓ deployed → https://${OWNER}.github.io/${PAGES_REPO}/"
echo "  (first publish can take 1–2 min to go live)"
