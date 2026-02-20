package com.hardware.marketplace

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        android.util.Log.d("FCM", "Message received from: ${remoteMessage.from}")
        
        // Handle FCM messages here.
        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Hardware System"
        val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "New notification received"
        val sound = remoteMessage.data["sound"] ?: remoteMessage.notification?.sound ?: "default"
        val url = remoteMessage.data["url"] ?: ""
        
        android.util.Log.d("FCM", "Title: $title, Body: $body, Sound: $sound, URL: $url")
        sendNotification(title, body, sound, url)
    }

    override fun onNewToken(token: String) {
        // Send token to server if needed
    }

    private fun sendNotification(title: String, messageBody: String, soundName: String, url: String) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        
        // Handle Deep Linking
        if (url.isNotEmpty()) {
            val fullUrl = if (url.startsWith("http")) url else "https://hardware-eccomerce.vercel.app$url"
            intent.data = Uri.parse(fullUrl)
            android.util.Log.d("FCM", "Setting intent data to: $fullUrl")
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Determine sound URI
        var soundUri: Uri? = null
        val channelId: String
        
        if (soundName != "default" && soundName.isNotEmpty()) {
            val resId = resources.getIdentifier(soundName, "raw", packageName)
            if (resId != 0) {
                soundUri = Uri.parse("android.resource://$packageName/${resId}")
                // Use a specific channel for this sound to ensure it plays correctly
                channelId = "channel_${soundName}_v3"
            } else {
                soundUri = Uri.parse("android.resource://$packageName/${R.raw.notification}")
                channelId = "hardware_notification_channel_v3"
            }
        } else {
            soundUri = Uri.parse("android.resource://$packageName/${R.raw.notification}")
            channelId = "hardware_notification_channel_v3"
        }

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(androidx.core.content.ContextCompat.getColor(this, R.color.brand_primary))
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create Channel for Oreo+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelNameString = if (channelId.startsWith("channel_")) "Special Notifications" else "General Notifications"
            val channelName = "$channelNameString v3"
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for $channelName"
                if (soundUri != null) {
                    val audioAttributes = AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build()
                    setSound(soundUri, audioAttributes)
                }
            }
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
