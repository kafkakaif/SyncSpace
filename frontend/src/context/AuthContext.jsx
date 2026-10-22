import { createContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/api';

const TOKEN_KEY = 'syncspace_auth_token';
const USER_KEY = 'syncspace_auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Save or clear session
  const saveSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (newUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    saveSession(null, null);
  }, [saveSession]);

  // Verify stored token on mount
  useEffect(() => {
    let isMounted = true;

    const verifyExistingToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe(storedToken);
        if (isMounted && response?.success && response.user) {
          setUser(response.user);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
      } catch {
        // Token expired or invalid
        if (isMounted) {
          saveSession(null, null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyExistingToken();

    return () => {
      isMounted = false;
    };
  }, [saveSession]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response?.success && response.token && response.user) {
      saveSession(response.token, response.user);
      return response.user;
    }
    throw new Error(response?.message || 'Login failed.');
  };

  const signup = async ({ name, email, password }) => {
    const response = await authApi.signup({ name, email, password });
    if (response?.success && response.token && response.user) {
      saveSession(response.token, response.user);
      return response.user;
    }
    throw new Error(response?.message || 'Registration failed.');
  };

  const loginDemo = async () => {
    const response = await authApi.loginDemo();
    if (response?.success && response.token && response.user) {
      saveSession(response.token, response.user);
      return response.user;
    }
    throw new Error(response?.message || 'Demo login failed.');
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    signup,
    logout,
    loginDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
