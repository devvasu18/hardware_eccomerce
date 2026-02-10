const { sendNotification } = require('./notificationService');

/**
 * Send Password Reset Success Notification
 * Sent after user successfully resets their password
 */
async function sendPasswordResetSuccessNotification(user) {
    const emailTemplate = `Hi {{user_name}},

Your password has been successfully reset for your {{company_name}} account.

🔐 Password Reset Confirmation

✅ Your password was changed on: {{reset_date}} at {{reset_time}}
📧 Account Email: {{user_email}}

If you did not make this change, please contact us immediately:
📞 {{support_contact_number}}
📧 {{support_email}}

🔒 Security Tips:
- Never share your password with anyone
- Use a strong, unique password
- Enable two-factor authentication if available

Thank you for keeping your account secure.

Best regards,  
{{company_name}} Team`;

    const whatsappTemplate = `Hello {{user_name}} 👋

Your password has been successfully reset for your *{{company_name}}* account ✅

🔐 Password Changed: {{reset_date}} at {{reset_time}}

If you did not make this change, contact us immediately:
📞 {{support_contact_number}}

Stay secure! 🔒

Thank you,  
*{{company_name}}*`;

    const now = new Date();
    const resetDate = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const resetTime = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return await sendNotification({
        email: user.email,
        mobile: user.mobile,
        subject: 'Password Reset Successful | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            user_name: user.username || user.name || 'User',
            user_email: user.email,
            reset_date: resetDate,
            reset_time: resetTime
        }
    });
}

/**
 * Send Password Reset Request Notification
 * Contains the reset link
 */
async function sendPasswordResetRequestNotification(user, resetUrl) {
    const emailTemplate = `Hi {{user_name}},

You are receiving this because you (or someone else) have requested the reset of the password for your {{company_name}} account.

🔐 Password Reset Request

Please click on the button below to complete the process within 10 minutes:

[Reset Password]({{reset_url}})

Or copy this link to your browser:
{{reset_url}}

If you did not request this, please ignore this email and your password will remain unchanged.

Best regards,  
{{company_name}} Team`;

    const whatsappTemplate = `*Password Reset Request* 🔐

Hello {{user_name}},

Someone requested a password reset for your account at *{{company_name}}*.

Tap the link below to reset your password:

{{reset_url}}

⏰ This link expires in 10 minutes.

If you did not request this, please ignore this message.`;

    return await sendNotification({
        email: user.email,
        mobile: user.mobile,
        subject: 'Password Reset Request | {{company_name}}',
        emailBody: emailTemplate,
        whatsappBody: whatsappTemplate,
        variables: {
            user_name: user.username || user.name || 'User',
            reset_url: resetUrl
        }
    });
}

module.exports = {
    sendPasswordResetSuccessNotification,
    sendPasswordResetRequestNotification
};
