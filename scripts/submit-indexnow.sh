#!/usr/bin/env bash
set -euo pipefail

submit() {
  local host="$1" key="$2" sitemap="$3"
  local body
  body=$(printf '{"host":"%s","key":"%s","keyLocation":"https://%s/%s.txt","urlList":["https://%s/","%s"]}' \
    "$host" "$key" "$host" "$key" "$host" "$sitemap")
  curl -sS -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "$body"
  echo ""
  echo "IndexNow submitted for $host"
}

submit "bblinjuries.com" "408d471f293ed5c3b014bdc1ddc99235" "https://bblinjuries.com/sitemap.xml"
submit "lesionesbbl.com" "5a634a7a656efe68b0560aa1afb775b5" "https://lesionesbbl.com/sitemap.xml"
