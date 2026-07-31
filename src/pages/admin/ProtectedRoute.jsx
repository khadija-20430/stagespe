import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Route protégée (simulation frontend). Redirige vers la connexion
// si aucune session n'est présente.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}
