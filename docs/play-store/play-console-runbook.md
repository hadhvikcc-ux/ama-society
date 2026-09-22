# Google Play Store Publishing & Release Runbook

Follow this step-by-step guide to build, package, and upload **AMA - Smart Society SuperApp** (`com.ama.society`) to the **Google Play Store**.

---

## Phase 1: Prerequisites Check

1. **Google Play Console Account**:
   - Register at [play.google.com/console](https://play.google.com/console) with a $25 one-time developer fee.
2. **Expo Account**:
   - Create a free account at [expo.dev](https://expo.dev) if you don't already have one.
   - Run: `npx.cmd eas-cli login` in your terminal to authenticate.

---

## Phase 2: Building the Production Android App Bundle (.aab)

Google Play Store exclusively accepts the **Android App Bundle (.aab)** format for new app submissions (APKs are only used for local test sideloading).

### Option A: Cloud Build via EAS (Fastest & Recommended)

From the project root or `apps/mobile`:

```powershell
cd C:\Users\Hadhv\.gemini\antigravity\scratch\ama\apps\mobile

# 1. Log in to Expo
npx.cmd eas-cli login

# 2. Configure the project with your Expo organization/account
npx.cmd eas-cli project:init

# 3. Trigger the Production Android App Bundle build
pnpm run build:android
# Or directly:
npx.cmd eas-cli build --platform android --profile production
```

**What EAS Build does automatically:**
- Generates and securely stores your **Android Keystore** (used to sign your app).
- Compiles the project in an isolated cloud container with Target SDK 34/35.
- Produces a production-ready, signed `.aab` file.
- Provides a direct browser download link once finished (usually takes 5–8 minutes).

### Option B: Local Android APK / Bundle Build (Using Local Gradle)

If you prefer building locally without EAS cloud minutes (requires Android Studio / Android SDK):

```powershell
cd C:\Users\Hadhv\.gemini\antigravity\scratch\ama\apps\mobile

# 1. Generate the native android/ directory
npx.cmd expo prebuild --platform android

# 2. Navigate to native android folder and build bundle
cd android
./gradlew bundleRelease
```
The output `.aab` will be located at:
`apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`.

---

## Phase 3: Setting Up the App in Google Play Console

1. **Create New App**:
   - Log in to [Google Play Console](https://play.google.com/console).
   - Click **"Create app"** in the top right.
   - **App name**: `AMA: Smart Society SuperApp`
   - **Default language**: `English (United States)` or `English (India)`
   - **App or game**: `App`
   - **Free or paid**: `Free`
   - Check the Declarations boxes &rarr; click **"Create app"**.

2. **Complete the "Set up your app" Dashboard Checklist**:
   - **Privacy Policy**: Enter the URL where you host `docs/play-store/privacy-policy.html`.
   - **App Access**: Select *"All functionality is available without special access"* (or provide demo resident/admin login credentials for Google reviewers: email `admin@ama.internal`, password `password123`).
   - **Ads**: Select *"No, my app does not contain ads"*.
   - **Content Rating**: Click *"Start questionnaire"* &rarr; Category: *Utility, Productivity, Communication* &rarr; answer "No" to violence, sexual content, etc. &rarr; Save &rarr; results in **Everyone / PEGI 3**.
   - **Target Audience**: Select **18 and over** (avoids strict Google Play Families policy requirements).
   - **News apps**: Select *"No"*.
   - **COVID-19 contact tracing**: Select *"No"*.
   - **Data Safety**: Follow the exact answers in [`docs/play-store/data-safety-guide.md`](file:///C:/Users/Hadhv/.gemini/antigravity/scratch/ama/docs/play-store/data-safety-guide.md).
   - **Government apps**: Select *"No"*.
   - **Financial features**: Select *"No, this app does not provide financial features"* (society maintenance ledger is an internal property utility).

3. **Store Listing Assets**:
   - Navigate to **Grow &rarr; Store presence &rarr; Main store listing**:
   - **Short description**: (Copy from [`docs/play-store/listing.md`](file:///C:/Users/Hadhv/.gemini/antigravity/scratch/ama/docs/play-store/listing.md)).
   - **Full description**: (Copy from [`docs/play-store/listing.md`](file:///C:/Users/Hadhv/.gemini/antigravity/scratch/ama/docs/play-store/listing.md)).
   - **App Icon**: Upload `apps/mobile/assets/icon.png` (512x512).
   - **Feature Graphic**: Upload `apps/mobile/assets/feature-graphic.png` (1024x500).
   - **Phone Screenshots**: Upload at least 2 screenshots showing the Resident Bento Dashboard, Live Google Maps tracking, and Digital Gate Pass.

---

## Phase 4: Releasing to Internal Testing (Instant Verification)

1. In the Google Play Console sidebar, go to **Release &rarr; Testing &rarr; Internal testing**.
2. Click **"Create new release"**:
   - Upload the downloaded `.aab` file (from EAS build or local Gradle build).
   - Release name: `1.0.0 (1) - Initial Release`.
   - Release notes:
     ```
     Initial production build of AMA Smart Society SuperApp.
     Includes digital gate passes, live Google Maps tracking for cabs and mart deliveries, 
     society maintenance billing, and security guard scanner.
     ```
3. Click **"Save"** &rarr; **"Review release"** &rarr; **"Start rollout to Internal testing"**.
4. In the **Testers** tab:
   - Create an email list of testers (e.g. your own email address).
   - Copy the shareable **Join on Android** or **Join on the web** link.
   - Open that link on your Android device to install the app directly from the Google Play Store!

---

## Phase 5: Promoting to Production

1. Once internal testing passes:
   - Go to **Release &rarr; Production**.
   - Click **"Create new release"** &rarr; select the tested App Bundle from Internal testing.
   - Click **"Review and roll out"**.
2. Google typically reviews new applications within **1 to 3 business days**. Once approved, **AMA - Smart Society SuperApp** will be publicly live on the Google Play Store worldwide!
