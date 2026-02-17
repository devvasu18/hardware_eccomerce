import axios from 'axios';

// Smart API URL detection: try localhost first, fallback to production
const getBaseURL = () => {
    // In browser environment
    if (typeof window !== 'undefined') {
        // Check if we're running on localhost
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        // If on localhost, use local API (Next.js will proxy to backend)
        if (isLocalhost) {
            return '/api';
        }
    }

    // For production or when localhost is not available
    // Use environment variable or fallback to production backend
    return process.env.NEXT_PUBLIC_API_URL || 'https://hardware-eccomerce.onrender.com/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 10 * 60 * 1000 // 10 minutes
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Should probably not redirect immediately if checking auth, 
            // but for admin actions it makes sense.
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
