const dotenv = require('dotenv');
const sendEmail = require('./utils/sendEmail');

dotenv.config();

async function testDirectSend() {
    try {
        console.log('Testing direct email send using new .env settings...');
        const result = await sendEmail({
            email: 'vasudevsharma9413@gmail.com',
            subject: 'Direct Test from Script',
            message: 'This is a test message to verify Brevo SMTP settings.',
            queue: false // Direct send
        });

        if (result) {
            console.log('✅ Direct email sent successfully!');
        } else {
            console.error('❌ Direct email send failed. Check console for details.');
        }
    } catch (e) {
        console.error('CRASH:', e);
    }
    process.exit(0);
}

testDirectSend();
