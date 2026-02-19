package com.hardware.marketplace

import android.content.Context
import android.webkit.JavascriptInterface
import android.widget.Toast
import android.content.Intent
import android.net.Uri

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
}
