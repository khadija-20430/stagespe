import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  // Codes de permission de l'utilisateur connecté (ex: 'documents.view',
  // 'documents.delete'...). Un super_admin reçoit tous les codes, un
  // 'utilisateur' simple reçoit un tableau vide.
  const [permissions, setPermissions] = useState(new Set());
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    if (!user || !api.getToken()) {
      setPermissions(new Set());
      setPermissionsLoaded(true);
      return;
    }
    let cancelled = false;
    setPermissionsLoaded(false);
    api.getMyPermissions()
      .then((codes) => { if (!cancelled) setPermissions(new Set(codes)); })
      .catch(() => { if (!cancelled) setPermissions(new Set()); })
      .finally(() => { if (!cancelled) setPermissionsLoaded(true); });
    return () => { cancelled = true; };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) && Boolean(api.getToken()),
      permissions,
      permissionsLoaded,
      // super_admin passe toujours, peu importe le code demandé
      hasPermission: (code) => user?.role === 'super_admin' || permissions.has(code),
      login: async (email, password) => {
        const loggedInUser = await api.login(email, password); // lève une erreur si échec
        setUser(loggedInUser);
        localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        return loggedInUser;
      },
      logout: async () => {
        await api.logout();
        setUser(null);
        setPermissions(new Set());
        localStorage.removeItem(USER_KEY);
      },
    }),
    [user, permissions, permissionsLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}