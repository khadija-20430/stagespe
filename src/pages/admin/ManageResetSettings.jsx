import { useEffect, useState } from 'react';
import { getResetSettings, updateResetSettings } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

// Page de réglage du flux "mot de passe oublié" (code envoyé par email).
// Repose sur settingsRoutes.js (/settings), protégé par checkRole('super_admin')
// côté backend. Les valeurs sont appliquées immédiatement, sans redéploiement.
export default function SettingsResetPassword() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getResetSettings()
      .then((data) => { if (!cancelled) setSettings(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateResetSettings(settings);
      setSettings(updated);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white">Réinitialisation de mot de passe</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Ces réglages s'appliquent immédiatement, sans redéploiement.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Réglages enregistrés.
        </div>
      ) : null}

      <Card className="mt-6 max-w-xl p-5 dark:bg-slate-900">
        {loading || !settings ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Durée de validité du code (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={settings.reset_code_window_minutes}
                onChange={(e) => handleChange('reset_code_window_minutes', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre max de tentatives
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.max_reset_attempts}
                onChange={(e) => handleChange('max_reset_attempts', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sujet de l'email
              </label>
              <input
                type="text"
                value={settings.reset_email_subject}
                onChange={(e) => handleChange('reset_email_subject', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Texte de l'email
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                Utilise <code>{'{{code}}'}</code> pour le code et <code>{'{{minutes}}'}</code> pour la durée.
              </p>
              <textarea
                rows={4}
                value={settings.reset_email_text}
                onChange={(e) => handleChange('reset_email_text', e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? '...' : 'Enregistrer'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}