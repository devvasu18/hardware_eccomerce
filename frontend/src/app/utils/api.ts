import axios from 'axios';

// Smart API URL detection: try localhost first, fallback to production
const getBaseURL = () => {
    // Always use /api - Next.js rewrites will handle routing to correct backend
    // - In development: proxies to localhost:5000
    // - In production: proxies to NEXT_PUBLIC_API_URL (Render backend)
    return '/api';
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
