import { useEffect, useState } from 'react';
import { getToken } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

const API = import.meta.env.VITE_API_URL;

// Uniquement des routes GET, sans effet de bord : on peut relancer le test
// sans risque de créer des données parasites en base.
const CHECKS = [
  { label: 'Voir tous les appels (admin)', method: 'GET', path: '/calls/admin/all', permission: 'calls.view' },
  { label: 'Appels bientôt clos', method: 'GET', path: '/calls/closing-soon', permission: 'calls.view' },
  { label: 'Accords bientôt expirés', method: 'GET', path: '/agreements/expiring-soon', permission: 'agreements.view' },
  { label: "Journal d'audit", method: 'GET', path: '/audit-logs', permission: 'super_admin uniquement' },
  { label: 'Liste des utilisateurs', method: 'GET', path: '/auth/users', permission: 'super_admin uniquement' },
  { label: 'Historique des connexions', method: 'GET', path: '/auth/login-history', permission: 'super_admin uniquement' },
];

export default function TestAccess() {
  const [myPermissions, setMyPermissions] = useState(null);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

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
    for (const check of CHECKS) {
      try {
        const res = await fetch(`${API}${check.path}`, {
          method: check.method,
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        next[check.path] = res.status;
      } catch {
        next[check.path] = 'erreur réseau';
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
    if (status === 200) return 'Autorisé (200)';
    if (status === 403) return 'Refusé (403)';
    if (status === 401) return 'Non connecté (401)';
    if (status === undefined) return '—';
    return `Statut ${status}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white">Tester les accès RBAC</h1>
      

      <Card className="mt-6 p-5 dark:bg-slate-900">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Mes permissions effectives
        </div>
        {myPermissions === null ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
        ) : myPermissions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Aucune permission (compte utilisateur simple, ou admin sans rôle assigné).
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
            Endpoints à tester (lecture seule, sans risque)
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="rounded-lg bg-cobalt px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running ? 'Test en cours…' : 'Lancer le test'}
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {CHECKS.map((check) => (
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