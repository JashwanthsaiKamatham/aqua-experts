#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
#  AQUA-EXPERTS — one-shot deploy: GitHub → Render → Vercel
#
#  Usage (tokens are read from the environment, never committed):
#    GH_TOKEN=ghp_xxx RENDER_TOKEN=rnd_xxx VERCEL_TOKEN=vcp_xxx \
#    SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
#    GEMINI_API_KEY=... ./deploy/deploy.sh
#
#  Optional: REPO_NAME, PROJECT_NAME, REGION (render), TEAM_ID (vercel)
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_NAME="${REPO_NAME:-aqua-experts}"
API_NAME="${API_NAME:-aqua-experts-api}"
REGION="${REGION:-singapore}"
: "${GH_TOKEN:?GH_TOKEN missing}"
: "${RENDER_TOKEN:?RENDER_TOKEN missing}"
: "${VERCEL_TOKEN:?VERCEL_TOKEN missing}"

say() { printf '\n\033[36m▸ %s\033[0m\n' "$1"; }

# ── 0. repo root ────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── 1. GitHub ───────────────────────────────────────────────────────
say "GitHub: resolving account"
GH_USER=$(curl -sf -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" https://api.github.com/user | python3 -c 'import sys,json;print(json.load(sys.stdin)["login"])')
echo "  user: $GH_USER"

say "GitHub: creating repository $REPO_NAME (ignores 422 if it exists)"
curl -s -o /dev/null -w '  status %{http_code}\n' -X POST \
  -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"AQUA-EXPERTS — cinematic water purifier store & service platform\",\"private\":false,\"has_issues\":true,\"has_wiki\":false}"

say "Git: committing and pushing"
if [ ! -d .git ]; then
  git init -q
  git branch -M main
fi
git add -A
git -c user.email="deploy@aqua-experts.in" -c user.name="AQUA-EXPERTS Deploy" \
  commit -q -m "AQUA-EXPERTS: cinematic storefront, auth, CRUD, bookings, Gemini concierge" || echo "  (nothing new to commit)"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
git push -q -u origin main --force
echo "  pushed → https://github.com/${GH_USER}/${REPO_NAME}"

# ── 2. Render ───────────────────────────────────────────────────────
say "Render: resolving owner"
OWNER_ID=$(curl -sf -H "Authorization: Bearer $RENDER_TOKEN" \
  "https://api.render.com/v1/owners?limit=1" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["owner"]["id"])')
echo "  owner: $OWNER_ID"

say "Render: creating web service (skipped if it already exists)"
SERVICE_ID=$(curl -s -H "Authorization: Bearer $RENDER_TOKEN" \
  "https://api.render.com/v1/services?name=$API_NAME&limit=1" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d[0]["service"]["id"] if d else "")')

if [ -z "$SERVICE_ID" ]; then
  SERVICE_ID=$(curl -sf -X POST -H "Authorization: Bearer $RENDER_TOKEN" \
    -H "Content-Type: application/json" https://api.render.com/v1/services -d @- <<JSON | python3 -c 'import sys,json;print(json.load(sys.stdin)["service"]["id"])'
{
  "type": "web_service",
  "name": "$API_NAME",
  "ownerId": "$OWNER_ID",
  "repo": "https://github.com/$GH_USER/$REPO_NAME",
  "branch": "main",
  "rootDir": "server",
  "autoDeploy": "yes",
  "envVars": [
    {"key": "NODE_ENV", "value": "production"},
    {"key": "SUPABASE_URL", "value": "${SUPABASE_URL:-}"},
    {"key": "SUPABASE_ANON_KEY", "value": "${SUPABASE_ANON_KEY:-}"},
    {"key": "SUPABASE_SERVICE_ROLE_KEY", "value": "${SUPABASE_SERVICE_ROLE_KEY:-}"},
    {"key": "DATABASE_URL", "value": "${DATABASE_URL:-}"},
    {"key": "JWT_SECRET", "value": "${JWT_SECRET:-$(openssl rand -hex 32)}"},
    {"key": "GEMINI_API_KEY", "value": "${GEMINI_API_KEY:-}"},
    {"key": "CLIENT_URL", "value": "${CLIENT_URL:-http://localhost:5173}"}
  ],
  "serviceDetails": {
    "env": "node",
    "plan": "free",
    "region": "$REGION",
    "envSpecificDetails": { "buildCommand": "npm install", "startCommand": "npm start" }
  }
}
JSON
  )
fi
echo "  service: $SERVICE_ID"

say "Render: waiting for the API to come up (this can take a few minutes)"
API_URL=""
for i in $(seq 1 60); do
  API_URL=$(curl -sf -H "Authorization: Bearer $RENDER_TOKEN" \
    "https://api.render.com/v1/services/$SERVICE_ID" \
    | python3 -c 'import sys,json;d=json.load(sys.stdin);print((d.get("serviceDetails") or {}).get("url") or "")' || true)
  if [ -n "$API_URL" ] && curl -sf "$API_URL/api/health" >/dev/null 2>&1; then break; fi
  sleep 10
done
echo "  api: ${API_URL:-<pending>}"

# ── 3. Vercel ───────────────────────────────────────────────────────
say "Vercel: creating project + first production deployment"
PROJECT="$REPO_NAME"
curl -s -o /dev/null -w '  project status %{http_code}\n' -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  https://api.vercel.com/v11/projects \
  -d "{\"name\":\"$PROJECT\",\"framework\":\"vite\",\"rootDirectory\":\"client\",\"gitRepository\":{\"type\":\"github\",\"repo\":\"$GH_USER/$REPO_NAME\"}}"

curl -s -o /dev/null -w '  env status %{http_code}\n' -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$PROJECT/env?upsert=true" \
  -d "{\"key\":\"VITE_API_BASE_URL\",\"value\":\"${API_URL}\",\"type\":\"plain\",\"target\":[\"production\",\"preview\",\"development\"]}"

DEPLOY_ID=$(curl -sf -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" https://api.vercel.com/v13/deployments -d @- <<JSON | python3 -c 'import sys,json;print(json.load(sys.stdin).get("id",""))'
{ "name": "$PROJECT", "project": "$PROJECT", "target": "production",
  "gitSource": { "type": "github", "org": "$GH_USER", "repo": "$REPO_NAME", "ref": "main" } }
JSON
)
echo "  deployment: $DEPLOY_ID"

WEB_URL=""
for i in $(seq 1 40); do
  WEB_URL=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v13/deployments/$DEPLOY_ID" \
    | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("url","") if d.get("readyState")=="READY" else "")' || true)
  [ -n "$WEB_URL" ] && break
  sleep 8
done

# ── 4. point CORS back at the frontend ──────────────────────────────
if [ -n "$WEB_URL" ]; then
  say "Render: setting CLIENT_URL=https://$WEB_URL"
  curl -s -o /dev/null -w '  status %{http_code}\n' -X PUT \
    -H "Authorization: Bearer $RENDER_TOKEN" -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars/CLIENT_URL" \
    -d "{\"value\":\"https://$WEB_URL,http://localhost:5173\"}"
fi

cat <<EOF

────────────────────────────────────────────────────────
✅  Deployed

  Frontend : https://${WEB_URL:-<pending>}
  Backend  : ${API_URL:-<pending>}
  GitHub   : https://github.com/${GH_USER}/${REPO_NAME}

  Smoke test:
    cd server && API_URL=${API_URL} node scripts/smoke.js
────────────────────────────────────────────────────────
EOF
