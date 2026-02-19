package com.hardware.marketplace

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import android.content.Intent
import android.net.Uri
import com.google.firebase.messaging.FirebaseMessaging

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun openExternalLink(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }
    
    @JavascriptInterface
    fun getFCMToken(): String {
        // This is a synchronous call from JS, but getting token is async.
        // Better pattern: JS calls 'requestToken()', Android gets it and calls JS back 'onTokenReceived(token)'
        // But for simplicity, let's try to return what we have cached or trigger the async flow.
        
        var token = ""
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                token = task.result
                Log.d("FCM", "Token retrieved: $token")
                // Since interface methods run on a background thread, we can't easily wait.
                // Best practice: JS calls 'requestFCMToken', Android calls 'window.onReceiveFCMToken(token)'
            }
        }
        return token // This will return empty string initially. 
    }
    
    @JavascriptInterface
    fun requestFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d("FCM", "Sending token to Web: $token")
                
                // Call back into WebView
                if (context is MainActivity) {
                    context.runOnUiThread {
                        context.sendTokenToWeb(token)
                    }
                }
            } else {
                Log.w("FCM", "Fetching FCM registration token failed", task.exception)
            }
        }
    }
}
