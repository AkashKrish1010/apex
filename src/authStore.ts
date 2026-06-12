import { useState, useEffect } from 'react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  age: number;
  passwordHash: string; // simple base64 "hash" for demo
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
}

const ACCOUNTS_KEY = 'apex_accounts';
const SESSION_KEY = 'apex_session';

function simpleHash(str: string): string {
  return btoa(encodeURIComponent(str));
}

function getAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(userId: string) {
  localStorage.setItem(SESSION_KEY, userId);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function useAuthStore() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const userId = getSession();
    if (!userId) return { isAuthenticated: false, currentUser: null };
    const accounts = getAccounts();
    const user = accounts.find(a => a.id === userId) || null;
    return { isAuthenticated: !!user, currentUser: user };
  });

  const signUp = (
    name: string,
    email: string,
    age: number,
    password: string
  ): { success: boolean; error?: string } => {
    const accounts = getAccounts();
    if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      age,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, newUser]);
    saveSession(newUser.id);
    setAuth({ isAuthenticated: true, currentUser: newUser });
    return { success: true };
  };

  const login = (
    email: string,
    password: string
  ): { success: boolean; error?: string } => {
    const accounts = getAccounts();
    const user = accounts.find(
      a => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (user.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    saveSession(user.id);
    setAuth({ isAuthenticated: true, currentUser: user });
    return { success: true };
  };

  const logout = () => {
    clearSession();
    setAuth({ isAuthenticated: false, currentUser: null });
  };

  return { auth, signUp, login, logout };
}
