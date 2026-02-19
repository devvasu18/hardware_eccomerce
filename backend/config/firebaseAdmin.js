const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let firebaseInitialized = false;

// Priority 1: Check for Environment Variable (Best for Render/Production)
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

// Priority 2: Check for Local File (Best for Local Dev)
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

try {
    let credential;

    if (serviceAccountEnv) {
        // Parse JSON from Env Variable
        const serviceAccount = JSON.parse(serviceAccountEnv);
        credential = admin.credential.cert(serviceAccount);
        logger.info('✅ Firebase Admin initialized via Environment Variable');
    } else {
        // Fallback to File
        try {
            const serviceAccount = require(serviceAccountPath);
            credential = admin.credential.cert(serviceAccount);
            logger.info('✅ Firebase Admin initialized via Local File');
        } catch (fileError) {
            // File not found, that's okay if we are not notifying
            throw new Error('No Firebase credentials found (Env or File)');
        }
    }

    admin.initializeApp({
        credential: credential
    });

    firebaseInitialized = true;
} catch (error) {
    logger.warn('⚠️ Firebase Admin SDK not initialized.');
    logger.warn(`   Reason: ${error.message}`);
    logger.warn('   Push notifications will NOT work.');
}

module.exports = {
    admin,
    isInitialized: () => firebaseInitialized
};
