# Google Play Console — Data Safety Form Questionnaire Guide

Google Play requires all developers to declare how their app collects and shares user data. Use this guide to fill out the **Data Safety** questionnaire in the Google Play Console accurately.

---

## Section 1: Overview & Data Collection Confirmation

| Question | Answer | Notes |
| :--- | :--- | :--- |
| **Does your app collect or share any of the required user data types?** | **Yes** | App collects account details, gate passes, and telemetry for society management. |
| **Is all of the user data collected by your app encrypted in transit?** | **Yes** | All network traffic uses TLS 1.3 / HTTPS. |
| **Do you provide a way for users to request that their data is deleted?** | **Yes** | Users can request account deletion in-app or via support email. |

---

## Section 2: Data Types & Usage Declarations

### 1. Location Data
- **Approximate Location**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality (rendering nearest society gate and transit routes).
  - *Ephemeral (processed in memory and not logged permanently)?* **Yes**.
- **Precise Location**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality (live GPS route polyline and driver bearing calculation for cabs and Bazaar deliveries).
  - *Optional or Required:* **Optional** (users can still enter manual addresses without enabling GPS).

### 2. Personal Info
- **Name**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality & Account Management (Resident flat roster, visitor pass recipient, guard name).
- **Email Address**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* Account Management & Security.
- **Phone Number**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality (OTP authentication, security guard gate intercom verification, WhatsApp gate pass dispatch).
  - *Masked:* **Yes** (Masked on screens to non-admin users).

### 3. Financial Info
- **User Payment Info**: Collected? **No**.
  - *Note:* Payment processing (UPI / Cards) is delegated to third-party payment gateways (e.g. Razorpay / UPI apps). AMA does not collect or store credit card numbers.
- **Purchase History**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality (Society maintenance payment receipts and Bazaar Mart order history).

### 4. Photos and Videos
- **Photos / Videos**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* App Functionality (Attaching maintenance ticket evidence, contractor inspection video).
  - *Optional or Required:* **Optional** (only collected when user actively taps "Record Video" or "Attach Photo").

### 5. App Activity & Performance
- **App Interactions**: Collected? **No** (No third-party analytics trackers like Adjust/AppsFlyer).
- **Crash Logs / Diagnostics**: Collected? **Yes**. Shared? **No**.
  - *Purpose:* Analytics & Bug Fixes (Crash reporting via Expo/Hermes).

---

## Section 3: Data Safety Summary Badge

Once you submit these answers, Google Play Console will display the following badges on your store listing:

- 🔒 **Data is encrypted in transit**
- 🗑️ **You can request that data be deleted**
- 🚫 **No data shared with third-party advertising companies**
- 🛡️ **Committed to follow the Play Families / Security policies**
