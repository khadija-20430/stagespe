import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Mail, Shield, UserCog, AlertTriangle, Users, KeyRound } from 'lucide-react';
import { getResetSettings, updateResetSettings } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function SettingsResetPassword() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('reset');

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

  const tabs = [
    { id: 'reset', label: t('admin.resetSettingsPage.tabs.reset'), icon: KeyRound },
    { id: 'welcome', label: t('admin.resetSettingsPage.tabs.welcome'), icon: Users },
    { id: 'activation', label: t('admin.resetSettingsPage.tabs.activation'), icon: Shield },
    { id: 'deactivation', label: t('admin.resetSettingsPage.tabs.deactivation'), icon: AlertTriangle },
    { id: 'suspicious', label: t('admin.resetSettingsPage.tabs.suspicious'), icon: AlertTriangle },
  ];

  const renderFields = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'reset':
        return (
          <>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
              <KeyRound size={20} className="text-cobalt" />
              {t('admin.resetSettingsPage.title')}
            </h3>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.codeWindow')}
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={settings.reset_code_window_minutes || 15}
                onChange={(e) => handleChange('reset_code_window_minutes', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.maxAttempts')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.max_reset_attempts || 5}
                onChange={(e) => handleChange('max_reset_attempts', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.emailSubject')}
              </label>
              <input
                type="text"
                value={settings.reset_email_subject || ''}
                onChange={(e) => handleChange('reset_email_subject', e.target.value)}
                required
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.emailText')}
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                {t('admin.resetSettingsPage.fields.emailTextHelpPrefix')} <code>{'{{code}}'}</code> {t('admin.resetSettingsPage.fields.emailTextHelpMiddle')} <code>{'{{minutes}}'}</code> {t('admin.resetSettingsPage.fields.emailTextHelpSuffix')}
              </p>
              <textarea
                rows={4}
                value={settings.reset_email_text || ''}
                onChange={(e) => handleChange('reset_email_text', e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>
          </>
        );

      case 'welcome':
        return (
          <>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-cobalt" />
              {t('admin.resetSettingsPage.tabs.welcome')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('admin.resetSettingsPage.fields.welcomeDescription')}
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.welcomeSubject')}
              </label>
              <input
                type="text"
                value={settings.welcome_email_subject || '🎉 Bienvenue sur le Portail International ESI'}
                onChange={(e) => handleChange('welcome_email_subject', e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.welcomeText')}
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                {t('admin.resetSettingsPage.fields.welcomeHelp')}
              </p>
              <textarea
                rows={6}
                value={settings.welcome_email_text || `Bonjour {{fullName}},

Votre compte a été créé avec succès sur le Portail International ESI.

Email : {{email}}
Mot de passe temporaire : {{password}}

Veuillez changer votre mot de passe lors de votre première connexion.

Cordialement,
L'équipe ESI`}
                onChange={(e) => handleChange('welcome_email_text', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>
          </>
        );

      case 'activation':
        return (
          <>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-cobalt" />
              {t('admin.resetSettingsPage.tabs.activation')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('admin.resetSettingsPage.fields.activationDescription')}
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.activationSubject')}
              </label>
              <input
                type="text"
                value={settings.activation_email_subject || ' Votre compte ESI a été réactivé'}
                onChange={(e) => handleChange('activation_email_subject', e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.activationText')}
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                {t('admin.resetSettingsPage.fields.activationHelp')}
              </p>
              <textarea
                rows={6}
                value={settings.activation_email_text || `Bonjour {{fullName}},

Votre compte sur le Portail International ESI a été réactivé.

Vous pouvez maintenant vous connecter avec vos identifiants habituels.

Date : {{date}}

Cordialement,
L'équipe ESI`}
                onChange={(e) => handleChange('activation_email_text', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>
          </>
        );

      case 'deactivation':
        return (
          <>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-cobalt" />
              {t('admin.resetSettingsPage.tabs.deactivation')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('admin.resetSettingsPage.fields.deactivationDescription')}
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.deactivationSubject')}
              </label>
              <input
                type="text"
                value={settings.deactivation_email_subject || ' Votre compte ESI a été désactivé'}
                onChange={(e) => handleChange('deactivation_email_subject', e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.deactivationText')}
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                {t('admin.resetSettingsPage.fields.deactivationHelp')}
              </p>
              <textarea
                rows={6}
                value={settings.deactivation_email_text || `Bonjour {{fullName}},

Votre compte sur le Portail International ESI a été désactivé par un administrateur.

Raisons possibles : inactivité prolongée, demande de l'utilisateur, ou mesure de sécurité.

Pour plus d'informations, veuillez contacter le support : cooperation@esi.dz

Date : {{date}}

Cordialement,
L'équipe ESI`}
                onChange={(e) => handleChange('deactivation_email_text', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>
          </>
        );

      case 'suspicious':
        return (
          <>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-cobalt" />
              {t('admin.resetSettingsPage.tabs.suspicious')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('admin.resetSettingsPage.fields.suspiciousDescription')}
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.suspiciousThreshold')}
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.suspicious_login_threshold || 3}
                onChange={(e) => handleChange('suspicious_login_threshold', e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.suspiciousSubject')}
              </label>
              <input
                type="text"
                value={settings.suspicious_email_subject || ' Alertes de sécurité - Tentatives de connexion suspectes'}
                onChange={(e) => handleChange('suspicious_email_subject', e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('admin.resetSettingsPage.fields.suspiciousText')}
              </label>
              <p className="mb-1 text-xs text-slate-400 dark:text-slate-500">
                {t('admin.resetSettingsPage.fields.suspiciousHelp')}
              </p>
              <textarea
                rows={6}
                value={settings.suspicious_email_text || `Bonjour {{fullName}},

Nous avons détecté {{attempts}} tentatives de connexion échouées sur votre compte.

Adresse IP : {{ip}}
Date : {{date}}

Si vous ne reconnaissez pas ces tentatives, nous vous recommandons de changer immédiatement votre mot de passe.

Cordialement,
L'équipe ESI`}
                onChange={(e) => handleChange('suspicious_email_text', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
        <Settings size={24} className="text-cobalt" />
        {t('admin.resetSettingsPage.title')}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('admin.resetSettingsPage.subtitle')}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {t('admin.resetSettingsPage.saved')}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-cobalt text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="mt-6 max-w-2xl p-5 dark:bg-slate-900">
        {loading || !settings ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('admin.resetSettingsPage.loading')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFields()}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="submit" disabled={saving}>
                {saving ? '...' : t('admin.resetSettingsPage.save')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}