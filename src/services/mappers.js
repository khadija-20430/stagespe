

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
  institutionAccueil: row.institution_name || row.partner_name,
  paysDestination: row.country_name,
  villeAccueil: row.city_name,
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


/* ----------------------------- Documents --------------------------------- */
// mappers.js
export const mapDocument = (row) => ({
  id: row.id,
  nom: row.titre || row.nom,
  titre: row.titre || row.nom,
  categorie: row.categorie_code || row.categorie,
  fileFormat: row.file_format || row.format || 'PDF',
  fileSize: row.file_size || row.taille,
  dateUpload: row.date_upload || row.date,
  fichier: row.fichier_url || row.lien,  // ✅ Important pour le téléchargement
  lien: row.fichier_url || row.lien,
  fichier_url: row.fichier_url,
  date: row.date_upload || row.date,
  format: row.file_format || row.format,
  taille: row.file_size || row.taille,
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
/* ----------------------- Formulaire → payload SQL ----------------------- */
export const toPartnerPayload = (draft) => ({
  name: draft.nom,
  official_name: draft.nomOfficiel,
  country_id: draft.paysId || null,
  city: draft.ville,
  establishment_type_id: draft.typeEtablissementId || null,
  partnership_type_id: draft.typePartenariatId || null,
  partnership_status: draft.statutPartenariat || 'active',
  website: draft.siteWeb,
  cooperation_areas: Array.isArray(draft.domaines) ? draft.domaines.join(', ') : draft.domaines,
  description: draft.description,
  logo_url: draft.logo,
  latitude: draft.latitude || null,
  longitude: draft.longitude || null,
});

export const toProjetPayload = (draft) => ({
  title: draft.titre,
  acronym: draft.acronyme,
  reference_code: draft.codeReference,
  description: draft.resume,
  objectives: draft.objectifs,
  target_groups: draft.groupesCibles,
  official_website: draft.siteWeb,
  status: draft.statut || 'proposed',
  programme_id: draft.programmeId || null,
  coordinator_partner_id: draft.coordinateurPartenaireId || null,
  budget: draft.budget || null,
  start_date: draft.debut || null,
  end_date: draft.fin || null,
  is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true,
  deliverables: typeof draft.livrables === 'string'
    ? draft.livrables.split(',').map((s) => s.trim()).filter(Boolean)
    : draft.livrables,
  results: typeof draft.resultats === 'string'
    ? draft.resultats.split(',').map((s) => s.trim()).filter(Boolean)
    : draft.resultats,
});

export const toAppelPayload = (draft) => ({
  title: draft.titre,
  programme_id: draft.programmeId || null,
  funding_body: draft.organismeFinanceur,
  description: draft.resume,
  action_type_id: draft.typeActionId || null,
  budget_available: draft.budgetDisponible || null,
  funding_rate: draft.tauxFinancement || null,
  target_audience: draft.publicCible,
  publication_date: draft.datePublication || null,
  deadline: draft.dateLimite || null,
  official_link: draft.lienOfficiel,
  contact_person: draft.personneContact,
  status: draft.statut || 'open',
  country_ids: draft.paysEligiblesIds || [],
  theme_ids: draft.themeIds || [],
});

export const toMobilitePayload = (draft) => ({
  title: draft.titre,
  type: draft.type,
  programme_id: draft.programmeId || null,
  destination_country_id: draft.paysDestinationId || null,
  destination_partner_id: draft.institutionAccueilId || null,
  target_audience: draft.publicCible,
  description: draft.description,
  conditions: draft.conditions,
  places_count: draft.places || null,
  duration: draft.duree,
  period: draft.periode,
  funding_details: draft.financement,
  application_link: draft.lienCandidature,
  contact_person: draft.personneContact,
  contact_email: draft.emailContact,
  deadline: draft.dateLimite || null,
  status: draft.statut || 'open',
});

export const toDocumentPayload = (draft) => ({
  titre: draft.titre,
  description: draft.description,
  fichier_url: draft.fichier_url,
  categorie_id: draft.categorieId || null,
  langage: draft.langage || 'fr',
  version: draft.version || '1.0',
  file_size: draft.fileSize || null,
  file_format: draft.fileFormat || null,
  visibilite: draft.visibilite || 'public',
  is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true,
  date_expiration: draft.dateExpiration || null,
});
export const mapActualite = (row) => ({
  id: row.id,
  titre: row.title,
  type: row.type,
  resume: row.summary,
  contenu: row.description,

  projectId: row.project_id,

  eventDate: row.event_date,
  endDate: row.end_date,
  location: row.location,

  imageUrl: row.image_url,

  isFeatured: row.is_featured,

  auteur: row.author_name
    ? {
        nom: row.author_name,
        role: row.author_role,
        photo: row.author_photo_url,
      }
    : undefined,

  citation: row.quote_text,

  statut: row.statut,
  publishedAt: row.published_at,

  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
export const toActualitePayload = (draft) => ({
  title: draft.titre,
  type: draft.type || 'news',
  summary: draft.resume,
  description: draft.contenu,

  project_id: draft.projectId || null,

  event_date: draft.eventDate || null,
  end_date: draft.endDate || null,
  location: draft.location,

  image_url: draft.imageUrl,

  is_featured:
    draft.isFeatured === 'true' ||
    draft.isFeatured === true,

  author_name: draft.authorName,
  author_role: draft.authorRole,
  author_photo_url: draft.authorPhotoUrl,

  quote_text: draft.quoteText,

  // Ne pas permettre au formulaire de modifier le statut.
  // Il sera géré par Publier / Archiver.
});