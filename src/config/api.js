// API Configuration
// You can modify this file to change the API base URL for different environments

export const API_CONFIG = {
  // Auto-detect environment and use appropriate API URL
  BASE_URL: import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' 
      ? '/api'  // Use Vite proxy for localhost
      : 'https://snippetly.ro/api'  // Direct connection for server
  ),
  
  // Authentication endpoints
  ENDPOINTS: {
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    USER: '/auth/user/',
    PASSWORD_RESET: '/auth/password-reset/',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 15000,
  
  // Token storage key
  TOKEN_KEY: 'authToken'
};

export default API_CONFIG; 