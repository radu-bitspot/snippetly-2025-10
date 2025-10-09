import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

// Auth Context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem(API_CONFIG.TOKEN_KEY),
  isLoading: true,
  isAuthenticated: false
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
      if (token) {
        try {
          const user = await getCurrentUser(token);
          
          // Store user ID for isolating local storage data per user
          localStorage.setItem('userId', user.id || user.pk || 'anonymous');
          console.log('✅ User ID restored to localStorage:', user.id || user.pk);
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          });
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem(API_CONFIG.TOKEN_KEY);
          localStorage.removeItem('userId');
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (state.token && !config.headers.Authorization) {
      config.headers.Authorization = `Token ${state.token}`;
    }

    try {
      console.log('Making API call to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API call failed:', error);
      
      // Check if it's a CORS error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('CORS Error: Cannot connect to Django backend. Please check CORS configuration.');
      }
      
      throw error;
    }
  };

  // Get current user
  const getCurrentUser = async (token) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  };

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      console.log('Attempting login to:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`);
      
      const response = await apiCall(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store token
      localStorage.setItem(API_CONFIG.TOKEN_KEY, response.token);

      // Get full user details
      const user = await getCurrentUser(response.token);
      
      // Store user ID for isolating local storage data per user
      localStorage.setItem('userId', user.id || user.pk || 'anonymous');
      console.log('✅ User ID saved to localStorage:', user.id || user.pk);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: response.token }
      });

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Register function (keeping for future use)
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiCall('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // Store token
      localStorage.setItem(API_CONFIG.TOKEN_KEY, response.token);

      // Get full user details
      const user = await getCurrentUser(response.token);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: response.token }
      });

      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await apiCall(API_CONFIG.ENDPOINTS.LOGOUT, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY);
      localStorage.removeItem('userId'); // Clear user ID to isolate data
      console.log('✅ User ID cleared from localStorage on logout');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Password reset
  const requestPasswordReset = async (email) => {
    return apiCall(API_CONFIG.ENDPOINTS.PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  // Value to provide
  const value = {
    ...state,
    login,
    register,
    logout,
    requestPasswordReset,
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 