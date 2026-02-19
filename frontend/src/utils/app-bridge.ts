
/**
 * Utility to detect if the application is running inside the Android Native Shell (WebView).
 * This relies on the Android app injecting a specific User-Agent string or a JavaScript Interface.
 */

export const isAndroidWebView = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for the specific User-Agent string we will configure in Android
    // Example: "Mozilla/5.0 ... AndroidApp/1.0"
    const isUserAgentMatch = /AndroidApp\/1\.0/.test(window.navigator.userAgent);

    // Check for the injected JS Interface (if we add one named 'Android')
    const isJsInterfacePresent = (window as any).Android !== undefined;

    return isUserAgentMatch || isJsInterfacePresent;
};

export const isAppMode = (): boolean => {
    return isAndroidWebView(); // Can extend for iOS later
};
