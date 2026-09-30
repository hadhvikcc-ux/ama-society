# Builds an installable Android APK on EAS, pointed at the deployed Cloud Run API.
#
# Usage (from anywhere in the repo, in PowerShell):
#   powershell -ExecutionPolicy Bypass -File apps\mobile\scripts\build-android.ps1
#   powershell -ExecutionPolicy Bypass -File apps\mobile\scripts\build-android.ps1 -ApiUrl https://ama-api-xxxx.a.run.app
#
# Needs: gcloud (logged in, project set), eas-cli (logged in), pnpm.
param(
  [string]$ApiUrl = "",
  [string]$Region = "asia-south1",
  [string]$Service = "ama-api",
  [string]$Profile = "preview"
)
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path -Parent $PSScriptRoot

# 1. Find the API address. EAS builds run on Expo's servers, so a local
#    $env:EXPO_PUBLIC_API_URL never reaches them; store it in EAS instead.
if (-not $ApiUrl) {
  Write-Host "Looking up the $Service Cloud Run URL..."
  $ApiUrl = (gcloud run services describe $Service --region=$Region --format="value(status.url)")
  if (-not $ApiUrl) { throw "Could not find Cloud Run service '$Service' in $Region. Deploy the API first, or pass -ApiUrl." }
}
$ApiUrl = $ApiUrl.Trim().TrimEnd("/")
if ($ApiUrl -notmatch "/api/v1$") { $ApiUrl = "$ApiUrl/api/v1" }
Write-Host "API URL: $ApiUrl"

# 2. Check the API answers before spending a build on it.
try {
  $docs = $ApiUrl -replace "/api/v1$", "/api/docs"
  $code = (Invoke-WebRequest $docs -UseBasicParsing -TimeoutSec 30).StatusCode
  Write-Host "API check: $docs -> $code"
} catch {
  Write-Warning "The API did not answer at $docs ($($_.Exception.Message)). The app will build, but logins will fail until the API is up."
}

Push-Location $mobileDir
try {
  # 3. Save the address as an EAS environment variable for this build profile.
  eas env:create --name EXPO_PUBLIC_API_URL --value $ApiUrl --environment $Profile --visibility plaintext --scope project --force --non-interactive
  if ($LASTEXITCODE -ne 0) { throw "eas env:create failed (run 'eas login' first)." }

  # 4. Build.
  eas build -p android --profile $Profile --non-interactive
  if ($LASTEXITCODE -ne 0) { throw "eas build failed. Open the 'See logs' link above and check the red step." }
} finally {
  Pop-Location
}
