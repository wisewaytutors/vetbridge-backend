import Cookies from 'js-cookie';

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'userData';

export const auth = {
  // Get auth token
  getToken: () => {
    if (typeof window !== 'undefined') {
      return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Set auth token
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      Cookies.set(TOKEN_KEY, token, { expires: 7 });
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Remove auth token
  removeToken: () => {
    if (typeof window !== 'undefined') {
      Cookies.remove(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Get user role
  getRole: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ROLE_KEY);
    }
    return null;
  },

  // Set user role
  setRole: (role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_KEY, role);
    }
  },

  // Remove user role
  removeRole: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ROLE_KEY);
    }
  },

  // Get user data
  getUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  // Set user data
  setUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  },

  // Remove user data
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!auth.getToken();
  },

  // Logout
  logout: () => {
    auth.removeToken();
    auth.removeRole();
    auth.removeUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },

  // Check if user has specific role
  hasRole: (role) => {
    return auth.getRole() === role;
  },
};

export default auth;
