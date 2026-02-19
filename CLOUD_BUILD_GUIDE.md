# ☁️ How to Build Your APK Online (No Android Studio Required)

Since you are low on disk space, the best option is to let **GitHub** handle the heavy lifting. You do **NOT** need to install anything on your computer.

I have already created a special file: `.github/workflows/build-apk.yml`. 
This file tells GitHub to automatically build your Android app whenever you push code.

## 🚀 Step 1: Push Your Code to GitHub

Open your terminal in `c:\vasu\hardware_system` and run these commands:

```bash
git add .
git commit -m "Add Android project and build workflow"
git push origin master
```
*(If you haven't set up a remote "origin" yet, you'll need to create a new repository on GitHub.com and follow their instructions to push.)*

## 📥 Step 2: Download Your APK

1.  Go to your repository on **GitHub.com**.
2.  Click on the **Actions** tab at the top.
3.  You will see a workflow run named **"Build Android APK"** (or similar based on your commit message).
4.  Click on that run.
5.  Wait for it to finish (it takes ~5-10 minutes).
6.  Once finished (green checkmark), scroll down to the **"Artifacts"** section.
7.  Click on **`app-debug`** to download a ZIP file.
8.  Extract the ZIP. You will find `app-debug.apk`.

## 📱 Step 3: Install on Phone

1.  Transfer `app-debug.apk` to your phone (via USB, Google Drive, or email).
2.  Tap to install.
3.  Enjoy your native app!

---

## 💾 Alternative: Determine to Install Android Studio? (If you have >10GB space)

If you still want to install Android Studio yourself:
1.  **Download Link**: [https://developer.android.com/studio](https://developer.android.com/studio)
2.  **Size Warning**: The installer is ~1GB, but after installation and SDK downloads, it will consume **5GB - 10GB** of space.
3.  **Space Saving Valid Tips**:
    *   During installation, uncheck "Android Virtual Device" (saves ~2GB).
    *   Only install the latest SDK Platform (Android 14/API 34).
4.  **Steps**: Import the folder `c:\vasu\hardware_system\android-project`.
