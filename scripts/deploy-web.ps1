# One-command redeploy of the AMA web app: API image -> Cloud Run -> web export -> Firebase Hosting.
# Assumes first-time setup (docs/deploy.md sections 1-7) is done: gcloud/firebase logged in,
# Artifact Registry repo "ama" exists, and the five secrets are stored in Secret Manager.
#
# Usage (repo root, PowerShell):
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-web.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-web.ps1 -SkipApi      # website only
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-web.ps1 -SkipWeb      # API only
param(
  [string]$Project = "ama-society",
  [string]$Region = "asia-south1",
  [string]$Service = "ama-api",
  [switch]$SkipApi,
  [switch]$SkipWeb
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE). See docs/deploy.md troubleshooting." } }

Step "Project $Project, region $Region"
gcloud config set project $Project | Out-Null; Check "gcloud config set project"

# Fail early on the Redis mistake that cost the most time: redis:// instead of rediss://.
$redis = [uri]((gcloud secrets versions access latest --secret=REDIS_URL | Out-String).Trim())
if ($redis.Host -like "*upstash.io" -and $redis.Scheme -ne "rediss") {
  throw "REDIS_URL uses '$($redis.Scheme)://'. Upstash needs 'rediss://'. Fix with Update-Secret (docs/deploy.md) and rerun."
}

if (-not $SkipApi) {
  Step "Building the API image on Cloud Build (5-10 min)"
  gcloud builds submit --config cloudbuild.yaml .; Check "gcloud builds submit"

  Step "Deploying $Service to Cloud Run"
  $secrets = "DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET:latest"
  gcloud run deploy $Service --region=$Region --image="$Region-docker.pkg.dev/$Project/ama/$Service" --set-secrets=$secrets --allow-unauthenticated; Check "gcloud run deploy"
}

$api = (gcloud run services describe $Service --region=$Region --format="value(status.url)").Trim()
Step "Checking the API at $api"
$code = (Invoke-WebRequest "$api/api/docs" -UseBasicParsing -TimeoutSec 60).StatusCode
Write-Host "GET /api/docs -> $code"
try {
  Invoke-RestMethod -Method Post -Uri "$api/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"__healthcheck__@example.com","password":"x"}' | Out-Null
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 500) { throw "Login endpoint returns 500: the API cannot reach the database. Run: gcloud run services logs read $Service --region=$Region --limit=40" }
  Write-Host "POST /auth/login with a fake user -> $status (401 expected: database reachable)"
}

if (-not $SkipWeb) {
  Step "Exporting the website"
  Push-Location apps\mobile
  npx expo export -p web; $exit = $LASTEXITCODE
  Pop-Location
  if ($exit -ne 0) { throw "expo export failed" }

  Step "Deploying to Firebase Hosting"
  firebase use $Project; Check "firebase use"
  firebase deploy --only hosting; Check "firebase deploy"
}

Step "Done"
Write-Host "API:     $api"
if (-not $SkipWeb) { Write-Host "Website: https://$Project.web.app" }
