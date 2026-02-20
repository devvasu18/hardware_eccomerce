package com.hardware.marketplace

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat

import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateOptions
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.os.Build

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var nativeSkeleton: androidx.constraintlayout.widget.ConstraintLayout
    
    // Configure your domain here
    private val APP_DOMAIN = "hardware-eccomerce.vercel.app"
    private val START_URL = "https://$APP_DOMAIN"
    
    // User Agent suffix for detection
    private val USER_AGENT_SUFFIX = " AndroidApp/1.0"

    private val REQUEST_NOTIFICATION_PERMISSION = 1001
    private val UPDATE_REQUEST_CODE = 1002
    private lateinit var appUpdateManager: AppUpdateManager

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        nativeSkeleton = findViewById(R.id.native_skeleton)
        
        setupWebView()
        
        // Request Notification Permission for Android 13+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
             if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                 if (shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS)) {
                     // Show rationale
                     androidx.appcompat.app.AlertDialog.Builder(this)
                         .setTitle("Notification Permission Required")
                         .setMessage("This app uses notifications to update you on your order status. Please grant the permission to receive updates.")
                         .setPositiveButton("Grant") { _, _ ->
                             androidx.core.app.ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATION_PERMISSION)
                         }
                         .setNegativeButton("No Thanks", null)
                         .show()
                 } else {
                     // Directly request
                     androidx.core.app.ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATION_PERMISSION)
                 }
             }
        }

        // Initialize Play Store update manager
        appUpdateManager = AppUpdateManagerFactory.create(this)
        
        // Start check for updates (Both Play Store and GitHub Fallback)
        checkForUpdates()

        // Initialize Notification Channels
        createNotificationChannels()
        
        // Handle Deep Links
        val isDeepLinkHandled = handleIntent(intent)
        
        // ... existing back button logic ...
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, callback)

        if (savedInstanceState == null && !isDeepLinkHandled) {
            webView.loadUrl(START_URL)
        }
    }

    fun hideSkeleton() {
         if (nativeSkeleton.visibility == android.view.View.VISIBLE) {
             webView.alpha = 0f
             webView.visibility = android.view.View.VISIBLE
             webView.animate().alpha(1f).setDuration(300).start()
             
             nativeSkeleton.animate().alpha(0f).setDuration(400).withEndAction {
                 nativeSkeleton.visibility = android.view.View.GONE
             }.start()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_NOTIFICATION_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                // Permission granted, request token now
                val jsBridge = WebAppInterface(this)
                jsBridge.requestFCMToken()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Check for updates that might be "stalled" or in progress
        appUpdateManager.appUpdateInfo.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                // Resume the update if it's an immediate one
                appUpdateManager.startUpdateFlowForResult(
                    appUpdateInfo,
                    this,
                    AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
                    UPDATE_REQUEST_CODE
                )
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == UPDATE_REQUEST_CODE) {
            if (resultCode != RESULT_OK) {
                // Update failed or cancelled by user
                // You can log this or show a message if it was a "Force Update"
            }
        }
    }

    private fun checkForUpdates() {
        // 1. Try Google Play Store Updates First (Production)
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo
        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
            ) {
                // Request the update
                appUpdateManager.startUpdateFlowForResult(
                    appUpdateInfo,
                    this,
                    AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
                    UPDATE_REQUEST_CODE
                )
            } else {
                // 2. Fallback to GitHub check (Development/Sideload)
                checkGitHubUpdates()
            }
        }.addOnFailureListener {
            // Play Store check failed (likely not installed from Play Store), use GitHub fallback
            checkGitHubUpdates()
        }
    }

    private fun checkGitHubUpdates() {
        Thread {
            try {
                val url = java.net.URL("https://$APP_DOMAIN/app-version.json")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                
                if (connection.responseCode == 200) {
                    val stream = connection.inputStream
                    val reader = java.io.BufferedReader(java.io.InputStreamReader(stream))
                    val jsonStr = reader.readText()
                    reader.close()
                    
                    val json = org.json.JSONObject(jsonStr)
                    val remoteVersion = json.getInt("versionCode")
                    val forceUpdate = json.optBoolean("forceUpdate", false)
                    val downloadUrl = json.getString("downloadUrl")
                    val messages = json.getJSONObject("messageData")
                    
                    // Get current app version
                    val packageInfo = packageManager.getPackageInfo(packageName, 0)
                    val currentVersion = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                        packageInfo.longVersionCode.toInt()
                    } else {
                        @Suppress("DEPRECATION")
                        packageInfo.versionCode
                    }

                    if (remoteVersion > currentVersion) {
                        runOnUiThread {
                            showUpdateDialog(downloadUrl, messages, forceUpdate)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    private fun showUpdateDialog(downloadUrl: String, messages: org.json.JSONObject, isForce: Boolean) {
        val lang = java.util.Locale.getDefault().language
        val isHindi = lang == "hi"
        val msgObj = if (isHindi && messages.has("hi")) messages.getJSONObject("hi") else messages.getJSONObject("en")
        
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(msgObj.getString("title"))
            .setMessage(msgObj.getString("message"))
            .setPositiveButton(msgObj.getString("button")) { _, _ ->
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                startActivity(intent)
            }
        
        if (isForce) {
            builder.setCancelable(false)
        } else {
            builder.setNegativeButton(if (isHindi) "बाद में" else "Later", null)
        }
        
        builder.show()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?): Boolean {
        // Log all extras for debugging notification clicks
        intent?.extras?.let { extras ->
            for (key in extras.keySet()) {
                android.util.Log.d("NotificationDebug", "Extra: $key = ${extras.get(key)}")
            }
        }

        var data: Uri? = intent?.data
        
        // Fallback to 'url' extra (FCM background notifications)
        if (data == null && intent?.hasExtra("url") == true) {
            val urlStr = intent.getStringExtra("url")
            if (urlStr != null && urlStr.isNotEmpty()) {
                val fullUrl = if (urlStr.startsWith("http")) urlStr else "https://$APP_DOMAIN$urlStr"
                data = Uri.parse(fullUrl)
            }
        }

        if (data != null && data.host == APP_DOMAIN) {
            webView.loadUrl(data.toString())
            return true
        }
        return false
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // 1. Default Channel with Explicit Sound
            val defaultSoundUri = Uri.parse("android.resource://$packageName/${R.raw.notification}")
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build()

            val defaultChannel = NotificationChannel(
                "hardware_notification_channel_v3",
                "General Notifications v3",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Used for general app notifications"
                setSound(defaultSoundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(defaultChannel)

            // 2. Custom Sound Channels
            val customSounds = listOf(
                "notification",
                "order_alert",
                "payment_success",
                "payment_success_chime"
            )

            for (soundName in customSounds) {
                val resId = resources.getIdentifier(soundName, "raw", packageName)
                if (resId != 0) {
                    val soundUri = Uri.parse("android.resource://$packageName/$resId")
                    val audioAttributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build()

                    val channelId = "channel_${soundName}_v3"
                    val channelName = soundName.replace("_", " ").capitalize()
                    
                    val channel = NotificationChannel(
                        channelId,
                        "$channelName Notifications v3",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        setSound(soundUri, audioAttributes)
                        description = "Notifications with $channelName sound"
                    }
                    notificationManager.createNotificationChannel(channel)
                }
            }
        }
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false // Security: Disable file access
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW // Security: HTTPS only
        
        // Custom User Agent
        settings.userAgentString = settings.userAgentString + USER_AGENT_SUFFIX

        // JS Bridge
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val host = request?.url?.host ?: ""

                // 1. Internal Links -> Load in WebView
                if (host.contains(APP_DOMAIN)) {
                    return false
                }

                // 2. Payment Gateways -> Open in Custom Tab
                // Add your payment gateway domains here
                val isPayment = url.contains("razorpay") || 
                                url.contains("paytm") || 
                                url.contains("stripe") || 
                                url.contains("paypal")
                
                if (isPayment) {
                    openInCustomTab(url)
                    return true
                }

                // 3. External Links (Social, etc) -> Open in Custom Tab
                openInCustomTab(url)
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Show loader if needed
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Hide loader logic if implemented
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: android.webkit.WebResourceError?) {
                 // Check if it's a main frame error (not just a missing image)
                 if (request?.isForMainFrame == true) {
                     view?.loadUrl("file:///android_asset/offline.html")
                 }
            }
        }
        
        webView.webChromeClient = object : WebChromeClient() {
             override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                // Forward console logs to Logcat for debugging
                android.util.Log.d("WebViewConsole", consoleMessage?.message() ?: "")
                return true
            }
        }
    }

    fun sendTokenToWeb(token: String) {
        val js = "javascript:window.onReceiveFCMToken('$token')"
        webView.evaluateJavascript(js, null)
    }

    private fun openInCustomTab(url: String) {
        try {
            val builder = CustomTabsIntent.Builder()
            builder.setShowTitle(true)
            builder.setToolbarColor(ContextCompat.getColor(this, R.color.brand_primary))
            
            val customTabsIntent = builder.build()
            customTabsIntent.launchUrl(this, Uri.parse(url))
        } catch (e: Exception) {
            // Fallback to external browser
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        }
    }
}
