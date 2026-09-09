import { createContext, useContext, useEffect, useState } from 'react';
import { getMyPermissions } from '../services/api.js';

const PermissionsContext = createContext({
  permissions: [],
  loading: true,
  hasPermission: () => false,
});

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPermissions()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.permissions || [];
        const codes = list.map((p) => (typeof p === 'string' ? p : p.code));
        setPermissions(codes);
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, []);

  const hasPermission = (code) => permissions.includes(code);

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);