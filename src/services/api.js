
// ============================================================
// API SERVICES
// Point d'accès unique aux données
// Express + PostgreSQL
// ============================================================

import {
    mapPartner,
    mapProjet,
    mapAppel,
    mapMobilite,
    mapActualite,
    mapDocument,
    mapStats,
    toDocumentPayload,
} from './mappers.js';


// ============================================================
// CONFIGURATION
// ============================================================

const API = import.meta.env.VITE_API_URL;


// Base pour les fichiers statiques
// Exemple:
// VITE_API_URL = http://localhost:5000/api
// FILES_BASE_URL = http://localhost:5000
export const FILES_BASE_URL = API.replace(/\/api\/?$/, '');


// ============================================================
// FICHIERS
// ============================================================

export const getFileUrl = (path) => {
    if (!path) return null;

    return path.startsWith('http')
        ? path
        : `${FILES_BASE_URL}${path}`;
};


// ============================================================
// TOKEN
// ============================================================

const TOKEN_KEY = 'esi_admin_token';

export const getToken = () =>
    localStorage.getItem(TOKEN_KEY);

export const setToken = (token) =>
    localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () =>
    localStorage.removeItem(TOKEN_KEY);


// ============================================================
// REQUEST PUBLIQUE
// ============================================================

const request = async (path) => {

    const res = await fetch(`${API}${path}`);

    if (!res.ok) {

        let message =
            `Erreur API (${res.status}) sur ${path}`;

        try {

            const data = await res.json();

            if (data.error) {
                message = data.error;
            }

        } catch {}

        throw new Error(message);
    }

    return res.json();
};


// ============================================================
// REQUEST AUTHENTIFIÉE
// ============================================================

const authRequest = async (
    path,
    {
        method = 'GET',
        body,
    } = {}
) => {

    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API}${path}`, {
        method,
        headers,
        body:
            body !== undefined
                ? JSON.stringify(body)
                : undefined,
    });

    if (!res.ok) {

        let message =
            `Erreur API (${res.status}) sur ${path}`;

        try {

            const data = await res.json();

            if (data.error) {
                message = data.error;
            }

        } catch {}

        throw new Error(message);
    }

    if (res.status === 204) {
        return null;
    }

    return res.json();
};


// ============================================================
// AUTH
// ============================================================

export const login = async (
    email,
    password
) => {

    const data = await authRequest(
        '/auth/login',
        {
            method: 'POST',
            body: {
                email,
                password,
            },
        }
    );

    setToken(data.token);

    return data.user;
};


export const logout = async () => {

    try {
        await authRequest(
            '/auth/logout',
            {
                method: 'POST',
            }
        );
    } catch {}

    clearToken();
};


export const getMe = () =>
    authRequest('/auth/me');


// ============================================================
// PROJETS
// ============================================================

export const getProjets = async (
    lang = 'fr'
) => {

    const data =
        await request(
            `/projects?lang=${lang}`
        );

    return data.map(mapProjet);
};


export const getProjetsAdmin = async () => {

    const data =
        await authRequest(
            '/projects/admin/all'
        );

    return data.map(mapProjet);
};


export const getProjetById = async (
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/projects/${id}?lang=${lang}`
        );

    return mapProjet(data);
};


// CRUD

export const createProjet = (
    payload
) =>
    authRequest(
        '/projects',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateProjet = (
    id,
    payload
) =>
    authRequest(
        `/projects/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteProjet = (
    id
) =>
    authRequest(
        `/projects/${id}`,
        {
            method: 'DELETE',
        }
    );


// Publication

export const publishProjet = (
    id
) =>
    authRequest(
        `/projects/${id}/publish`,
        {
            method: 'PUT',
        }
    );


export const archiveProjet = (
    id
) =>
    authRequest(
        `/projects/${id}/archive`,
        {
            method: 'PUT',
        }
    );


// ============================================================
// APPELS À PROJETS
// ============================================================

export const getAppels = async (
    lang = 'fr'
) => {

    const data =
        await request(
            `/calls?lang=${lang}`
        );

    return data.map(mapAppel);
};


export const getAppelsAdmin = async (
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/calls/admin/all?lang=${lang}`
        );

    return data.map(mapAppel);
};


export const getAppelById = async (
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/calls/${id}?lang=${lang}`
        );

    return mapAppel(data);
};


// CRUD

export const createAppel = (
    payload
) =>
    authRequest(
        '/calls',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateAppel = (
    id,
    payload
) =>
    authRequest(
        `/calls/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteAppel = (
    id
) =>
    authRequest(
        `/calls/${id}`,
        {
            method: 'DELETE',
        }
    );


// Publication

export const publishAppel = (
    id
) =>
    authRequest(
        `/calls/${id}/publish`,
        {
            method: 'PUT',
        }
    );


export const archiveAppel = (
    id
) =>
    authRequest(
        `/calls/${id}/archive`,
        {
            method: 'PUT',
        }
    );


// ============================================================
// MOBILITÉS
// ============================================================

export const getMobilites = async (
    lang = 'fr'
) => {

    const data =
        await request(
            `/mobility?lang=${lang}`
        );

    return data.map(mapMobilite);
};


export const getMobilitesAdmin = async (
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/mobility/admin/all?lang=${lang}`
        );

    return data.map(mapMobilite);
};


export const getMobiliteById = async (
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/mobility/${id}?lang=${lang}`
        );

    return mapMobilite(data);
};


