import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthContextType, LoginPayload, RegisterPayload, User } from '../types/auth.types';
import { loginApi, registerApi, getMeApi, logoutApi } from '../api/auth';
import { tokenStorage } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'sortmyscene_user';
const REFRESH_TOKEN_KEY = 'sortmyscene_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and restore session from localStorage
  useEffect(() => {
    async function restoreSession() {
      const storedToken = tokenStorage.get();
      const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUserJson) {
        try {
          // Pre-populate state from cache to keep transition smooth
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUserJson) as User);

          // Verify token and fetch fresh user profile in background
          const response = await getMeApi();
          if (response.success && response.data?.user) {
            const freshUser: User = {
              id: response.data.user._id,
              email: response.data.user.email,
              role: response.data.user.role,
              name: response.data.user.name,
            };
            setUser(freshUser);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
          } else {
            // Clean up session if verify fails
            throw new Error('Verify session failed');
          }
        } catch (error) {
          // Clear stale credentials on initialization error
          tokenStorage.remove();
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    }

    restoreSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await loginApi(payload);
      if (response.success && response.data) {
        const { accessToken: token, refreshToken, user: userData } = response.data;
        const authUser: User = {
          id: userData._id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
        };

        tokenStorage.set(token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));

        setAccessToken(token);
        setUser(authUser);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await registerApi(payload);
      if (response.success && response.data) {
        const { accessToken: token, refreshToken, user: userData } = response.data;
        const authUser: User = {
          id: userData._id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
        };

        tokenStorage.set(token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));

        setAccessToken(token);
        setUser(authUser);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await logoutApi(refreshToken).catch(() => {
          // ignore logout api failures to ensure frontend logout always succeeds
        });
      }
    } finally {
      tokenStorage.remove();
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await getMeApi();
    if (response.success && response.data?.user) {
      const freshUser: User = {
        id: response.data.user._id,
        email: response.data.user.email,
        role: response.data.user.role,
        name: response.data.user.name,
      };
      setUser(freshUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
    }
  }, []);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
