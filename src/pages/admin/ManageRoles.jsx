import { useEffect, useMemo, useState } from 'react';
import { getToken } from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';

const API = import.meta.env.VITE_API_URL;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Page de gestion des rôles personnalisés et de leurs permissions.
// Repose sur rolesRoutes.js (/roles) et permissionsRoutes.js (/permissions),
// tous deux protégés par checkRole('super_admin') côté backend.
export default function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [rolePermissionIds, setRolePermissionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busyPerm, setBusyPerm] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch('/roles'),
        apiFetch('/permissions'),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setSelectedRoleId((prev) => prev ?? (rolesData[0] ? rolesData[0].id : null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    apiFetch(`/roles/${selectedRoleId}`)
      .then((detail) => setRolePermissionIds(new Set(detail.permissions.map((p) => p.id))))
      .catch((err) => setError(err.message));
  }, [selectedRoleId]);

  const grouped = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    });
    return map;
  }, [permissions]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const togglePermission = async (permId, currentlyGranted) => {
    if (!selectedRoleId || selectedRole?.is_system) return;
    setBusyPerm(permId);
    setError('');
    try {
      // Bascule une seule permission — appliqué immédiatement côté backend,
      // sans cache : un admin utilisant ce rôle verra l'effet dès sa
      // prochaine requête, pas besoin de se reconnecter.
      await apiFetch(`/roles/${selectedRoleId}/permissions/toggle`, {
        method: 'PUT',
        body: { permission_id: permId, enabled: !currentlyGranted },
      });
      setRolePermissionIds((prev) => {
        const next = new Set(prev);
        if (currentlyGranted) next.delete(permId);
        else next.add(permId);
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyPerm(null);
    }
  };

  const createRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const role = await apiFetch('/roles', {
        method: 'POST',
        body: { name: newRoleName.trim(), description: newRoleDesc.trim() || null, permission_ids: [] },
      });
      setNewRoleName('');
      setNewRoleDesc('');
      await loadAll();
      setSelectedRoleId(role.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeRole = async (role) => {
    if (role.is_system) return;
    if (!window.confirm(`Supprimer le rôle "${role.name}" ? Les admins qui l'utilisent perdront ces permissions.`)) return;
    try {
      await apiFetch(`/roles/${role.id}`, { method: 'DELETE' });
      if (selectedRoleId === role.id) setSelectedRoleId(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Rôles &amp; permissions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Crée un rôle personnalisé, coche ses permissions, puis attribue-le à un compte admin
        (via <code className="rounded bg-slate-100 px-1 py-0.5" translate="no">PUT /auth/users/:id/assign-role</code>).
        Les changements sont vérifiés en base à chaque requête — aucun cache dans le token.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar rôles */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rôles ({roles.length})
            </div>
            <div className="space-y-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    role.id === selectedRoleId
                      ? 'bg-cobalt text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {role.name}
                    {role.is_system ? (
                      <span
                        className={`text-[10px] uppercase ${
                          role.id === selectedRoleId ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        système
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`tabular-nums text-xs ${
                      role.id === selectedRoleId ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {role.users_count}
                  </span>
                </button>
              ))}
              {!loading && roles.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-400">Aucun rôle pour l'instant.</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nouveau rôle
            </div>
            <form onSubmit={createRole} className="space-y-2">
              <input
                type="text"
                placeholder="Nom (ex : Gestionnaire appels)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
              <textarea
                placeholder="Description (optionnelle)"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
              />
              <Button type="submit" disabled={creating || !newRoleName.trim()} className="w-full">
                {creating ? '...' : 'Créer le rôle'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Grille de permissions */}
        <Card className="p-5">
          {!selectedRole ? (
            <p className="text-sm text-slate-400">Sélectionne un rôle pour voir ses permissions.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-navy">{selectedRole.name}</h2>
                  {selectedRole.description ? (
                    <p className="text-sm text-slate-500">{selectedRole.description}</p>
                  ) : null}
                </div>
                {selectedRole.is_system ? (
                  <Badge tone="slate">Rôle système — lecture seule</Badge>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => removeRole(selectedRole)}>
                    Supprimer ce rôle
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {Object.entries(grouped).map(([module, perms]) => (
                  <div key={module} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      {module}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {perms.map((perm) => {
                        const granted = rolePermissionIds.has(perm.id);
                        const disabled = selectedRole.is_system || busyPerm === perm.id;
                        return (
                          <div key={perm.id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <div className="text-sm text-slate-700">{perm.action}</div>
                              <div className="text-xs text-slate-400" translate="no">
                                {perm.code}
                              </div>
                            </div>
                            <button
                              onClick={() => togglePermission(perm.id, granted)}
                              disabled={disabled}
                              aria-pressed={granted}
                              aria-label={perm.code}
                              className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${
                                granted ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                  granted ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
