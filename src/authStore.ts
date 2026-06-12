import { useState, useEffect } from 'react';
import { API_URL } from './constants';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
}

const JWT_KEY = 'apex_jwt_token';
const USER_KEY = 'apex_current_user';
const SESSION_KEY = 'apex_session';

// Helper to safely fetch stored user
function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Global singleton state to sync authentication across multiple hook instances
let globalAuthState: AuthState = {
  isAuthenticated: !!localStorage.getItem(JWT_KEY) && !!getStoredUser(),
  currentUser: getStoredUser()
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(l => l());
}

// Global background token verification flag
let hasAttemptedVerification = false;

function verifyTokenBackground() {
  const token = localStorage.getItem(JWT_KEY);
  if (token && !hasAttemptedVerification) {
    hasAttemptedVerification = true;
    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Verification failed');
    })
    .then(data => {
      globalAuthState = {
        isAuthenticated: true,
        currentUser: data.user
      };
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(SESSION_KEY, data.user.id);
      emitChange();
    })
    .catch(() => {
      // Clean up invalid session
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_KEY);
      globalAuthState = {
        isAuthenticated: false,
        currentUser: null
      };
      emitChange();
    });
  }
}

export function useAuthStore() {
  const [auth, setAuth] = useState<AuthState>(globalAuthState);

  useEffect(() => {
    // Verify token once on hook initialization in client
    verifyTokenBackground();

    const handleChange = () => {
      setAuth({ ...globalAuthState });
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const signUp = async (
    name: string,
    email: string,
    age: number,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, age, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      localStorage.setItem(JWT_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(SESSION_KEY, data.user.id);

      globalAuthState = {
        isAuthenticated: true,
        currentUser: data.user
      };
      emitChange();
      return { success: true };
    } catch (err) {
      console.error('Registration API error:', err);
      return { success: false, error: 'Could not connect to authentication server.' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      localStorage.setItem(JWT_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(SESSION_KEY, data.user.id);

      globalAuthState = {
        isAuthenticated: true,
        currentUser: data.user
      };
      emitChange();
      return { success: true };
    } catch (err) {
      console.error('Login API error:', err);
      return { success: false, error: 'Could not connect to authentication server.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    hasAttemptedVerification = false;

    globalAuthState = {
      isAuthenticated: false,
      currentUser: null
    };
    emitChange();
  };

  return { auth, signUp, login, logout };
}
