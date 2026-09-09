import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getUsers,
  registerUser,
  updateUserProfile,
  updateUserRole,
  assignRoleToUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getRoles,
} from '../../services/api.js';
import { mapUser, toUserPayload } from '../../services/mappers.js';

/*
 * IMPORTANT : on n'utilise PAS t('admin') / t('super_admin') / t('utilisateur')
 * pour ces labels. Le namespace i18next a déjà une clé "admin" qui pointe
 * vers un objet (t('admin.title'), t('admin.logout')...), donc t('admin')
 * tout seul renvoie cet objet au lieu d'une chaîne -> erreur affichée en dur
 * dans le badge ("key 'admin (fr)' returned an object instead of string").
 * On utilise donc un mapping dédié, indépendant du système de traduction.
 */
const roleLabel = (role, t) => t(`enums.userRole.${role}`, { defaultValue: role });

const roleTone = (role) =>
  role === 'super_admin'
    ? 'cobalt'
    : role === 'admin'
      ? 'navy'
      : 'slate';

/*
 * Sentinelle pour représenter un utilisateur sans rôle RBAC détaillé.
 * Utilisée dans le select fusionné quand on choisit "Utilisateur (aucun rôle spécifique)".
 */
const PLAIN_USER_ROLE_ID = null;

// getUsers() renvoie des lignes brutes de la table users (jointes à roles) ;
// on les passe par mapUser pour matcher les noms de champs du formulaire.
const fetchUsers = () => getUsers().then((rows) => rows.map(mapUser));

/*
 * Le backend n'expose pas de PUT générique /auth/users/:id.
 * La modification passe par jusqu'à 4 endpoints séparés :
 *   1. /profile      -> nom + email
 *   2. /role         -> rôle simple (réinitialise role_id à NULL côté serveur)
 *   3. /assign-role  -> rôle détaillé RBAC (uniquement si le rôle est "admin")
 *   4. /activate ou /deactivate -> statut actif/inactif
 *
 * Le rôle doit être mis à jour AVANT d'assigner un role_id, sinon le
 * serveur refuse (il exige que l'utilisateur soit déjà "admin" au
 * moment de l'appel assign-role).
 */
const updateUserFull = async (id, payload) => {
  const { full_name, email, role, role_id, is_active } = payload;

  // ✅ Récupérer l'utilisateur actuel pour comparer
  const users = await getUsers();
  const currentUser = users.find(u => u.id === id);
  if (!currentUser) throw new Error('Utilisateur non trouvé');

  // ✅ Vérifier les changements
  const hasProfileChanges = (full_name && full_name !== currentUser.full_name) || 
                           (email && email !== currentUser.email);
  const hasRoleChange = role && role !== currentUser.role;
  const hasCustomRoleChange = role === 'admin' && role_id !== currentUser.role_id;
  const hasStatusChange = typeof is_active === 'boolean' && is_active !== currentUser.is_active;

  // ✅ Ne faire les appels que si les données ont changé
  if (hasProfileChanges) {
    await updateUserProfile(id, { full_name, email });
  }

  if (hasRoleChange) {
    await updateUserRole(id, role);
  }

  if (hasCustomRoleChange) {
    await assignRoleToUser(id, role_id);
  }

  if (hasStatusChange) {
    await (is_active ? activateUser : deactivateUser)(id);
  }
};

export default function ManageUsers() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch((err) =>
        console.error('Erreur récupération rôles:', err)
      );
  }, []);

  return (
    <CrudManager
      title={t('users')}
      icon={Users}
      idPrefix="user"

      fetcher={fetchUsers}
      toPayload={toUserPayload}
      onCreate={registerUser}
      onUpdate={updateUserFull}
      onDelete={deleteUser}

      columns={[
        {
          key: 'nom',
          label: t('nom'),
        },

        {
          key: 'email',
          label: t('email'),
        },

        {
          key: 'role',
          label: t('role'),
          render: (item) => (
            <Badge tone={
              item.role === 'admin' && item.roleName
                ? 'navy'
                : 'slate'
            }>
              {item.role === 'admin' && item.roleName
                ? item.roleName
                : roleLabel('utilisateur', t)}
            </Badge>
          ),
        },

        {
          key: 'isActive',
          label: t('status'),
          render: (item) => (
            <button
              type="button"
              onClick={() =>
                (item.isActive ? deactivateUser : activateUser)(item.id)
                  .then(() => window.location.reload())
                  .catch((err) =>
                    alert(err.message || 'Erreur lors du changement de statut')
                  )
              }
              title="Cliquer pour changer le statut"
            >
              <Badge tone={item.isActive ? 'green' : 'slate'}>
                {item.isActive ? t('active') : t('inactive')}
              </Badge>
            </button>
          ),
        },

        {
          key: 'lastLogin',
          label: t('lastLogin'),
          render: (item) =>
            item.lastLogin
              ? new Date(item.lastLogin).toLocaleString('fr-FR')
              : '—',
        },
      ]}

      fields={[
        {
          name: 'nom',
          label: t('nom'),
          type: 'text',
          required: true,
        },

        {
          name: 'email',
          label: t('email'),
          type: 'email',
          required: true,
        },

        {
          name: 'password',
          label: t('password'),
          type: 'text',
          help: 'Requis à la création (8+ caractères, une majuscule, une minuscule, un chiffre). Sans effet en modification.',
        },

        {
          name: 'roleSelectValue',
          label: t('role'),
          type: 'select',
          required: true,
          options: [
            {
              value: PLAIN_USER_ROLE_ID,
              label: 'Utilisateur (aucun rôle spécifique)',
            },
            ...roles.map((r) => ({
              value: r.id,
              label: r.name,
            })),
          ],
          help: 'Choisir un utilisateur simple ou un rôle RBAC détaillé.',
        },

        {
          name: 'isActive',
          label: t('status'),
          type: 'select',
          options: [
            { value: 'true', label: t('active') },
            { value: 'false', label: t('inactive') },
          ],
          help: 'Actif/inactif — sans effet à la création (les nouveaux comptes sont actifs par défaut).',
        },
      ]}
    />
  );
}