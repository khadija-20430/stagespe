import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Mail, AlertTriangle, CheckCircle2, Send, Loader2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email requis');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la demande');
      }

      setSuccess('Code envoyé ! Vérifiez votre boîte de réception.');
      const sentEmail = email.trim();
      setEmail('');
      setTimeout(() => {
        navigate(`/admin/reset-password?email=${encodeURIComponent(sentEmail)}`);
      }, 1500);
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
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <Link to="/admin/login" className="flex items-center gap-2.5 hover:opacity-75 transition">
            <span translate="no" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cobalt to-blue-600 text-sm font-extrabold text-white shadow-lg">
              ESI
            </span>
            <span className="text-sm font-bold text-navy">Réinitialiser</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-navy mb-2 flex items-center gap-2">
          <KeyRound size={24} className="text-cobalt" />
          Mot de passe oublié?
        </h1>
        <p className="text-slate-600 mb-8">
          Entrez votre email et nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2 animate-fade-in">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Mail size={15} /> Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@esi.dz"
              className="w-full min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-bounce-in flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-bounce-in flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              {success}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Envoi...
              </>
            ) : (
              <>
                <Send size={18} /> Envoyer le code
              </>
            )}
          </Button>

          {/* Back to Login */}
          <Link
            to="/admin/login"
            className="flex items-center justify-center gap-1.5 text-center text-sm text-cobalt hover:text-blue-700 font-medium transition"
          >
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </form>
      </Card>
    </div>
  );
}