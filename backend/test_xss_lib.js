try {
    const xss = require('xss-clean');
    console.log('xss-clean type:', typeof xss);
    // console.log('xss-clean result:', xss('<script>alert(1)</script>')); // This probably throws if it expects req, res, next

    // Check if it has a clean function
    // Usually xss-clean exports the middleware function
} catch (e) {
    console.error(e);
}