// CRUD

export const createMobilite = (
    payload
) =>
    authRequest(
        '/mobility',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateMobilite = (
    id,
    payload
) =>
    authRequest(
        `/mobility/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteMobilite = (
    id
) =>
    authRequest(
        `/mobility/${id}`,
        {
            method: 'DELETE',
        }
    );


// Publication

export const publishMobilite = (
    id
) =>
    authRequest(
        `/mobility/${id}/publish`,
        {
            method: 'PUT',
        }
    );


export const archiveMobilite = (
    id
) =>
    authRequest(
        `/mobility/${id}/archive`,
        {
            method: 'PUT',
        }
    );


// ============================================================
// PARTENAIRES
// ============================================================

export const getPartenaires = async (
    lang = 'fr'
) => {

    const data =
        await request(
            `/partners?lang=${lang}`
        );

    return data.map(mapPartner);
};


export const getPartenairesAdmin = async (
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/partners/admin/all?lang=${lang}`
        );

    return data.map(mapPartner);
};


export const getPartenaireById = async (
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/partners/${id}?lang=${lang}`
        );

    return mapPartner(data);
};


export const getPartenairesMap = async () =>
    request('/partners/map');


// CRUD

export const createPartenaire = (
    payload
) =>
    authRequest(
        '/partners',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updatePartenaire = (
    id,
    payload
) =>
    authRequest(
        `/partners/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deletePartenaire = (
    id
) =>
    authRequest(
        `/partners/${id}`,
        {
            method: 'DELETE',
        }
    );


// Publication
//
// ⚠️ Les routes doivent exister dans ton backend.

export const publishPartner = (
    id
) =>
    authRequest(
        `/partners/${id}/publish`,
        {
            method: 'PUT',
        }
    );


export const archivePartner = (
    id
) =>
    authRequest(
        `/partners/${id}/archive`,
        {
            method: 'PUT',
        }
    );


// Alias avec ancien nommage éventuel

export const publishPARTNER = publishPartner;

export const archivePARTNER = archivePartner;


// ============================================================
// ACTUALITÉS / ÉVÉNEMENTS
// ============================================================

export const getActualites = async () => {

    const data =
        await request(
            '/news-events'
        );

    return data.map(mapActualite);
};


export const getActualiteById = async (
    id
) => {

    const data =
        await request(
            `/news-events/${id}`
        );

    return mapActualite(data);
};


export const getActualitesAdmin = async () => {

    const data =
        await authRequest(
            '/news-events/admin/all'
        );

    return data.map(mapActualite);
};


// CRUD

export const createActualite = (
    payload
) =>
    authRequest(
        '/news-events',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateActualite = (
    id,
    payload
) =>
    authRequest(
        `/news-events/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteActualite = (
    id
) =>
    authRequest(
        `/news-events/${id}`,
        {
            method: 'DELETE',
        }
    );


// Publication

export const publishActualite = (
    id
) =>
    authRequest(
        `/news-events/${id}/publish`,
        {
            method: 'PUT',
        }
    );


export const archiveActualite = (
    id
) =>
    authRequest(
        `/news-events/${id}/archive`,
        {
            method: 'PUT',
        }
    );


// ============================================================
// DOCUMENTS
// ============================================================

export const getDocuments = async () => {

    const data =
        await request(
            '/documents'
        );

    return data.map(mapDocument);
};


export const getDocumentsAdmin = async () => {

    const data =
        await authRequest(
            '/documents/admin/all'
        );

    return data.map(mapDocument);
};


export const getDocumentById = async (
    id
) => {

    const data =
        await request(
            `/documents/${id}`
        );

    return mapDocument(data);
};


// ============================================================
// UPLOAD FICHIER
// ============================================================

export const uploadFile = async (
    file
) => {

    const formData =
        new FormData();

    formData.append(
        'file',
        file
    );

    const res =
        await fetch(
            `${API}/documents/upload`,
            {
                method: 'POST',

                headers: {
                    Authorization:
                        `Bearer ${getToken()}`,
                },

                body: formData,
            }
        );

    if (!res.ok) {

        const err =
            await res
                .json()
                .catch(() => ({}));

        throw new Error(
            err.error ||
            "Échec de l'upload du fichier"
        );
    }

    return res.json();
};


// ============================================================
// DOCUMENTS CRUD
// ============================================================

export const createDocument = (
    payload
) =>
    authRequest(
        '/documents',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateDocument = (
    id,
    payload
) =>
    authRequest(
        `/documents/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteDocument = (
    id
) =>
    authRequest(
        `/documents/${id}`,
        {
            method: 'DELETE',
        }
    );


// ============================================================
// DOCUMENTS — PUBLICATION
//
// ⚠️ IMPORTANT
// La colonne PostgreSQL est : statut_publication
// ============================================================

export const publishDocument = async (
    id
) => {

    const document =
        await getDocumentById(id);

    const payload =
        toDocumentPayload({
            ...document,

            statutPublication:
                'published',
        });

    return updateDocument(
        id,
        payload
    );
};


// ============================================================
// DOCUMENTS — ARCHIVAGE
// ============================================================

export const archiveDocument = async (
    id
) => {

    const document =
        await getDocumentById(id);

    const payload =
        toDocumentPayload({
            ...document,

            statutPublication:
                'archived',
        });

    return updateDocument(
        id,
        payload
    );
};


// ============================================================
// CATÉGORIES DOCUMENTS
// ============================================================

export const getDocumentCategories = () =>
    request(
        '/document-categories'
    );


// ============================================================
// STATISTIQUES
// ============================================================

export const getStats = async () => {

    const data =
        await request(
            '/stats'
        );

    return mapStats(data);
};


// ============================================================
// DONNÉES DE RÉFÉRENCE
// ============================================================

export const getCountries = () =>
    request('/countries');


export const getProgrammes = () =>
    request('/programmes');


export const getEstablishmentTypes = () =>
    request('/establishment-types');


export const getPartnershipTypes = () =>
    request('/partnership-types');


export const getActionTypes = () =>
    request('/action-types');


export const getThemes = () =>
    request('/themes');


// ============================================================
// RBAC — RÔLES & PERMISSIONS
// ============================================================

export const getRoles = () =>
    authRequest('/roles');


export const getRoleById = (
    id
) =>
    authRequest(
        `/roles/${id}`
    );


export const createRole = (
    payload
) =>
    authRequest(
        '/roles',
        {
            method: 'POST',
            body: payload,
        }
    );


export const updateRole = (
    id,
    payload
) =>
    authRequest(
        `/roles/${id}`,
        {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteRole = (
    id
) =>
    authRequest(
        `/roles/${id}`,
        {
            method: 'DELETE',
        }
    );


export const setRolePermissions = (
    id,
    permissionIds
) =>
    authRequest(
        `/roles/${id}/permissions`,
        {
            method: 'PUT',
            body: {
                permission_ids:
                    permissionIds,
            },
        }
    );


export const toggleRolePermission = (
    id,
    permissionId,
    enabled
) =>
    authRequest(
        `/roles/${id}/permissions/toggle`,
        {
            method: 'PUT',
            body: {
                permission_id:
                    permissionId,
                enabled,
            },
        }
    );


export const getPermissions = () =>
    authRequest(
        '/permissions'
    );


export const getMyPermissions = () =>
    authRequest(
        '/auth/my-permissions'
    );


// ============================================================
// UTILISATEURS — SUPER ADMIN
// ============================================================

export const getUsers = () =>
    authRequest(
        '/auth/users'
    );


export const registerUser = (
    payload
) =>
    authRequest(
        '/auth/register',
        {
            method: 'POST',
            body: payload,
        }
    );


export const activateUser = (
    id
) =>
    authRequest(
        `/auth/users/${id}/activate`,
        {
            method: 'PUT',
        }
    );


export const deactivateUser = (
    id
) =>
    authRequest(
        `/auth/users/${id}/deactivate`,
        {
            method: 'PUT',
        }
    );


export const updateUserRole = (
    id,
    role
) =>
    authRequest(
        `/auth/users/${id}/role`,
        {
            method: 'PUT',
            body: {
                role,
            },
        }
    );


export const assignRoleToUser = (
    id,
    roleId
) =>
    authRequest(
        `/auth/users/${id}/assign-role`,
        {
            method: 'PUT',
            body: {
                role_id:
                    roleId,
            },
        }
    );


export const getLoginHistory = () =>
    authRequest(
        '/auth/login-history'
    );


// ============================================================
// AUDIT LOG
// ============================================================

export const getAuditLog = (
    params = {}
) => {

    const qs =
        new URLSearchParams(
            params
        ).toString();

    return authRequest(
        `/audit-logs${
            qs
                ? `?${qs}`
                : ''
        }`
    );
};


// ============================================================
// RÉGLAGES — SUPER ADMIN
// ============================================================

export const getResetSettings = () =>
    authRequest(
        '/settings'
    );


export const updateResetSettings = (
    payload
) =>
    authRequest(
        '/settings',
        {
            method: 'PUT',
            body: payload,
        }
    );

