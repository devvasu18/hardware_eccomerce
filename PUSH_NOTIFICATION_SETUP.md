# 🔔 Setup Push Notifications (Android Background)

To receive notifications when the app is **closed**, we must use **Firebase Cloud Messaging (FCM)**.

Since `Socket.io` only works when the app is open, FCM is the standard for mobile push notifications.

## 🛑 Prerequisite: You MUST do this manually

I (AI) cannot create a Firebase project for you. You must do this:

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** -> Name it "Hardware Marketplace".
3.  Click **"Android"** icon to add an app.
    *   **Package Name**: `com.hardware.marketplace` (Must match perfectly).
    *   **App Nickname**: Hardware App.
    *   **SHA-1**: Optional (Skip for now).
4.  **Download `google-services.json`**.
5.  **Enable Cloud Messaging**:
    *   Go to Project Settings -> Cloud Messaging.
    *   Make sure it is enabled.
6.  **Generate Private Key for Backend**:
    *   Go to Project Settings -> Service Accounts.
    *   Click **"Generate new private key"**.
    *   Save this file as `firebase-service-account.json`.

---

## 📂 Step 1: Place the Files

1.  **Android File**:
    *   Rename the downloaded file to `google-services.json`.
    *   Place it `c:\vasu\hardware_system\android-project\app\google-services.json`.

2.  **Backend File**:
    *   Rename the private key to `firebase-service-account.json`.
    *   Place it in `c:\vasu\hardware_system\backend\config\firebase-service-account.json`.

---

## 🤖 Step 2: I Will Update the Android Code

I am now going to update your Android project to:
1.  Install Firebase SDK.
2.  Create a "Messaging Service" to catch notifications.
3.  Expose the FCM Token to your Web App so we can save it to the user's profile.

## 🖥️ Step 3: I Will Update the Backend

I will add a script to:
1.  Connect to Firebase.
2.  Send a Push Notification whenever an order is placed.

**Ready? I will start generating the code now.**
