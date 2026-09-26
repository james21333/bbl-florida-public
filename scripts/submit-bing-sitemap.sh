#!/usr/bin/env bash
# Requires BING_WEBMASTER_API_KEY from Bing Webmaster → Settings (site must be verified first).
set -euo pipefail
KEY="${BING_WEBMASTER_API_KEY:?Set BING_WEBMASTER_API_KEY}"

submit() {
  local site="$1" sitemap="$2"
  curl -sS "https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed?apikey=${KEY}" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"siteUrl\":\"${site}\",\"feedUrl\":\"${sitemap}\"}"
  echo ""
  echo "Bing sitemap submitted: $sitemap"
}

submit "https://bblinjuries.com/" "https://bblinjuries.com/sitemap.xml"
submit "https://lesionesbbl.com/" "https://lesionesbbl.com/sitemap.xml"
