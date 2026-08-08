// Mapping entre les champs renvoyés par le backend (Express + PostgreSQL)
// et le format attendu par les composants (identique à l'ancien mock.js).
// Objectif : ne JAMAIS toucher aux composants, seulement à cette couche.

const splitList = (value) =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

/* ---------------------------- Partenaires ----------------------------- */
export const mapPartner = (row) => ({
  id: row.id,
  nom: row.name,
  nomOfficiel: row.official_name,
  pays: row.country_name,
  ville: row.city,
  type: row.establishment_type,
  typeEtablissement: row.establishment_type,
  partnershipStatus: row.partnership_status,
  domaines: splitList(row.cooperation_areas),
  accord: row.agreements?.[0]
    ? {
        titre: row.agreements[0].title,
        type: row.agreements[0].type,
        depuis: row.agreements[0].start_date
          ? new Date(row.agreements[0].start_date).getFullYear()
          : null,
      }
    : undefined,
  logo: row.logo_url,
  site: row.website,
  statutPublication: row.statut_publication,
  // Uniquement présents sur GET /partners/:id (détail)
  agreements: row.agreements,
  contacts: row.contacts,
  projects: row.projects,
});

/* ------------------------------- Projets ------------------------------- */
export const mapProjet = (row) => ({
  id: row.id,
  titre: row.title,
  programme: row.programme_name,
  statut: row.status,
  partenaires: row.partners
    ? row.partners.map((p) => p.partner_name)
    : row.coordinator_partner_name
      ? [row.coordinator_partner_name]
      : [],
  budget: row.budget != null ? Number(row.budget) : null,
  debut: row.start_date,
  fin: row.end_date,
  resume: row.description,
  coordinateur: row.coordinator_partner_name,
  isFeatured: row.is_featured,
  statutPublication: row.statut_publication,
  // Uniquement présents sur GET /projects/:id (détail)
  news: row.news,
  documents: row.documents,
});

/* -------------------------------- Appels -------------------------------- */
export const mapAppel = (row) => ({
  id: row.id,
  titre: row.title,
  programme: row.programme_name,
  // Sur la liste (GET /calls), pas de JOIN countries -> on découpe le texte libre.
  // Sur le détail (GET /calls/:id), row.countries est un vrai tableau d'objets -> on préfère ça.
  paysEligibles: row.countries?.length
    ? row.countries.map((c) => c.name)
    : splitList(row.eligible_countries),
  statut: row.status,
  dateLimite: row.deadline,
  budgetDisponible: row.budget_available != null ? Number(row.budget_available) : null,
  budgetLabel:
    row.budget_available != null
      ? `${Number(row.budget_available).toLocaleString('fr-FR')} €`
      : null,
  resume: row.description,
  lien: row.official_link || '#',
  // Uniquement présents sur GET /calls/:id (détail)
  themes: row.themes,
  countries: row.countries,
  documents: row.documents,
});

/* ------------------------------ Mobilités -------------------------------- */
export const mapMobilite = (row) => ({
  id: row.id,
  type: row.type,
  institutionAccueil: row.partner_name || row.host_institution,
  paysDestination: row.country_name,
  villeAccueil: row.host_city,
  duree: row.duration,
  niveau: row.target_audience,
  publicCible: row.target_audience,
  places: row.places_count,
  programme: row.programme_name,
  description: row.description,
  dateLimite: row.deadline,
  statut: row.status,
});

/* ----------------------------- Actualités -------------------------------- */
// Adapter les noms de champs si votre route news_events diffère (JOIN éventuel).
export const mapActualite = (row) => ({
  id: row.id,
  titre: row.title,
  type: row.type,
  eventDate: row.event_date,
  imageUrl: row.image_url,
  resume: row.summary,
  contenu: row.description,
  isFeatured: row.is_featured,
  auteur: row.author_name
    ? { nom: row.author_name, role: row.author_role, photo: row.author_photo_url }
    : undefined,
  citation: row.quote_text,
});

/* ----------------------------- Documents --------------------------------- */
export const mapDocument = (row) => ({
  id: row.id,
  nom: row.titre,
  categorie: row.categorie_code,
  categorieLabel: row.categorie_label,
  format: row.file_format,
  taille: row.file_size ? `${(row.file_size / 1024).toFixed(0)} Ko` : null,
  date: row.date_upload,
  lien: row.fichier_url,
});

/* ----------------------------- Statistiques ------------------------------- */
export const mapStats = (row) => ({
  partners: Number(row.total_active_partners) || 0,
  countries: Number(row.total_countries) || 0,
  projects:
    (Number(row.ongoing_projects) || 0) +
    (Number(row.proposed_projects) || 0) +
    (Number(row.completed_projects) || 0),
  ongoingProjects: Number(row.ongoing_projects) || 0,
  openCalls: Number(row.open_calls) || 0,
  closingSoonCalls: Number(row.closing_soon_calls) || 0,
  openMobility: Number(row.open_mobility) || 0,
  totalDocuments: Number(row.total_documents) || 0,
  publishedNews: Number(row.published_news) || 0,
  activeAgreements: Number(row.active_agreements) || 0,
  expiredAgreements: Number(row.expired_agreements) || 0,
  expiringSoon: Number(row.expiring_soon) || 0,
});