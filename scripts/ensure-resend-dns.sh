#!/usr/bin/env bash
# Idempotent: add Resend domain verification DNS for bblinjuries.com via Cloudflare API.
# Needs CLOUDFLARE_API_TOKEN with Zone → DNS → Edit for that zone.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="${ROOT}/config/resend-dns-bblinjuries.json"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if [[ -f "${ROOT}/secrets/.env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT}/secrets/.env"
    set +a
  fi
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN (Zone DNS Edit)." >&2
  exit 1
fi

ZONE_ID="$(python3 -c "import json; print(json.load(open('$CONFIG'))['zone_id'])")"
API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

cf_get() {
  curl -sS "${AUTH[@]}" "$1"
}

cf_post() {
  curl -sS -X POST "${AUTH[@]}" "$API" --data "$1"
}

cf_patch() {
  local id=$1 data=$2
  curl -sS -X PATCH "${AUTH[@]}" "${API}/${id}" --data "$data"
}

existing="$(cf_get "${API}?per_page=500")"
if ! python3 -c "import sys,json; sys.exit(0 if json.load(sys.stdin).get('success') else 1)" <<<"$existing"; then
  echo "Cloudflare API auth failed. Token needs Zone DNS Edit for bblinjuries.com." >&2
  python3 -c "import sys,json; print(json.load(sys.stdin).get('errors'))" <<<"$existing" >&2
  exit 1
fi

python3 <<'PY' "$CONFIG" "$existing"
import json, subprocess, sys

config_path, existing_json = sys.argv[1], json.loads(sys.argv[2])
zone_id = json.load(open(config_path))["zone_id"]
records = json.load(open(config_path))["records"]
existing = existing_json.get("result") or []

def norm_name(n):
    n = n.lower().rstrip(".")
    if not n.endswith(".bblinjuries.com"):
        if n == "bblinjuries.com":
            return n
        n = f"{n}.bblinjuries.com"
    return n

def find_rec(spec):
    want_name = norm_name(spec["name"])
    want_type = spec["type"]
    for r in existing:
        if r.get("type") != want_type:
            continue
        if norm_name(r.get("name", "")) == want_name:
            return r
    return None

api = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
token = __import__("os").environ["CLOUDFLARE_API_TOKEN"]

def curl(method, url, body=None):
    cmd = ["curl", "-sS", "-X", method, url, "-H", f"Authorization: Bearer {token}", "-H", "Content-Type: application/json"]
    if body is not None:
        cmd += ["--data", json.dumps(body)]
    out = subprocess.check_output(cmd, text=True)
    data = json.loads(out)
    if not data.get("success"):
        raise SystemExit(f"API error: {data.get('errors')}")
    return data

for spec in records:
    name = spec["name"]
    typ = spec["type"]
    content = spec["content"]
    cur = find_rec(spec)
    if typ == "TXT":
        body = {"type": "TXT", "name": name, "content": content, "ttl": 1}
    else:
        body = {
            "type": "CNAME",
            "name": name,
            "content": content,
            "ttl": 1,
            "proxied": bool(spec.get("proxied", False)),
        }
    if cur is None:
        curl("POST", api, body)
        print(f"created {typ} {name}")
    else:
        same = cur.get("content") == content and cur.get("proxied") == body.get("proxied", cur.get("proxied"))
        if same:
            print(f"ok {typ} {name}")
        else:
            curl("PATCH", f"{api}/{cur['id']}", body)
            print(f"updated {typ} {name}")

print("done")
PY
