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

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    
    // Configure your domain here
    private val APP_DOMAIN = "hardware-marketplace.com" // Replace with actual domain
    private val START_URL = "https://$APP_DOMAIN"
    
    // User Agent suffix for detection
    private val USER_AGENT_SUFFIX = " AndroidApp/1.0"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        setupWebView()

        // Handle Deep Links
        handleIntent(intent)

        // Back Button Logic
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    // If no history, exit app
                    finish()
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, callback)

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        }
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
                // Hide loader
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
