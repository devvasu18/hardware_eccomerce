# Android APK Conversion Guide for Next.js App

This guide outlines the architecture, implementation steps, and best practices for converting your Next.js application into a production-ready Android APK.

## 🧱 Architecture Overview

The architecture follows a hybrid approach where the Android app acts as an intelligent shell around your Next.js web application.

```
Next.js (Web/PWA)  <-->  Android Native Shell (WebView)  <-->  Native Features (Bridge)
```

### Key Components

1.  **Next.js App**: Serves the UI and logic. Responsible for detecting the "App Mode" environment and adjusting the UI (e.g., hiding browser-specific headers/footers).
2.  **Android Native Shell**: A Kotlin-based Android application that hosts a `WebView`. It handles:
    *   System UI (Status bar, Navigation bar)
    *   Deep Linking
    *   Native Navigation (Back button)
    *   External Link Interception (Custom Tabs)
    *   Payment Gateway Integration (Preventing payment pages from opening in WebView)
3.  **JavaScript Bridge**: A communication layer allowing the web app to trigger native actions (e.g., specific toasts, haptics, or share dialogs).

---

## 📋 Web Rules Checklist (Next.js Side)

Ensure your Next.js application adheres to these rules for a seamless app experience:

- [ ] **Manifest & Metadata**:
    - [ ] Create `public/manifest.json` with `display: standalone`.
    - [ ] Set `theme_color` and `background_color` to match your app's branding.
    - [ ] Ensure high-resolution icons are available.
- [ ] **Environment Detection**:
    - [ ] Implement `isAppMode()` utility (detects user agent or injected JS object).
    - [ ] Conditionally hide web-only headers/footers when `isAppMode()` is true.
- [ ] **Navigation**:
    - [ ] Use `next/link` for all internal transitions (SPA behavior).
    - [ ] Ensure back button history state is managed correctly.
- [ ] **Styling**:
    - [ ] Disable text selection on UI elements (`user-select: none`).
    - [ ] Remove hover states for touch devices if they cause "sticky" styles.
    - [ ] Use system fonts or bundle fonts for fast loading.
    - [ ] Add skeleton loaders to mask network latency.
- [ ] **Link Handling**:
    - [ ] Internal links -> `next/link` (handled by WebView client).
    - [ ] External links (social, partners) -> `<a>` tags with specific attributes or intercepted by Android to open in *Chrome Custom Tabs*.
    - [ ] Payment links -> Intercepted by Android to open in Custom Tabs or external browser.

---

## 🤖 Android Rules Checklist (Native Shell)

The Android implementation must strictly follow these rules:

- [ ] **WebView Configuration**:
    - [ ] Enable JavaScript (`settings.javaScriptEnabled = true`).
    - [ ] Enable DOM Storage (`settings.domStorageEnabled = true`).
    - [ ] Set a custom User-Agent string (e.g., append `; AndroidApp/1.0`) for detection.
    - [ ] **DISABLE** file access (`settings.allowFileAccess = false`) for security.
- [ ] **Client Handling (`WebViewClient`)**:
    - [ ] Override `shouldOverrideUrlLoading`.
    - [ ] **Strategy**:
        - If URL host matches your domain -> return `false` (load in WebView).
        - If URL is a payment gateway (Paytm, Razorpay, etc.) -> Open in Custom Tab/External Browser.
        - If URL is external (social media) -> Open in Custom Tab.
        - If URL is a simplified scheme (tel:, mailto:, market:) -> Handle with native Intents.
- [ ] **Chrome Custom Tabs**:
    - [ ] Use for all external content and payment flows.
    - [ ] Customize the toolbar color to match your app.
- [ ] **Back Button Logic**:
    - [ ] Override `onBackPressed`.
    - [ ] If `webView.canGoBack()` -> `webView.goBack()`.
    - [ ] Else -> Default system behavior (exit app).
- [ ] **Deep Linking**:
    - [ ] Configure `assetlinks.json` on your website (`.well-known/assetlinks.json`).
    - [ ] Add Intent Filters in `AndroidManifest.xml` for your domain.

---

## 💳 Secure Payment Flow Design

**Crucial Rule**: Never run payment gateways directly inside the main WebView. It is insecure and often blocked by providers (e.g., Google Pay).

**Recommended Flow**:
1.  User clicks "Pay" in Next.js app.
2.  Next.js redirects to a payment URL or initiates a payment SDK script.
3.  **Android Interception**:
    - The `WebViewClient` detects a navigation to a payment provider domain (e.g., `secure.paytm.in`, `api.razorpay.com`).
    - The app **stops** the WebView load.
    - The app opens the URL in a **Chrome Custom Tab** (CCT).
4.  User completes payment in the CCT.
    - CCT shares cookies/session with the system browser (usually), making it robust.
5.  **Return Handling**:
    - Payment gateway redirects to your `success_url` (e.g., `https://your-site.com/payment/success`).
    - **Deep Link Catch**: The Android app has an Intent Filter for `https://your-site.com/payment/*`.
    - The OS brings your App to the foreground.
    - The `MainActivity` catches the `onNewIntent`.
    - The app instructs the main WebView to load the success URL or triggers a JS function to update the UI.
    - The CCT is closed automatically or by user.

---

## 🔗 Link Handling Strategy

| Link Type | Example | Action | Implementation Mechanism |
| :--- | :--- | :--- | :--- |
| **Internal** | `/product/123` | Load in WebView | `shouldOverrideUrlLoading` returns `false` |
| **External** | `instagram.com` | Open in Custom Tab | `shouldOverrideUrlLoading` launches `CustomTabsIntent` |
| **Payment** | `razorpay.com` | Open in Custom Tab | Regex match in `shouldOverrideUrlLoading` |
| **System** | `tel:123`, `mailto:` | Launch Native Intent | `Intent(ACTION_VIEW)` |
| **Deep Link** | `app://` or `https://yoursite.com/...` | Launch App Activity | `AndroidManifest` Intent Filter |

---

## 📦 Deliverables & Files

Implementation files are located in `android-shell-source/`:
1.  **`MainActivity.kt`**: Main logic for WebView and link handling.
2.  **`WebAppInterface.kt`**: JS Bridge class.
3.  **`AndroidManifest.xml`**: Configuration and permissions.

Web implementation files:
1.  `public/manifest.json`: Web Manifest.
2.  `src/utils/app-bridge.ts`: Environment detection.

