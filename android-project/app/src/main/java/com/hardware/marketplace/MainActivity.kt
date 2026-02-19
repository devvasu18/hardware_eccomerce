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

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    
    // Configure your domain here
    private val APP_DOMAIN = "hardware-eccomerce.vercel.app"
    private val START_URL = "https://$APP_DOMAIN"
    
    // User Agent suffix for detection
    private val USER_AGENT_SUFFIX = " AndroidApp/1.0"

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        setupWebView()
        
        // Check for updates
        checkForUpdates()

        // Handle Deep Links
        handleIntent(intent)
        
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

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        }
    }

    private fun checkForUpdates() {
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
                            showUpdateDialog(downloadUrl, messages)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    private fun showUpdateDialog(downloadUrl: String, messages: org.json.JSONObject) {
        val lang = java.util.Locale.getDefault().language
        val isHindi = lang == "hi"
        val msgObj = if (isHindi && messages.has("hi")) messages.getJSONObject("hi") else messages.getJSONObject("en")
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(msgObj.getString("title"))
            .setMessage(msgObj.getString("message"))
            .setPositiveButton(msgObj.getString("button")) { _, _ ->
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                startActivity(intent)
            }
            .setCancelable(false) // Force user to see it, though back button dismisses
            .show()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data: Uri? = intent?.data
        if (data != null && data.host == APP_DOMAIN) {
            webView.loadUrl(data.toString())
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
