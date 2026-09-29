# Deploying AMA Society

| Piece | Where | How |
|---|---|---|
| NestJS API | Google Cloud Run (`ama-api`, `asia-south1`) | `packages/api/Dockerfile` |
| PostgreSQL 16 | Cloud SQL (or Neon) | `DATABASE_URL` |
| Redis 7 | Memorystore (or Upstash) | `REDIS_URL` |
| Web app | Firebase Hosting | `firebase.json`, serves `apps/mobile/dist`, proxies `/api/**` to Cloud Run |
| Android / iOS | Expo EAS Build + Submit | `apps/mobile/eas.json` |

All commands run from the repo root unless noted. They are written for bash; on Windows, see [Windows (PowerShell)](#windows-powershell) at the end. Replace `PROJECT_ID` with your Google Cloud / Firebase project id.

## 1. Google Cloud project

```bash
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com
```

Create Postgres and Redis (or use Neon / Upstash and skip this):

```bash
gcloud sql instances create ama-db --database-version=POSTGRES_16 \
  --region=asia-south1 --tier=db-f1-micro
gcloud sql databases create ama_db --instance=ama-db
gcloud sql users create ama --instance=ama-db --password='CHOOSE_A_PASSWORD'
```

Store secrets (never commit them):

```bash
printf '%s' 'postgresql://ama:PASSWORD@localhost/ama_db?host=/cloudsql/PROJECT_ID:asia-south1:ama-db' \
  | gcloud secrets create DATABASE_URL --data-file=-
openssl rand -hex 32 | gcloud secrets create JWT_SECRET --data-file=-
openssl rand -hex 32 | gcloud secrets create JWT_REFRESH_SECRET --data-file=-
printf '%s' 'redis://HOST:6379' | gcloud secrets create REDIS_URL --data-file=-
printf '%s' 'YOUR_RAZORPAY_KEY_SECRET' | gcloud secrets create RAZORPAY_KEY_SECRET --data-file=-
```

The Cloud Run service account needs `roles/secretmanager.secretAccessor` and `roles/cloudsql.client`.

## 2. API on Cloud Run

```bash
gcloud artifacts repositories create ama --repository-format=docker --location=asia-south1
gcloud builds submit --config cloudbuild.yaml .

gcloud run deploy ama-api --region=asia-south1 \
  --image=asia-south1-docker.pkg.dev/PROJECT_ID/ama/ama-api \
  --add-cloudsql-instances=PROJECT_ID:asia-south1:ama-db \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET:latest \
  --allow-unauthenticated --min-instances=1
```

With Neon/Upstash instead of Cloud SQL, drop the `--add-cloudsql-instances` line.

The container runs `prisma migrate deploy` on start. Seed demo data once, if wanted, with `npx ts-node prisma/seed.ts` from `packages/api` against the same `DATABASE_URL`.

Memorystore is only reachable through a VPC connector (`--vpc-connector`); Upstash or another public Redis avoids that.

## 3. Web app on Firebase Hosting

```bash
npm i -g firebase-tools
firebase login            # or: export GOOGLE_APPLICATION_CREDENTIALS=sa.json
firebase use --add PROJECT_ID
cd apps/mobile && npx expo export -p web && cd ../..
firebase deploy --only hosting
```

The web app calls `/api/v1` on its own origin; `firebase.json` rewrites `/api/**` to the `ama-api` Cloud Run service, so no CORS or API URL setup is needed. Firebase Hosting does not proxy WebSockets, so live chat/bidding on web needs `EXPO_PUBLIC_API_URL` pointed at the Cloud Run URL directly.

## 4. Mobile builds with Expo EAS

```bash
cd apps/mobile
npm i -g eas-cli
eas login                 # or: export EXPO_TOKEN=...
eas init                  # links app.json to your Expo project (adds extra.eas.projectId)
EXPO_PUBLIC_API_URL=https://ama-api-XXXX.a.run.app/api/v1 eas build -p android --profile preview      # installable APK
EXPO_PUBLIC_API_URL=https://ama-api-XXXX.a.run.app/api/v1 eas build -p android --profile production   # Play Store AAB
eas submit -p android --profile production   # needs google-service-account.json, see docs/play-store
```

Set `EXPO_PUBLIC_API_URL` as an EAS environment variable (`eas env:create`) so every build gets it.

## Windows (PowerShell)

Install the tools (then open a **new** PowerShell window so `PATH` updates):

```powershell
winget install --id Google.CloudSDK -e
winget install --id OpenJS.NodeJS.LTS -e
npm install -g firebase-tools eas-cli pnpm@9
```

Differences from the bash commands above:

- **Line continuation** is a backtick `` ` `` instead of `\`, or put the whole command on one line.
- **Secrets:** piping a string adds a newline in PowerShell, so write the value to a file without one:

  ```powershell
  Set-Content -NoNewline -Path secret.txt -Value "postgresql://..."
  gcloud secrets create DATABASE_URL --data-file=secret.txt
  Remove-Item secret.txt
  ```

- **Random JWT secrets** (instead of `openssl rand -hex 32`):

  ```powershell
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  -join ($b | ForEach-Object { '{0:x2}' -f $_ }) | Set-Content -NoNewline secret.txt
  ```

- **Build env var for EAS:** `$env:EXPO_PUBLIC_API_URL = "https://ama-api-XXXX.a.run.app/api/v1"` on its own line, then run `eas build ...`.
