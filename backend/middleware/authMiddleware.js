const jwt = require('jsonwebtoken');
const User = require('../models/User');




const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Check if token is blacklisted (logged out)
            const BlacklistedToken = require('../models/BlacklistedToken'); // Lazy load
            const isBlacklisted = await BlacklistedToken.findOne({ token });
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Session expired/logged out. Please login again.' });
            }

            // FALLBACK SECRET to match authRoutes.js
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error('JWT_SECRET not configured');
            const decoded = jwt.verify(token, secret);
            req.user = await User.findById(decoded.id).select('-password');

            // Check if user was found in database
            if (!req.user) {
                const errLog = `❌ Auth - User not found in database for ID: ${decoded.id}`;
                console.error(errLog);

                return res.status(401).json({ message: 'User not found. Please login again.' });
            }



            // High Priority: Enforcement of active account
            if (!req.user.isActive) {
                return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
            }

            // Check if user changed password after the token was issued
            if (req.user.passwordChangedAt) {
                const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
                if (decoded.iat < changedTimestamp) {
                    return res.status(401).json({ message: 'User recently changed password! Please log in again.' });
                }
            }


            next();
        } catch (error) {
            const errLog = `❌ Auth - Token verification failed: ${error.message} | Token provided: ${token ? token.substring(0, 10) + '...' : 'none'}`;
            console.error(errLog);

            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        const noTokenLog = `❌ Auth - No token provided or invalid format: ${req.headers.authorization}`;
        console.error(noTokenLog);

        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    const adminRoles = ['super_admin', 'ops_admin', 'logistics_admin', 'accounts_admin', 'support_staff', 'admin'];



    if (req.user && adminRoles.includes(req.user.role)) {

        next();
    } else {

        res.status(401).json({
            message: 'Not authorized as an admin',
            your_role: req.user?.role,
            debug_info: 'Role must be one of: ' + adminRoles.join(', ')
        });
    }
};

const optionalProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const decoded = jwt.verify(token, secret);
                req.user = await User.findById(decoded.id).select('-password');
            }
        } catch (error) {
            // Token failed, but it's optional, so we just proceed as guest
        }
    }
    next();
};

module.exports = { protect, admin, optionalProtect };
