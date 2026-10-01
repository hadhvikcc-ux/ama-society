---
name: deploy-ama-web
description: Set up, deploy, redeploy or troubleshoot the AMA Smart Society web app (NestJS API on Google Cloud Run, Expo web build on Firebase Hosting, PostgreSQL on Neon, Redis on Upstash). Use when the user asks to deploy, publish, host, update or fix the live AMA website or API, sets up a new environment, or pastes a gcloud / Cloud Run / Firebase / Prisma / ioredis error from this project.
---

# Deploy the AMA web app

The user usually runs commands themselves in **Windows PowerShell** (often an older version) and pastes output or screenshots. Give copy-paste blocks one step at a time, each with what success looks like. Never ask for connection strings or keys in chat.

## Architecture (fixed names)

| Piece | Where | Name |
|---|---|---|
| Website | Firebase Hosting | `https://<project>.web.app`, serves `apps/mobile/dist`, rewrites `/api/**` to Cloud Run |
| API | Cloud Run | service `ama-api`, region `asia-south1`, image `asia-south1-docker.pkg.dev/<project>/ama/ama-api` |
| Database | Neon | secret `DATABASE_URL` (`postgresql://…?sslmode=require`) |
| Redis | Upstash | secret `REDIS_URL` (**must be `rediss://`**) |
| Other secrets | Secret Manager | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RAZORPAY_KEY_SECRET` |
| Google / phone OTP sign-in | Firebase Authentication | API env `FIREBASE_PROJECT_ID`; web build reads `apps/mobile/.env` `EXPO_PUBLIC_FIREBASE_*` |

Firebase Hosting and Cloud Run **must be in the same GCP project** and the service must be in `asia-south1`, or `/api` forwarding breaks. Deploy files live on branch `claude/deploy-setup`: `packages/api/Dockerfile`, `cloudbuild.yaml`, `.gcloudignore`, `firebase.json`, `docs/deploy.md`, `scripts/deploy-web.ps1`.

## First-time setup

Follow `docs/deploy.md` in order: tools → clone + `pnpm install` → Neon + Upstash → GCP project, APIs, Artifact Registry repo `ama`, IAM (`roles/cloudbuild.builds.builder` and `roles/secretmanager.secretAccessor` on `<number>-compute@developer.gserviceaccount.com`) → secrets → build → deploy → seed once → Firebase. The Word version is `AMA-Society-Web-Setup-Guide.docx`.

Secrets on Windows PowerShell: `Set-Content -NoNewline` does not exist on older versions, so always use these helpers:

```powershell
function Save-Secret($name, $value) { $f = Join-Path (Get-Location) "secret.txt"; [IO.File]::WriteAllText($f, $value.Trim()); gcloud secrets create $name --data-file="$f"; Remove-Item $f }
function Update-Secret($name, $value) { $f = Join-Path (Get-Location) "secret.txt"; [IO.File]::WriteAllText($f, $value.Trim()); gcloud secrets versions add $name --data-file="$f"; Remove-Item $f }
function New-Random { $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { '{0:x2}' -f $_ }) }
```

## Redeploy (after setup)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-web.ps1            # API + website
powershell -ExecutionPolicy Bypass -File scripts\deploy-web.ps1 -SkipApi   # website only
```

The script refuses to run when `REDIS_URL` is `redis://` on an Upstash host, builds with Cloud Build, deploys `ama-api`, checks `/api/docs` and that login answers 401 (not 500) for a fake user, exports the web build and deploys Hosting.

The manual deploy command. Give it **verbatim**, and warn the user never to substitute real values into `--set-secrets`:

```powershell
gcloud run deploy ama-api --region=asia-south1 --image=asia-south1-docker.pkg.dev/ama-society/ama/ama-api --set-secrets="DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET:latest" --set-env-vars="FIREBASE_PROJECT_ID=ama-society" --allow-unauthenticated
```

## Google and phone OTP sign-up

Flow: browser signs in with Firebase (Google popup or SMS code with invisible reCAPTCHA) → `POST /api/v1/auth/firebase {idToken}` → existing user (matched by verified Google email, or phone as `+91XXXXXXXXXX` or 10 digits) gets tokens; otherwise `needsRegistration` + 15-minute registration token → `/auth/complete-profile` (role, name, society code such as `AMA-001`, mobile for Google) → `POST /api/v1/auth/register/complete`. Roles: Flat owner / Tenant are active at once; Committee, Security guard, Mart vendor and Supplier are created `PENDING` (no tokens, sign-in answers 403 "waiting for approval") until an admin approves them in the dashboard's **Sign-up requests** tile (`GET /auth/approvals`, `POST /auth/approvals/:id/approve|reject`, own society only). Admin can never be chosen at sign-up. Society codes are unique, case-insensitive, shown on the admin dashboard; lookup also accepts the society ID. Web only; Android keeps email/password.

Setup checklist when it doesn't work:
- Firebase console → Authentication → Sign-in method: **Google** and **Phone** enabled.
- Authorized domains include the site's domain (`<project>.web.app` is there by default).
- Phone SMS needs the Blaze plan; free testing via "Phone numbers for testing".
- Cloud Run has `FIREBASE_PROJECT_ID` (else `/auth/firebase` returns 503 "not configured").
- `apps/mobile/.env` has the four `EXPO_PUBLIC_FIREBASE_*` values *before* `expo export` (else the Google button is hidden and OTP falls back to the old non-working flow). `scripts/deploy-web.ps1` writes it via `firebase apps:sdkconfig`.

