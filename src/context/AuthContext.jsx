import { createContext, useContext, useMemo, useState } from 'react';
import * as api from '../services/api.js';

const AuthContext = createContext(null);
const USER_KEY = 'esi_admin_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) && Boolean(api.getToken()),
      login: async (email, password) => {
        const loggedInUser = await api.login(email, password); // lève une erreur si échec
        setUser(loggedInUser);
        localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        return loggedInUser;
      },
      logout: async () => {
        await api.logout();
        setUser(null);
        localStorage.removeItem(USER_KEY);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}