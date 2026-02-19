# 📱 Android App Build Guide

I have automatically generated a **Complete Android Studio Project** for you. You do **NOT** need to create files manually.

## 🚀 Quick Start Instructions

1.  **Install Android Studio**: Download and install from [developer.android.com/studio](https://developer.android.com/studio).
2.  **Open the Project**:
    *   Launch Android Studio.
    *   Click **Open**.
    *   Navigate to and select this folder:
        `c:\vasu\hardware_system\android-project`
    *   Click **OK**.
3.  **Wait for Sync**: Android Studio will download Gradle and dependencies. This may take a few minutes.
4.  **Connect Device**: Plug in your Android phone (Enable USB Debugging first).
5.  **Run**: Click the green **Play (▶)** button in the top toolbar.

---

## 🔧 Configuration (Optional)

### Update Production URL
By default, the app points to `hardware-marketplace.com`. To change this:
1.  Open `app/src/main/java/com/hardware/marketplace/MainActivity.kt`.
2.  Change line 25:
    ```kotlin
    private val APP_DOMAIN = "your-website.com"
    ```
    *(For local testing, use your PC's IP address, e.g., `192.168.1.5:3000`)*.

### App Icon
To change the icon:
1.  Right-click `app/src/main/res` in Android Studio.
2.  Select **New > Image Asset**.
3.  Choose your logo file and click **Finish**.

## 🛑 Troubleshooting

*   **"SDK Location not found"**: If prompted, point Android Studio to your SDK folder (usually `C:\Users\YourName\AppData\Local\Android\Sdk`).
*   **"Connection Refused"**: If connecting to localhost, ensure your Next.js app is running on an interface accessible to the network (use `npm run dev -- -H 0.0.0.0` or just rely on your PC's IP).
