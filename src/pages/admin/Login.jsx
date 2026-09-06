import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle, KeyRound, ShieldCheck, Sparkles,
} from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
      setError(err.message || t('admin.login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy flex items-center justify-center px-4 py-12">

      {/* =====================================================
          ANIMATED BACKGROUND
      ===================================================== */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-slate-900 to-blue-950" />

      {/* Floating gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cobalt/30 rounded-full mix-blend-screen filter blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-2000" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating sparkles */}
      <div className="pointer-events-none absolute inset-0">
        <Sparkles className="absolute top-[15%] left-[12%] text-blue-300/40 animate-pulse" size={18} />
        <Sparkles className="absolute top-[65%] left-[85%] text-cobalt/40 animate-pulse delay-2000" size={14} />
        <Sparkles className="absolute top-[80%] left-[20%] text-blue-200/30 animate-pulse" size={22} />
      </div>

      {/* =====================================================
          CARD
      ===================================================== */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="rounded-2xl border border-white/10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/40 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-cobalt/40 blur-xl animate-pulse" />
              <span
                translate="no"
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cobalt to-blue-600 text-lg font-extrabold text-white shadow-lg animate-soft-bounce"
              >
                ESI
              </span>
            </div>
            <h1 className="text-2xl font-bold text-navy dark:text-white">{t('admin.login.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('admin.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5 animate-fade-in">
              <label
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                <Mail size={15} />
                {t('admin.login.email')}
              </label>
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'border-cobalt ring-2 ring-cobalt/20 shadow-sm'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <Mail size={16} className={focusedField === 'email' ? 'text-cobalt' : 'text-slate-400'} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('admin.login.emailPlaceholder')}
                  className="w-full min-h-[44px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 animate-fade-in delay-100">
              <label
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                <Lock size={15} />
                {t('admin.login.password')}
              </label>
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'border-cobalt ring-2 ring-cobalt/20 shadow-sm'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <Lock size={16} className={focusedField === 'password' ? 'text-cobalt' : 'text-slate-400'} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-cobalt transition shrink-0"
                  tabIndex={-1}
                  title={showPassword ? t('admin.login.hidePassword') : t('admin.login.showPassword')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right animate-fade-in delay-200">
              <Link
                to="/admin/forgot-password"
                className="inline-flex items-center gap-1 text-sm text-cobalt hover:text-blue-700 font-medium transition"
              >
                <KeyRound size={13} />
                {t('admin.login.forgotPassword')}
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-bounce-in">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-cobalt to-blue-600 hover:from-blue-600 hover:to-cobalt bg-[length:200%_100%] hover:bg-right text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl hover:shadow-cobalt/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('admin.login.loading')}
                </>
              ) : (
                <>
                  <LogIn size={18} className="transition-transform group-hover:translate-x-0.5" />
                  {t('admin.login.submit')}
                </>
              )}
            </Button>
          </form>

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck size={13} />
            {t('admin.login.secureConnection')}
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            {t('admin.login.footer', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}