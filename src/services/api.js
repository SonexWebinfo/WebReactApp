import axios from 'axios';
import { toast } from 'react-toastify';

// Create Axios instance
export const api = axios.create({
    baseURL: 'https://backend-api.3stage.in', // 🔗 Update with your Laravel API URL
    withCredentials: true, // ✅ Important for Laravel Sanctum
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 🟢 Automatically attach token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // ✅ Ensure token is stored in localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔴 Handle 401 (Session Expired / Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Remove token and any saved session data
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Optional alert
            toast.success('⚠️ Session expired. Please login again.');

            // Redirect to login page
            window.location.href = 'login';
        }

        return Promise.reject(error);
    }
);
