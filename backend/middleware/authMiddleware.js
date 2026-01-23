const jwt = require('jsonwebtoken');
const User = require('../models/User');




const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // FALLBACK SECRET to match authRoutes.js
            const secret = process.env.JWT_SECRET || 'chamunda_secret_key_123';
            const decoded = jwt.verify(token, secret);
            req.user = await User.findById(decoded.id).select('-password');

            // Check if user was found in database
            if (!req.user) {
                const errLog = `❌ Auth - User not found in database for ID: ${decoded.id}`;
                console.error(errLog);

                return res.status(401).json({ message: 'User not found. Please login again.' });
            }

            const logInfo = `🔐 Auth - User authenticated: ${JSON.stringify({
                id: req.user._id,
                username: req.user.username,
                role: req.user.role
            })}`;
            console.log(logInfo);


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

    const logInfo = `🔑 Admin Check - User: ${req.user?.username} | Role: ${req.user?.role} | Required: ${adminRoles}`;
    console.log(logInfo);


    if (req.user && adminRoles.includes(req.user.role)) {
        const successLog = '✅ Admin Check - Access granted';
        console.log(successLog);

        next();
    } else {
        const failLog = `❌ Admin Check - Access denied for role: ${req.user?.role}`;
        console.log(failLog);

        res.status(401).json({
            message: 'Not authorized as an admin',
            your_role: req.user?.role,
            debug_info: 'Role must be one of: ' + adminRoles.join(', ')
        });
    }
};

module.exports = { protect, admin };
