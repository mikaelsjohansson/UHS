import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserDto, AuthState } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setPassword: (token: string, password: string) => Promise<void>;
  setupAdmin: (password: string) => Promise<void>;
  getCurrentUser: () => Promise<UserDto | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (token && authService.isAuthenticated()) {
          const user = await authService.getMe();
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setCurrentUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const setPassword = useCallback(async (token: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.setPassword(token, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupAdmin = useCallback(async (password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.setupAdmin(password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup admin';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async (): Promise<UserDto | null> => {
    try {
      const user = await authService.getMe();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      return user;
    } catch {
      setCurrentUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setPassword,
    setupAdmin,
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
