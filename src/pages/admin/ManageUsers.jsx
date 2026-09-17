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


const roleLabel = (role, t) => t(`enums.userRole.${role}`, { defaultValue: role });

const roleTone = (role) =>
  role === 'super_admin'
    ? 'cobalt'
    : role === 'admin'
      ? 'navy'
      : 'slate';


const PLAIN_USER_ROLE_ID = null;


const fetchUsers = () => getUsers().then((rows) => rows.map(mapUser));


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