#!/usr/bin/env bash
# Expose the local Overmind backend (Hono on :8788) over a public HTTPS URL so the
# GitHub Pages site can reach it during a live demo. No Cloudflare account needed.
#
#   1) terminal A:  npm run dev        # or: npm start   (backend on :8788)
#   2) terminal B:  ./scripts/tunnel.sh
#   3) open the live site with the printed URL appended:
#        https://toukkelipoukkeli-glitch.github.io/overmind-live/?api=https://<sub>.trycloudflare.com
#      (the ?api=… is saved to localStorage, so you only pass it once)
set -euo pipefail
PORT="${1:-8788}"
echo "▶ opening cloudflared quick tunnel → http://localhost:${PORT}"
echo "  copy the https://*.trycloudflare.com URL below into the live site as ?api=<url>"
exec cloudflared tunnel --url "http://localhost:${PORT}"
