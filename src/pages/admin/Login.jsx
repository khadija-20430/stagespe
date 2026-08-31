import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(t('admin.login.errorRequired'));
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-slate-800 to-navy flex items-center justify-center px-4 py-12">
      {/* Décoration de fond */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cobalt/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Card className="relative w-full max-w-md p-8 shadow-2xl animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <span translate="no" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cobalt to-blue-600 text-sm font-extrabold text-white shadow-lg">
            ESI
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-navy">{t('admin.login.brand')}</span>
            <span className="text-xs text-slate-500">Espace Admin</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-navy">{t('admin.login.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email */}
          <div className="space-y-2 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              📧 {t('admin.login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@esi.dz"
              className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-2 animate-fade-in delay-100">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              🔐 {t('admin.login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right animate-fade-in delay-200">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-cobalt hover:text-blue-700 font-medium transition"
            >
              Mot de passe oublié? 🔑
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-bounce-in">
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            {loading ? '⏳ Connexion en cours...' : '✅ Se connecter'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          © 2024 ESI Coopération Internationale
        </p>
      </Card>
    </div>
  );
}