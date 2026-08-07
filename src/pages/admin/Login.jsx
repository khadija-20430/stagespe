import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@esi.dz');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t('admin.login.errorRequired'));
      return;
    }
    login(email.trim());
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2.5">
          <span
            translate="no"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white"
          >
            ESI
          </span>
          <span className="text-base font-bold text-navy">{t('admin.login.brand')}</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-navy">{t('admin.login.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
              {t('admin.login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              {t('admin.login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">{t('admin.login.submit')}</Button>
        </form>
      </Card>
    </div>
  );
}