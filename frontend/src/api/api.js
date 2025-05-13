import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    if (config.url.includes('/api/auth/') && !config.url.includes('/api/auth/token/refresh/')) {
      return config;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Conditions where we should NOT attempt refresh:
    // 1. Already retried this request
    // 2. It's a check-auth request with "No token found" error
    // 3. It's a refresh request itself
    // 4. X-No-Refresh header is set
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !(
        originalRequest.url.includes('/api/auth/check-auth/') && 
        error.response?.data?.error === "No token found"
      ) &&
      !originalRequest.url.includes('/api/auth/token/refresh/') &&
      !originalRequest.headers['X-No-Refresh']
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/auth/token/refresh/');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (refreshError.response?.status === 401) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;