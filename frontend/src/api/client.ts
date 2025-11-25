import axios, { AxiosInstance } from 'axios';

export const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Get the authentication token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Store the authentication token in localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Check if the user is authenticated (has a token)
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

/**
 * Create an axios instance with authentication interceptors
 * @param baseURL - The base URL for API requests
 * @returns Configured axios instance
 */
export const createApiClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to attach Authorization header
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - clear local storage
        removeToken();
        // Note: Redirect to login is handled by AuthContext
      }
      return Promise.reject(error);
    }
  );

  return instance;
};
