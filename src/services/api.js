// Couche de services — point d'accès unique aux données.
//
// Aujourd'hui, ces fonctions lisent les données mockées statiques.
// Demain, il suffira de remplacer le corps de chaque fonction par un appel
// axios/fetch vers le backend Express + PostgreSQL, sans toucher aux
// composants qui consomment ces services.
//
// Exemple de remplacement futur :
//   const API = import.meta.env.VITE_API_URL;
//   export const getProjets = () => fetch(`${API}/projets`).then((r) => r.json());

import {
  actualites,
  appels,
  documents,
  mobilites,
  partenaires,
  projets,
} from '../data/mock.js';

// Petit utilitaire simulant la latence réseau d'une API réelle.
const simulateRequest = (data, delay = 250) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delay);
  });

const findById = (collection, id) =>
  collection.find((item) => item.id === id) ?? null;

/* ------------------------------ Projets ------------------------------ */
export const getProjets = () => simulateRequest(projets);
export const getProjetById = (id) => simulateRequest(findById(projets, id));

/* --------------------------- Appels à projets ------------------------ */
export const getAppels = () => simulateRequest(appels);
export const getAppelById = (id) => simulateRequest(findById(appels, id));

/* ----------------------------- Mobilités ----------------------------- */
export const getMobilites = () => simulateRequest(mobilites);
export const getMobiliteById = (id) => simulateRequest(findById(mobilites, id));

/* ----------------------------- Actualités ---------------------------- */
export const getActualites = () => simulateRequest(actualites);
export const getActualiteById = (id) =>
  simulateRequest(findById(actualites, id));

/* ----------------------------- Documents ----------------------------- */
export const getDocuments = () => simulateRequest(documents);

/* ---------------------------- Partenaires ---------------------------- */
export const getPartenaires = () => simulateRequest(partenaires);
export const getPartenaireById = (id) =>
  simulateRequest(findById(partenaires, id));
