import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

// Flux "mot de passe oublié" basé sur un code à 6 chiffres envoyé par email
// (voir authController.forgotPassword / verifyResetToken / resetPassword côté backend).
// Étape 1 : email + code -> vérifié via /auth/verify-reset-token
// Étape 2 : nouveau mot de passe -> envoyé avec email + code via /auth/reset-password
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1); // 1 = vérifier le code, 2 = nouveau mot de passe
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !code.trim()) {
      setError('Email et code requis');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Code invalide ou expiré');
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), new_password: password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      setSuccess('✅ Mot de passe réinitialisé avec succès!');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-slate-800 to-navy flex items-center justify-center px-4 py-12">
      {/* Décoration */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cobalt/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Card className="relative w-full max-w-md p-8 shadow-2xl animate-slide-up">
        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold text-navy mb-2">🔑 Vérification du code</h1>
            <p className="text-slate-600 mb-8">
              Entrez le code à 6 chiffres reçu par email pour continuer.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700">
                  📧 Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@esi.dz"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
                />
              </div>

              <div className="space-y-2 animate-fade-in delay-100">
                <label className="block text-sm font-medium text-slate-700">
                  🔢 Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base tracking-widest text-center focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-bounce-in">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                {loading ? '⏳ Vérification...' : '✅ Vérifier le code'}
              </Button>

              <Link
                to="/admin/forgot-password"
                className="block text-center text-sm text-cobalt hover:text-blue-700 font-medium transition"
              >
                ← Je n'ai pas reçu de code
              </Link>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-navy mb-2">🔐 Nouveau mot de passe</h1>
            <p className="text-slate-600 mb-8">Créez un nouveau mot de passe sécurisé</p>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700">
                  🔐 Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
                />
              </div>

              <div className="space-y-2 animate-fade-in delay-100">
                <label className="block text-sm font-medium text-slate-700">
                  ✓ Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
                />
              </div>

              {password && (
                <div className="text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-yellow-600'}>
                      {password.length >= 8 ? '✓ Fort' : '⚠️ Faible'}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-bounce-in">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-bounce-in">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !!success}
                className="w-full bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                {loading ? '⏳ Réinitialisation...' : '✅ Réinitialiser'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
