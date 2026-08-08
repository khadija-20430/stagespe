// Couche de services — point d'accès unique aux données.
//
// Remplace les données mockées par de vrais appels au backend
// Express + PostgreSQL. La signature de chaque fonction (nom, paramètres,
// forme du retour) reste identique à l'ancien mock.js : les composants
// qui consomment ces services n'ont RIEN à changer.

import {
  mapPartner,
  mapProjet,
  mapAppel,
  mapMobilite,
  mapActualite,
  mapDocument,
  mapStats,
} from './mappers.js';

const API = import.meta.env.VITE_API_URL;

/**
 * Petit wrapper fetch : gère les erreurs HTTP et le parsing JSON.
 * @param {string} path - chemin relatif à API (ex: '/partners')
 */
const request = async (path) => {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    throw new Error(`Erreur API (${res.status}) sur ${path}`);
  }
  return res.json();
};

/* -------------------------------- Projets -------------------------------- */
export const getProjets = async (lang = 'fr') => {
  const data = await request(`/projects?lang=${lang}`);
  return data.map(mapProjet);
};

export const getProjetById = async (id, lang = 'fr') => {
  const data = await request(`/projects/${id}?lang=${lang}`);
  return mapProjet(data);
};

/* --------------------------- Appels à projets ----------------------------- */
export const getAppels = async (lang = 'fr') => {
  const data = await request(`/calls?lang=${lang}`);
  return data.map(mapAppel);
};

export const getAppelById = async (id, lang = 'fr') => {
  const data = await request(`/calls/${id}?lang=${lang}`);
  return mapAppel(data);
};

/* ------------------------------- Mobilités -------------------------------- */
export const getMobilites = async (lang = 'fr') => {
  const data = await request(`/mobility?lang=${lang}`);
  return data.map(mapMobilite);
};

export const getMobiliteById = async (id, lang = 'fr') => {
  const data = await request(`/mobility/${id}?lang=${lang}`);
  return mapMobilite(data);
};

/* ------------------------------- Actualités -------------------------------- */
// ⚠️ Adapter le chemin '/news-events' si votre route diffère.
export const getActualites = async () => {
  const data = await request('/news-events');
  return data.map(mapActualite);
};

export const getActualiteById = async (id) => {
  const data = await request(`/news-events/${id}`);
  return mapActualite(data);
};

/* ------------------------------- Documents --------------------------------- */
export const getDocuments = async () => {
  const data = await request('/documents');
  return data.map(mapDocument);
};

export const getDocumentById = async (id) => {
  const data = await request(`/documents/${id}`);
  return mapDocument(data);
};

/* ------------------------------ Partenaires --------------------------------- */
export const getPartenaires = async (lang = 'fr') => {
  const data = await request(`/partners?lang=${lang}`);
  return data.map(mapPartner);
};

export const getPartenaireById = async (id, lang = 'fr') => {
  const data = await request(`/partners/${id}?lang=${lang}`);
  return mapPartner(data);
};

/* ------------------------------ Statistiques --------------------------------- */
export const getStats = async () => {
  const data = await request('/stats');
  return mapStats(data);
};