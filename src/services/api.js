// ============================================================
// API SERVICES
// Point d'accès unique aux données
// Express + PostgreSQL
// ============================================================


import {
    mapPartner,
    mapPartnerDetail,   // 🔧 AJOUTÉ — manquait à l'import
    mapProjet,
    mapAppel,
    mapMobilite,
    mapActualite,
    mapDocument,
    mapStats,
    mapAgreement,
    mapSchoolPresentation,
    toAppelPayload,
    toProjetPayload,
    toMobilitePayload,
    toActualitePayload,
    toPartnerPayload,
    toDocumentPayload,
    toAgreementPayload,
    mapProgramme,
} from './mappers.js';



// ============================================================
// CONFIGURATION
// ============================================================

const API =
    import.meta.env.VITE_API_URL;


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

    return path.startsWith('http') ?
        path :
        `${FILES_BASE_URL}${path}`;
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

const request = async(path) => {

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

const authRequest = async(
    path, {
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
        body: body !== undefined ?
            JSON.stringify(body) : undefined,
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

export const login = async(
    email,
    password
) => {

    const data = await authRequest(
        '/auth/login', {
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


export const logout = async() => {

    try {
        await authRequest(
            '/auth/logout', {
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

export const getProjets = async(
    lang = 'fr'
) => {

    const data =
        await request(
            `/projects?lang=${lang}`
        );

    return data.map(mapProjet);
};


export const getProjetsAdmin = async() => {

    const data =
        await authRequest(
            '/projects/admin/all'
        );

    return data.map(mapProjet);
};

export const getProjetsAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/projects/admin/all/preview?lang=${lang}`);
    return data.map(mapProjet);
};

export const getProjetById = async(
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/projects/${id}?lang=${lang}`
        );

    return mapProjet(data);
};
export const getProjetTranslations = async(id) => {
    return authRequest(`/projects/${id}/translations`);
};

export const updateProjetTranslations = async(id, payload) => {
    return authRequest(`/projects/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};

// CRUD

export const createProjet = (
        payload
    ) =>
    authRequest(
        '/projects', {
            method: 'POST',
            body: payload,
        }
    );


export const updateProjet = (
        id,
        payload
    ) =>
    authRequest(
        `/projects/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteProjet = (
        id
    ) =>
    authRequest(
        `/projects/${id}`, {
            method: 'DELETE',
        }
    );


// Publication

export const publishProjet = (
        id
    ) =>
    authRequest(
        `/projects/${id}/publish`, {
            method: 'PATCH',
        }
    );


export const archiveProjet = (
        id
    ) =>
    authRequest(
        `/projects/${id}/archive`, {
            method: 'PATCH',
        }
    );


// ============================================================
// APPELS À PROJETS
// ============================================================

export const getAppels = async(
    lang = 'fr'
) => {

    const data =
        await request(
            `/calls?lang=${lang}`
        );

    return data.map(mapAppel);
};


export const getAppelsAdmin = async(
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/calls/admin/all?lang=${lang}`
        );

    return data.map(mapAppel);
};

export const getAppelsAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/calls/admin/all/preview?lang=${lang}`);
    return data.map(mapAppel);
};


export const getAppelById = async(
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/calls/${id}?lang=${lang}`
        );

    return mapAppel(data);
};
export const getCallTranslations = async(id) => {
    return authRequest(`/calls/${id}/translations`);
};

export const updateCallTranslations = async(id, payload) => {
    return authRequest(`/calls/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};

// CRUD

export const createAppel = (
        payload
    ) =>
    authRequest(
        '/calls', {
            method: 'POST',
            body: payload,
        }
    );


export const updateAppel = (
        id,
        payload
    ) =>
    authRequest(
        `/calls/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteAppel = (
        id
    ) =>
    authRequest(
        `/calls/${id}`, {
            method: 'DELETE',
        }
    );


// Publication

export const publishAppel = (
        id
    ) =>
    authRequest(
        `/calls/${id}/publish`, {
            method: 'PATCH',
        }
    );


export const archiveAppel = (
        id
    ) =>
    authRequest(
        `/calls/${id}/archive`, {
            method: 'PATCH',
        }
    );


// ============================================================
// MOBILITÉS
// ============================================================

export const getMobilites = async(
    lang = 'fr'
) => {

    const data =
        await request(
            `/mobility?lang=${lang}`
        );

    return data.map(mapMobilite);
};


export const getMobilitesAdmin = async(
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/mobility/admin/all?lang=${lang}`
        );

    return data.map(mapMobilite);
};
export const getMobilitesAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/mobility/admin/all/preview?lang=${lang}`);
    return data.map(mapMobilite);
};

export const getMobiliteById = async(
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/mobility/${id}?lang=${lang}`
        );

    return mapMobilite(data);
};


export const getMobilitiesTranslations = async(id) => {
    return authRequest(`/mobility/${id}/translations`);
};

export const updateMobilitiesTranslations = async(id, payload) => {
    return authRequest(`/mobility/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};
// CRUD

export const createMobilite = (
        payload
    ) =>
    authRequest(
        '/mobility', {
            method: 'POST',
            body: payload,
        }
    );


export const updateMobilite = (
        id,
        payload
    ) =>
    authRequest(
        `/mobility/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteMobilite = (
        id
    ) =>
    authRequest(
        `/mobility/${id}`, {
            method: 'DELETE',
        }
    );


// Publication

export const publishMobilite = (
        id
    ) =>
    authRequest(
        `/mobility/${id}/publish`, {
            method: 'PATCH',
        }
    );


export const archiveMobilite = (
        id
    ) =>
    authRequest(
        `/mobility/${id}/archive`, {
            method: 'PATCH',
        }
    );


// ============================================================
// PARTENAIRES
// ============================================================

export const getPartenaires = async(
    lang = 'fr'
) => {

    const data =
        await request(
            `/partners?lang=${lang}`
        );

    return data.map(mapPartner);
};


export const getPartenairesAdmin = async(
    lang = 'fr'
) => {

    const data =
        await authRequest(
            `/partners/admin/all?lang=${lang}`
        );

    return data.map(mapPartner);
};
export const getPartenairesAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/partners/admin/all/preview?lang=${lang}`);
    return data.map(mapPartner);
};


export const getPartenaireById = async(
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/partners/${id}?lang=${lang}`
        );

    return mapPartnerDetail(data);
};

export const getPartenaireTranslations = async(id) => {
    return authRequest(`/partners/${id}/translations`);
};

export const updatePartenaireTranslations = async(id, payload) => {
    return authRequest(`/partners/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};

export const getPartenairesMap = async() =>
    request('/partners/map');


// CRUD

export const createPartenaire = (
        payload
    ) =>
    authRequest(
        '/partners', {
            method: 'POST',
            body: payload,
        }
    );


export const updatePartenaire = (
        id,
        payload
    ) =>
    authRequest(
        `/partners/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deletePartenaire = (
        id
    ) =>
    authRequest(
        `/partners/${id}`, {
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
        `/partners/${id}/publish`, {
            method: 'PATCH',
        }
    );


export const archivePartner = (
        id
    ) =>
    authRequest(
        `/partners/${id}/archive`, {
            method: 'PATCH',
        }
    );


// Alias avec ancien nommage éventuel

export const publishPARTNER = publishPartner;

export const archivePARTNER = archivePartner;


// ============================================================
// ACTUALITÉS / ÉVÉNEMENTS
// ============================================================

export const getActualites = async(
    lang = 'fr'
) => {

    const data =
        await request(
            `/news-events?lang=${lang}`
        );

    return data.map(mapActualite);
};


export const getActualiteById = async(
    id,
    lang = 'fr'
) => {

    const data =
        await request(
            `/news-events/${id}?lang=${lang}`
        );

    return mapActualite(data);
};


export const getActualitesAdmin = async() => {

    const data =
        await authRequest(
            '/news-events/admin/all'
        );

    return data.map(mapActualite);
};
export const getActualitesAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/news-events/admin/all/preview?lang=${lang}`);
    return data.map(mapActualite);
};

// CRUD
export const getActualiteTranslations = async(id) => {
    return authRequest(`/news-events/${id}/translations`);
};

export const updateActualiteTranslations = async(id, payload) => {
    return authRequest(`/news-events/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};
export const createActualite = (
        payload
    ) =>
    authRequest(
        '/news-events', {
            method: 'POST',
            body: payload,
        }
    );


export const updateActualite = (
        id,
        payload
    ) =>
    authRequest(
        `/news-events/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteActualite = (
        id
    ) =>
    authRequest(
        `/news-events/${id}`, {
            method: 'DELETE',
        }
    );


// Publication

export const publishActualite = (
        id
    ) =>
    authRequest(
        `/news-events/${id}/publish`, {
            method: 'PATCH',
        }
    );


export const archiveActualite = (
        id
    ) =>
    authRequest(
        `/news-events/${id}/archive`, {
            method: 'PATCH',
        }
    );


// ============================================================
// DOCUMENTS
// ============================================================

export const getDocuments = async(lang = 'fr') => {
    const data = await request(`/documents?lang=${lang}`);
    return data.map(mapDocument);
};


export const getDocumentsAdmin = async() => {

    const data =
        await authRequest(
            '/documents/admin/all'
        );

    return data.map(mapDocument);
};


export const getDocumentById = async(
    id
) => {

    const data =
        await request(
            `/documents/${id}`
        );

    return mapDocument(data);
};
export const getDocumentsAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/documents/admin/all/preview?lang=${lang}`);
    return data.map(mapDocument);
};

export const getDocumentTranslations = async(id) => {
    return authRequest(`/documents/${id}/translations`);
};

export const updateDocumentTranslations = async(id, payload) => {
    return authRequest(`/documents/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};

// ============================================================
// UPLOAD FICHIER
// ============================================================

export const uploadFile = async(
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
            `${API}/documents/upload`, {
                method: 'POST',

                headers: {
                    Authorization: `Bearer ${getToken()}`,
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
        '/documents', {
            method: 'POST',
            body: payload,
        }
    );


export const updateDocument = (
        id,
        payload
    ) =>
    authRequest(
        `/documents/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteDocument = (
        id
    ) =>
    authRequest(
        `/documents/${id}`, {
            method: 'DELETE',
        }
    );


// ============================================================
// DOCUMENTS — PUBLICATION
//
// Appelle directement les routes dédiées côté backend (vérifiées
// fonctionnelles dans Postman), au lieu de reconstruire un payload
// complet via getDocumentById + updateDocument.
// ============================================================

export const publishDocument = (
        id
    ) =>
    authRequest(
        `/documents/${id}/publish`, {
            method: 'PUT',
        }
    );


// ============================================================
// DOCUMENTS — ARCHIVAGE
// ============================================================

export const archiveDocument = (
        id
    ) =>
    authRequest(
        `/documents/${id}/archive`, {
            method: 'PUT',
        }
    );
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

export const getStats = async() => {

    const data =
        await request(
            '/stats'
        );

    return mapStats(data);
};


// ============================================================
// DONNÉES DE RÉFÉRENCE
// ============================================================
export const getCountries = (lang = 'fr') =>
    request(`/countries?lang=${lang}`);


export const getProgrammes = () =>
    request('/programmes');


export const getEstablishmentTypes = () =>
    request('/establishment-types');


export const getPartnershipTypes = () =>
    request('/partnership-types');


export const getActionTypes = () =>
    request('/action-types');


export const getThemes = (lang = 'fr') =>
    request(`/themes?lang=${lang}`);

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
        '/roles', {
            method: 'POST',
            body: payload,
        }
    );


export const updateRole = (
        id,
        payload
    ) =>
    authRequest(
        `/roles/${id}`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteRole = (
        id
    ) =>
    authRequest(
        `/roles/${id}`, {
            method: 'DELETE',
        }
    );


export const setRolePermissions = (
        id,
        permissionIds
    ) =>
    authRequest(
        `/roles/${id}/permissions`, {
            method: 'PUT',
            body: {
                permission_ids: permissionIds,
            },
        }
    );


export const toggleRolePermission = (
        id,
        permissionId,
        enabled
    ) =>
    authRequest(
        `/roles/${id}/permissions/toggle`, {
            method: 'PUT',
            body: {
                permission_id: permissionId,
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
        '/auth/register', {
            method: 'POST',
            body: payload,
        }
    );


export const activateUser = (
        id
    ) =>
    authRequest(
        `/auth/users/${id}/activate`, {
            method: 'PUT',
        }
    );


export const deactivateUser = (
        id
    ) =>
    authRequest(
        `/auth/users/${id}/deactivate`, {
            method: 'PUT',
        }
    );


export const updateUserRole = (
        id,
        role
    ) =>
    authRequest(
        `/auth/users/${id}/role`, {
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
        `/auth/users/${id}/assign-role`, {
            method: 'PUT',
            body: {
                role_id: roleId,
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
    export const updateUserProfile = (
        id,
        payload
    ) =>
    authRequest(
        `/auth/users/${id}/profile`, {
            method: 'PUT',
            body: payload,
        }
    );


export const deleteUser = (
        id
    ) =>
    authRequest(
        `/auth/users/${id}`, {
            method: 'DELETE',
        }
    );
    // Dans api.js - Ajouter ces fonctions

// ============================================================
// À AJOUTER dans api.js (après les imports)
// ============================================================


// ============================================================
// ACCORDS / AGREEMENTS
// ============================================================
// ============================================================
// À AJOUTER DANS: src/services/api.js
// ============================================================

// 1️⃣ EN HAUT (avec les autres imports):
// Ajouter mapAgreement et toAgreementPayload aux imports existants




// 2️⃣ AJOUTER À LA FIN DU FICHIER (après deleteUser):

// ============================================================
// ACCORDS / AGREEMENTS
// ============================================================

export const getAgreements = async(lang = 'fr') => {
    const data = await request(`/agreements?lang=${lang}`);
    return data.map(mapAgreement);
};

export const getAgreementsAdmin = async() => {
    const data = await authRequest('/agreements/admin/all'); // ← FIX ICI
    return data.map(mapAgreement);
};

export const getAgreementById = async(id) => {
    const data = await request(`/agreements/${id}`);
    return mapAgreement(data);
};
export const getAgreementsByPartner = async(partnerId) => {
    const data = await request(`/agreements?partner_id=${partnerId}`);
    return data.map(mapAgreement);
};

export const getAgreementsExpiringSoon = async() => {
    const data = await authRequest('/agreements/expiring-soon');
    return data.map(mapAgreement);
};

export const getAgreementsAdminPreview = async(lang = 'en') => {
    const data = await authRequest(`/agreements/admin/all/preview?lang=${lang}`);
    return data.map(mapAgreement);
};

export const getAgreementTranslations = async(id) => {
    return authRequest(`/agreements/${id}/translations`);
};

export const updateAgreementTranslations = async(id, payload) => {
    return authRequest(`/agreements/${id}/translations`, {
        method: 'PUT',
        body: payload,
    });
};
// CRUD

export const createAgreement = (payload) =>
    authRequest('/agreements', {
        method: 'POST',
        body: payload,
    });

export const updateAgreement = (id, payload) =>
    authRequest(`/agreements/${id}`, {
        method: 'PUT',
        body: payload,
    });

export const deleteAgreement = (id) =>
    authRequest(`/agreements/${id}`, {
        method: 'DELETE',
    });

// FILE UPLOAD

export const uploadAgreementFile = async(file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(
        `${API}/agreements/upload`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            body: formData,
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'upload du fichier");
    }

    return res.json();
};
// ============================================================
// SCHOOL PRESENTATION
// ============================================================

// PUBLIC — Routes sans authentification
export const getSchoolPresentations = async () => {
    const data = await request('/school-presentation');
    return data;
};

export const getSchoolPresentationById = async (id) => {
    const data = await request(`/school-presentation/${id}`);
    return data;
};

export const getSchoolPresentationByLanguage = async (code) => {
    const data = await request(`/school-presentation/lang/${code}`);
    return mapSchoolPresentation(data);
};

// ADMIN — Routes protégées
export const getSchoolPresentationsAdmin = async () => {
    const data = await authRequest('/school-presentation/admin/all');
    return data;
};

export const uploadSchoolFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API}/school-presentation/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'upload du fichier");
    }
    return res.json();
};

export const createSchoolPresentation = async (data) => {
    // Si c'est un FormData (upload de fichier)
    if (data instanceof FormData) {
        const res = await fetch(`${API}/school-presentation`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: data,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Erreur lors de la création");
        }
        return res.json();
    }
    return authRequest('/school-presentation', { method: 'POST', body: data });
};

export const addSchoolTranslation = async (id, data) => {
    if (data instanceof FormData) {
        const res = await fetch(`${API}/school-presentation/${id}/translations`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: data,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Erreur lors de l'ajout de la traduction");
        }
        return res.json();
    }
    return authRequest(`/school-presentation/${id}/translations`, { method: 'POST', body: data });
};

export const updateSchoolTranslation = async (translationId, payload) => {
    return authRequest(`/school-presentation/translations/${translationId}`, {
        method: 'PUT',
        body: payload,
    });
};

export const replaceSchoolFile = async (translationId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API}/school-presentation/translations/${translationId}/file`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du remplacement du fichier");
    }
    return res.json();
};

export const getSchoolRevisions = async (translationId) => {
    const data = await authRequest(`/school-presentation/translations/${translationId}/revisions`);
    return data;
};

export const updateSchoolVisibilite = async (id, visibilite) => {
    return authRequest(`/school-presentation/${id}/visibilite`, {
        method: 'PATCH',
        body: { visibilite },
    });
};

export const publishSchoolPresentation = async (id) => {
    return authRequest(`/school-presentation/${id}/publish`, { method: 'PUT' });
};

export const archiveSchoolPresentation = async (id) => {
    return authRequest(`/school-presentation/${id}/archive`, { method: 'PUT' });
};

export const deleteSchoolPresentation = async (id) => {
    return authRequest(`/school-presentation/${id}`, { method: 'DELETE' });
};

export const deleteSchoolTranslation = async (translationId) => {
    return authRequest(`/school-presentation/translations/${translationId}`, { method: 'DELETE' });
};// ============================================================
// NOTIFICATIONS
// ============================================================

// Récupérer les notifications de l'utilisateur connecté (avec pagination)
export const getNotifications = async (limit = 50, offset = 0) => {
    const data = await authRequest(`/notifications/me?limit=${limit}&offset=${offset}`);
    return data;
};

// Récupérer uniquement les notifications non lues
export const getUnreadNotifications = async () => {
    const data = await authRequest('/notifications/me/unread');
    return data;
};

// Récupérer le nombre de notifications non lues
export const getUnreadCount = async () => {
    const data = await authRequest('/notifications/me/unread-count');
    return data;
};

// Marquer une notification comme lue
export const markAsRead = async (id) => {
    const data = await authRequest(`/notifications/${id}/read`, { method: 'PUT' });
    return data;
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async () => {
    const data = await authRequest('/notifications/me/read-all', { method: 'PUT' });
    return data;
};

// Supprimer une notification
export const deleteNotification = async (id) => {
    const data = await authRequest(`/notifications/${id}`, { method: 'DELETE' });
    return data;
};

// Supprimer toutes les notifications de l'utilisateur connecté
export const deleteAllNotifications = async () => {
    const data = await authRequest('/notifications/me/all', { method: 'DELETE' });
    return data;
};

// ============================================================
// NOTIFICATIONS - ROUTES ADMIN (super_admin uniquement)
// ============================================================

// Récupérer toutes les notifications (admin)
export const getAllNotificationsAdmin = async (limit = 100, offset = 0) => {
    const data = await authRequest(`/notifications/admin/all?limit=${limit}&offset=${offset}`);
    return data;
};

// Créer une notification pour un utilisateur spécifique
export const createNotification = async (data) => {
    return await authRequest('/notifications/admin', {
        method: 'POST',
        body: data
    });
};

// Créer des notifications pour plusieurs utilisateurs
export const createNotificationsForUsers = async (data) => {
    return await authRequest('/notifications/admin/bulk', {
        method: 'POST',
        body: data
    });
};

// Créer des notifications par rôle RBAC
export const createNotificationsByRole = async (data) => {
    return await authRequest('/notifications/admin/by-role', {
        method: 'POST',
        body: data
    });
};

// Supprimer toutes les notifications d'un utilisateur spécifique (admin)
export const deleteAllNotificationsByUser = async (userId) => {
    const data = await authRequest(`/notifications/admin/user/${userId}/all`, { method: 'DELETE' });
    return data;
};

// PROGRAMMES — PUBLIC
export const getProgrammesPublic = async (lang = 'fr') => {
  const data = await request(`/programmes?lang=${lang}`);
  return data.map(mapProgramme);
};

// PROGRAMMES — ADMIN
export const getProgrammesAdmin = async () => {
  const data = await authRequest('/programmes/admin/all');
  return data.map(mapProgramme);
};

export const getProgrammesAdminPreview = async (lang = 'en') => {
  const data = await authRequest(`/programmes/admin/all/preview?lang=${lang}`);
  return data.map(mapProgramme);
};

export const getProgrammeTranslations = async (id) =>
  authRequest(`/programmes/${id}/translations`);

export const updateProgrammeTranslations = async (id, payload) =>
  authRequest(`/programmes/${id}/translations`, { method: 'PUT', body: payload });

export const createProgramme = (payload) =>
  authRequest('/programmes', { method: 'POST', body: payload });

export const updateProgramme = (id, payload) =>
  authRequest(`/programmes/${id}`, { method: 'PUT', body: payload });

export const deleteProgramme = (id) =>
  authRequest(`/programmes/${id}`, { method: 'DELETE' });
export const publishProgramme = (id) =>
    authRequest(`/programmes/${id}/publish`, {
        method: 'PATCH',
    });

export const archiveProgramme = (id) =>
    authRequest(`/programmes/${id}/archive`, {
        method: 'PATCH',
    });
// ============================================================
// HOME SLIDES
// ============================================================

export const getHomeSlidesAdmin = (lang = 1) =>
    authRequest(`/home-slides/admin/all?lang=${lang}`);
export const getHomeSlides = (lang = 1) =>
    request(`/home-slides?lang=${lang}`);
export const createHomeSlide = (payload) =>
    authRequest('/home-slides', {
        method: 'POST',
        body: payload,
    });

export const updateHomeSlide = (id, payload) =>
    authRequest(`/home-slides/${id}`, {
        method: 'PUT',
        body: payload,
    });

export const deleteHomeSlide = (id) =>
    authRequest(`/home-slides/${id}`, {
        method: 'DELETE',
    });

export const updateHomeSlideStatus = (id, status) =>
    authRequest(`/home-slides/${id}/status`, {
        method: 'PUT',
        body: { status },
    });

export const reorderHomeSlides = (slides) =>
    authRequest('/home-slides/reorder', {
        method: 'PUT',
        body: { slides },
    });
    export const getThemeTranslations = (id) => authRequest(`/themes/${id}/translations`);
export const updateThemeTranslations = (id, payload) => authRequest(`/themes/${id}/translations`, { method: 'PUT', body: payload });
export const getCountryTranslations = (id) => authRequest(`/countries/${id}/translations`);
export const updateCountryTranslations = (id, payload) => authRequest(`/countries/${id}/translations`, { method: 'PUT', body: payload });




export const getPartnerContactsAdmin = (partnerId) =>
    authRequest(`/partner-contacts/partner/${partnerId}/all`);

export const createPartnerContact = (payload) =>
    authRequest('/partner-contacts', {
        method: 'POST',
        body: payload,
    });

export const updatePartnerContact = (id, payload) =>
    authRequest(`/partner-contacts/${id}`, {
        method: 'PUT',
        body: payload,
    });

export const deletePartnerContact = (id) =>
    authRequest(`/partner-contacts/${id}`, {
        method: 'DELETE',
    });
    