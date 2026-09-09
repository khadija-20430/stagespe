import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getToken } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  Plus, Pencil, Lock, Unlock, ShieldCheck, Trash2, KeyRound,
  AlertTriangle, LogOut, CheckCircle2, Ban, Megaphone, Archive, RotateCw, Circle,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const AUDIT_LOG_PATH = '/audit-logs';

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const ACTION_LABELS = (t) => ({
  create: t('admin.audit.actions.create'),
  update: t('admin.audit.actions.update'),
  update_permissions: t('admin.audit.actions.update_permissions'),
  grant_permission: t('admin.audit.actions.grant_permission'),
  revoke_permission: t('admin.audit.actions.revoke_permission'),
  update_role: t('admin.audit.actions.update_role'),
  assign_role: t('admin.audit.actions.assign_role'),
  delete: t('admin.audit.actions.delete'),
  login_success: t('admin.audit.actions.login_success'),
  login_failed: t('admin.audit.actions.login_failed'),
  logout: t('admin.audit.actions.logout'),
  activate_user: t('admin.audit.actions.activate_user'),
  deactivate_user: t('admin.audit.actions.deactivate_user'),
  publish: t('admin.audit.actions.publish'),
  archive: t('admin.audit.actions.archive'),
  password_reset: t('admin.audit.actions.password_reset'),
});

const ACTION_TONE = {
  create: 'green',
  update_permissions: 'amber',
  grant_permission: 'green',
  revoke_permission: 'red',
  update: 'amber',
  update_role: 'amber',
  assign_role: 'amber',
  delete: 'red',
  login_success: 'cobalt',
  login_failed: 'red',
  logout: 'slate',
  activate_user: 'green',
  deactivate_user: 'red',
  publish: 'green',
  archive: 'slate',
  password_reset: 'amber',
};

const ACTION_ICON = {
  create: Plus,
  update: Pencil,
  update_permissions: Lock,
  grant_permission: Unlock,
  revoke_permission: Lock,
  update_role: ShieldCheck,
  assign_role: ShieldCheck,
  delete: Trash2,
  login_success: KeyRound,
  login_failed: AlertTriangle,
  logout: LogOut,
  activate_user: CheckCircle2,
  deactivate_user: Ban,
  publish: Megaphone,
  archive: Archive,
  password_reset: RotateCw,
};

const TABLES = [
  '', 'partner', 'project', 'call', 'mobility', 'document', 'agreement',
  'role', 'user', 'news_event',
];

export default function JournalAudit() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [tableName, setTableName] = useState('');
  const [action, setAction] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const actionLabels = ACTION_LABELS(t);

  const load = async () => {
    setError('');
    try {
      const params = new URLSearchParams();
      if (tableName) params.set('table_name', tableName);
      if (action) params.set('action', action);
      const qs = params.toString();
      const data = await apiFetch(`${AUDIT_LOG_PATH}${qs ? `?${qs}` : ''}`);
      setLogs(data);
    } catch (err) {
      setError(err.message);
      setLogs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white">{t('admin.audit.title')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('admin.audit.description')}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
          {error.includes('404') ? (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400">
              {t('admin.audit.routeError')}
            </div>
          ) : null}
        </div>
      ) : null}

      <Card className="mt-6 p-4 dark:bg-slate-900">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('admin.audit.tableLabel')}
            </label>
            <select
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
            >
              {TABLES.map((tb) => (
                <option key={tb} value={tb}>{tb || t('common.all')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('admin.audit.actionLabel')}
            </label>
            <input
              type="text"
              placeholder="ex: create, delete, login_success…"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
            />
          </div>
          <button
            onClick={load}
            className="rounded-lg bg-cobalt px-4 py-2 text-sm font-medium text-white"
          >
            {t('admin.audit.filter')}
          </button>
          {(tableName || action) && (
            <button
              onClick={() => { setTableName(''); setAction(''); }}
              className="text-sm text-slate-500 dark:text-slate-400 underline"
            >
              {t('admin.audit.reset')}
            </button>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5 dark:bg-slate-900">
        {logs === null ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('admin.crud.loading')}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('admin.crud.empty')}</p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-slate-700 pl-6">
            {logs.map((log) => {
              const isOpen = expandedId === log.id;
              const hasDetails = log.changes || log.old_data || log.new_data;
              const actionLabel = actionLabels[log.action] || log.action;
              return (
                <li key={log.id} className="mb-5 last:mb-0">
                  <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    {(() => {
                      const ActionIcon = ACTION_ICON[log.action] || Circle;
                      return <ActionIcon size={12} />;
                    })()}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONE[log.action] || 'slate'}>{actionLabel}</Badge>
                    {log.table_name ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500" translate="no">
                        {log.table_name}{log.record_id ? ` #${log.record_id}` : ''}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{log.user_name || 'Système'}</span>{' '}
                    <span className="text-slate-400 dark:text-slate-500">— {formatDate(log.created_at)}</span>
                  </p>
                  {hasDetails ? (
                    <button
                      onClick={() => setExpandedId(isOpen ? null : log.id)}
                      className="mt-1 text-xs font-medium text-cobalt"
                    >
                      {isOpen ? t('admin.audit.hideDetails') : t('admin.audit.showDetails')}
                    </button>
                  ) : null}
                  {isOpen && hasDetails ? (
                    <pre className="mt-2 max-w-xl overflow-x-auto rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
                      {JSON.stringify(log.changes || log.new_data || log.old_data, null, 2)}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}