const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const mongoSanitize = (req, res, next) => {
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    try {
        if (req.query) sanitize(req.query);
    } catch (err) {
        // Ignore
    }
    next();
};

// Simple XSS Strip (Regex based)
// We don't rely on 'xss-clean' function directly as it's a middleware factory
const cleanString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>?/gm, '');
};

const sanitizeDeep = (obj) => {
    if (typeof obj === 'string') return cleanString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeDeep);
    if (obj instanceof Object) {
        for (const key in obj) {
            obj[key] = sanitizeDeep(obj[key]);
        }
    }
    return obj;
};

const xssSanitize = (req, res, next) => {
    if (req.body) req.body = sanitizeDeep(req.body);
    if (req.params) req.params = sanitizeDeep(req.params);
    // Skip query to avoid crash
    next();
};

module.exports = { mongoSanitize, xssSanitize };
