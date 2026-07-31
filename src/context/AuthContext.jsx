import { createContext, useContext, useMemo, useState } from 'react';

// Authentification SIMULÉE côté frontend uniquement.
// Aucune vérification serveur : à remplacer par un vrai flux d'auth
// (JWT / session) une fois le backend disponible.
const AuthContext = createContext(null);

const STORAGE_KEY = 'esi_admin_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      // Connexion factice : accepte tout identifiant non vide.
      login: (email) => {
        const session = { email, name: 'Administrateur' };
        setUser(session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return true;
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
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
