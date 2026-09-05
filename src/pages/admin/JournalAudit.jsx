import { useEffect, useState } from 'react';
import { getToken } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  Plus, Pencil, Lock, Unlock, ShieldCheck, Trash2, KeyRound,
  AlertTriangle, LogOut, CheckCircle2, Ban, Megaphone, Archive, RotateCw, Circle,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ⚠️ À corriger dès qu'on connaît le vrai chemin de montage de auditLogRoutes.js
// dans le fichier serveur (server.js / app.js), ex: app.use('/audit-logs', auditLogRoutes).
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

function actionLabel(action) {
  const map = {
    create: 'Création',
    update: 'Modification',
    update_permissions: 'Permissions mises à jour',
    grant_permission: 'Permission accordée',
    revoke_permission: 'Permission retirée',
    update_role: 'Rôle modifié',
    assign_role: 'Rôle attribué',
    delete: 'Suppression',
    login_success: 'Connexion réussie',
    login_failed: 'Tentative de connexion échouée',
    logout: 'Déconnexion',
    activate_user: 'Compte activé',
    deactivate_user: 'Compte désactivé',
    publish: 'Publication',
    archive: 'Archivage',
    password_reset: 'Mot de passe réinitialisé',
  };
  return map[action] || action;
}

const TABLES = [
  '', 'partner', 'project', 'call', 'mobility', 'document', 'agreement',
  'role', 'user', 'news_event',
];

export default function JournalAudit() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [tableName, setTableName] = useState('');
  const [action, setAction] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white">Journal d'audit</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Historique de toutes les actions effectuées dans l'admin — qui a fait quoi, et quand.
        Réservé au super_admin.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
          {error.includes('404') ? (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400">
              La route /audit-log semble introuvable — vérifie le chemin de montage de auditLogRoutes.js
              côté serveur et corrige AUDIT_LOG_PATH en haut de ce fichier.
            </div>
          ) : null}
        </div>
      ) : null}

      <Card className="mt-6 p-4 dark:bg-slate-900">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Table</label>
            <select
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
            >
              {TABLES.map((tb) => (
                <option key={tb} value={tb}>{tb || 'Toutes'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Action</label>
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
            Filtrer
          </button>
          {(tableName || action) && (
            <button
              onClick={() => { setTableName(''); setAction(''); }}
              className="text-sm text-slate-500 dark:text-slate-400 underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5 dark:bg-slate-900">
        {logs === null ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Aucune entrée pour ces filtres.</p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-slate-700 pl-6">
            {logs.map((log) => {
              const isOpen = expandedId === log.id;
              const hasDetails = log.changes || log.old_data || log.new_data;
              return (
                <li key={log.id} className="mb-5 last:mb-0">
                  <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    {(() => {
                      const ActionIcon = ACTION_ICON[log.action] || Circle;
                      return <ActionIcon size={12} />;
                    })()}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONE[log.action] || 'slate'}>{actionLabel(log.action)}</Badge>
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
                      {isOpen ? 'Masquer le détail' : 'Voir le détail'}
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