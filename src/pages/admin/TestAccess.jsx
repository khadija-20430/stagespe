import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical as TestTube } from 'lucide-react';
import { getToken } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

const API = import.meta.env.VITE_API_URL;

// Uniquement des routes GET, sans effet de bord
const CHECKS = (t) => [
  { label: t('admin.testAccessPage.checks.callsAdmin'), method: 'GET', path: '/calls/admin/all', permission: 'calls.view' },
  { label: t('admin.testAccessPage.checks.callsClosing'), method: 'GET', path: '/calls/closing-soon', permission: 'calls.view' },
  { label: t('admin.testAccessPage.checks.agreementsExpiring'), method: 'GET', path: '/agreements/expiring-soon', permission: 'agreements.view' },
  { label: t('admin.testAccessPage.checks.auditLog'), method: 'GET', path: '/audit-logs', permission: t('admin.testAccessPage.superAdminOnly') },
  { label: t('admin.testAccessPage.checks.usersList'), method: 'GET', path: '/auth/users', permission: t('admin.testAccessPage.superAdminOnly') },
  { label: t('admin.testAccessPage.checks.loginHistory'), method: 'GET', path: '/auth/login-history', permission: t('admin.testAccessPage.superAdminOnly') },
];

export default function TestAccess() {
  const { t } = useTranslation();
  const [myPermissions, setMyPermissions] = useState(null);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const checks = CHECKS(t);

  const loadMyPermissions = () => {
    fetch(`${API}/auth/my-permissions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setMyPermissions)
      .catch(() => setMyPermissions([]));
  };

  useEffect(() => {
    loadMyPermissions();
  }, []);

  const runAll = async () => {
    setRunning(true);
    const next = {};
    for (const check of checks) {
      try {
        const res = await fetch(`${API}${check.path}`, {
          method: check.method,
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        next[check.path] = res.status;
      } catch {
        next[check.path] = 'network_error';
      }
    }
    setResults(next);
    setRunning(false);
  };

  const statusTone = (status) => {
    if (status === 200) return 'green';
    if (status === 403) return 'red';
    if (status === 401) return 'slate';
    if (status === undefined) return 'slate';
    return 'amber';
  };

  const statusLabel = (status) => {
    if (status === 200) return t('admin.testAccessPage.status.authorized');
    if (status === 403) return t('admin.testAccessPage.status.forbidden');
    if (status === 401) return t('admin.testAccessPage.status.unauthenticated');
    if (status === undefined) return t('admin.testAccessPage.status.unknown');
    if (status === 'network_error') return 'Erreur réseau';
    return t('admin.testAccessPage.status.other', { status });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
        <TestTube size={24} className="text-cobalt" />
        {t('admin.testAccessPage.title')}
      </h1>

      <Card className="mt-6 p-5 dark:bg-slate-900">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('admin.testAccessPage.myPermissionsTitle')}
        </div>
        {myPermissions === null ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('admin.testAccessPage.loading')}</p>
        ) : myPermissions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {t('admin.testAccessPage.noPermissions')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myPermissions.map((code) => (
              <Badge key={code} tone="cobalt">
                {code}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4 p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('admin.testAccessPage.endpointsTitle')}
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="rounded-lg bg-cobalt px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running ? t('admin.testAccessPage.running') : t('admin.testAccessPage.run')}
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {checks.map((check) => (
            <div key={check.path} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{check.label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500" translate="no">
                  {check.method} {check.path} — {check.permission}
                </div>
              </div>
              <Badge tone={statusTone(results[check.path])}>{statusLabel(results[check.path])}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}