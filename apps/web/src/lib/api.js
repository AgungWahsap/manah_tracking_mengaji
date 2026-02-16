import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Note: Authentication is handled via session cookies (withCredentials: true).
// No token interceptor needed.


// Response interceptor — unwrap { success, data, ... } envelope
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message =
            error.response?.data?.error?.message ||
            error.message ||
            'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

export default api;