| Symptom | Fix |
|---|---|
| No "Continue with Google" button | Web build made without `EXPO_PUBLIC_FIREBASE_*`: fill `apps/mobile/.env`, re-export, redeploy Hosting. `scripts/deploy-web.ps1` now refuses to deploy a bundle without the config. Both `/auth/login` and `/auth/register` (bento sign-up page) show the button |
| "This sign-in method is not enabled" | Enable Google / Phone in Firebase Authentication |
| `auth/configuration-not-found` / "Sign-in is not set up for this Firebase project" | Authentication was never initialised on the project the web build points at: console → Authentication → **Get started**, enable Google. If `apps/mobile/.env` `EXPO_PUBLIC_FIREBASE_PROJECT_ID` isn't the deploy project, delete the file and rerun `deploy-web.ps1 -SkipApi` |
| "not authorised for sign-in" (`auth/unauthorized-domain`) | Add the domain under Authentication → Settings → Authorized domains |
| `/auth/firebase` 503 "not configured" | Redeploy Cloud Run with `--set-env-vars="FIREBASE_PROJECT_ID=<project>"` |
| `/auth/firebase` 401 "Invalid or expired sign-in token" | Website and API point at different Firebase projects |
| Complete-profile 404 "Society code not found" | Use the code shown on the admin dashboard (e.g. `AMA-001`); names no longer work |
| Complete-profile 409 | Email or phone already registered; sign in instead |

## Diagnose in this order

1. **API direct:** `Invoke-RestMethod -Method Post -Uri "$API/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"resident@ama.com","password":"password123"}'`
2. **Through the website:** same request to `https://<project>.web.app/api/v1/auth/login`.
3. **Logs:** `gcloud run services logs read ama-api --region=asia-south1 --limit=40`
4. **Redis scheme, safe to share:** `$u=[uri](gcloud secrets versions access latest --secret=REDIS_URL); "$($u.Scheme) $($u.Host) $($u.Port)"`

A 500 on (1) means a backing service problem, so read the logs. (1) OK but (2) failing means Firebase is on a different project (`firebase use`), or Hosting wasn't redeployed.

## Known errors, and the fix for each

| Symptom | Fix |
|---|---|
| `gcloud` / `firebase` "not recognized" | Install (winget or the Google installer), then open a **new** PowerShell window |
| `NoNewline` parameter not found | Use the `Save-Secret` / `Update-Secret` helpers above |
| `Unable to read file [cloudbuild.yaml]` | Wrong branch or folder: `git checkout claude/deploy-setup; git pull` |
| Build uploads ~50k files / 600 MB | `.gcloudignore` must use plain names (`node_modules/`), not `**/` patterns |
| `storage.objects.get access` denied in build | Grant `roles/cloudbuild.builds.builder` to the compute service account, wait 1 min |
| "Building using Buildpacks" / placeholder image / region prompt | Deploy ran without `--image` or with the wrong name: use the verbatim command |
| `Invalid secret spec 'DATABASE_URL:postgresql://…'` | Real value typed into `--set-secrets`: use the verbatim command |
| `TypeError: Invalid URL` in ioredis | `REDIS_URL` is placeholder or malformed: `Update-Secret` with the real `rediss://` URL, redeploy |
| `read ECONNRESET` / `MaxRetriesPerRequestError` | `REDIS_URL` is `redis://` (Upstash's redis-cli snippet puts TLS in a separate `--tls` flag), or the Upstash DB is paused. Fix the scheme in place: `$v=(gcloud secrets versions access latest --secret=REDIS_URL \| Out-String).Trim() -replace '^.*?(rediss?://)','$1' -replace '^redis://','rediss://'; Update-Secret REDIS_URL $v`, then redeploy |
| `STARTUP TCP probe failed … 8080` | The API crashed on start; the real cause is the log line before it |
| Seed: `Unique constraint failed … (email)` | Old seed script: `git pull`. The current seed is idempotent (society `AMA-001`) and safe to re-run |
| Website "Invalid email or password" | API returned 401. Test (1); seed if there are no users |
| Website "server error 404" | `/api` rewrite not reaching Cloud Run: same project, `asia-south1`, redeploy Hosting |
| Console shows nothing | Browser is on a different project (e.g. `ama-society-f2fdb`); switch the picker to the CLI project |

## Removing an unused society

`cd packages\api; $env:DATABASE_URL="<Neon string>"; npx ts-node prisma/delete-empty-society.ts AMA-002` runs a dry run first; add `--yes` to delete. The script refuses if the society has any users or activity, and deletes the society, its flats, charge templates and facilities in one transaction. Run it only after the API with the society-code migration has deployed.

## Guardrails

- Never ask the user to paste secrets, and remind them to blank passwords in screenshots. If one leaks, have them reset it in Neon/Upstash, then `Update-Secret` and redeploy.
- The sandbox where Claude runs usually cannot reach `*.run.app` or Expo servers. Ask the user to run checks and paste the output rather than claiming a result.
- Demo users use `password123` (`resident@ama.com`, `admin@ama.com`, `guard@ama.com`). Remind the user to change them before real residents use the app.
- Open follow-up: several endpoints trust a `societyId` sent by the client instead of the JWT. Flag it before a second society is onboarded.
