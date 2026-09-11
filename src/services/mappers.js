const splitList = (value) =>
    value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

export const toISODateOrNull = (value) => {
    if (!value) return null;
    try {
        const d = new Date(value);
        const offsetMin = -d.getTimezoneOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const absMin = Math.abs(offsetMin);
        const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
        const mm = String(absMin % 60).padStart(2, '0');
        return `${value}:00${sign}${hh}:${mm}`;
    } catch {
        return value;
    }
};

// ============================================================
// PROJETS
// ============================================================

export const mapProjet = (row) => ({
    id: row.id,
    titre: row.title,
    acronyme: row.acronym,
    codeReference: row.reference_code,
    programme: row.programme_name,
    programmeId: row.programme_id,
    status: row.status,
    budget: row.budget != null ? Number(row.budget) : null,
    debut: row.start_date,
    fin: row.end_date,
    resume: row.description,
    objectifs: row.objectives,
    groupesCibles: row.target_groups,
    siteWeb: row.official_website,
    resultats: row.results,
    livrables: row.deliverables,
    coordinator_partner_id: row.coordinator_partner_id,
    coordinateurPartenaire: row.coordinator_partner_name || null,
    pays: Array.isArray(row.countries) ? row.countries : [],
    isFeatured: row.is_featured,
    statut_publication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
    news: row.news,
    documents: row.documents,
});

export const toProjetPayload = (draft) => {
    if (draft.debut && draft.fin && draft.fin < draft.debut) {
        throw new Error('La date de fin doit être postérieure ou égale à la date de début');
    }

    return {
        title: draft.titre,
        acronym: draft.acronyme,
        reference_code: draft.codeReference,
        description: draft.resume,
        objectives: draft.objectifs,
        target_groups: draft.groupesCibles,
        official_website: draft.siteWeb,
        status: draft.status || 'proposed',
        statut_publication: draft.statut_publication || 'draft',
        programme_id: draft.programmeId || null,
        coordinator_partner_id: draft.coordinator_partner_id || null,
        budget: draft.budget || null,
        start_date: draft.debut || null,
        end_date: draft.fin || null,
        is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true,
        deliverables: typeof draft.livrables === 'string' ?
            draft.livrables.split(',').map((s) => s.trim()).filter(Boolean) : draft.livrables,
        results: typeof draft.resultats === 'string' ?
            draft.resultats.split(',').map((s) => s.trim()).filter(Boolean) : draft.resultats,
        scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
    };
};

// ============================================================
// APPELS À PROJETS
// ============================================================

export const mapAppel = (row) => ({
    id: row.id,
    titre: row.title,

    programmeId: row.programme_id != null ? String(row.programme_id) : '',
    typeActionId: row.action_type_id != null ? String(row.action_type_id) : '',
    organismeFinanceur: row.funding_body || '',
    objectifs: row.objectives || '',
    eligibilite: row.eligibility || '',
    beneficiaires: row.beneficiaries || '',
    tauxFinancement: row.funding_rate != null ? Number(row.funding_rate) : '',
    publicCible: row.target_audience || '',
    datePublication: row.publication_date || '',
    lienOfficiel: row.official_link || '',
    personneContact: row.contact_person || '',

    programme: row.programme_name,
    paysEligibles: Array.isArray(row.country_names) && row.country_names.length > 0 ?
        row.country_names : splitList(row.eligibility),
    paysEligiblesIds: Array.isArray(row.country_ids)
        ? row.country_ids
        : (Array.isArray(row.countries) ? row.countries.map((c) => c.id) : []),
    status: row.status,
    dateLimite: row.deadline,
    budgetDisponible: row.budget_available != null ? Number(row.budget_available) : null,
    budgetLabel: row.budget_available != null ?
        `${Number(row.budget_available).toLocaleString('fr-FR')} €` : null,
    resume: row.description,
    lien: row.official_link || '#',
    themes: row.themes,
    themeIds: Array.isArray(row.theme_ids)
        ? row.theme_ids
        : (Array.isArray(row.themes) ? row.themes.map((t) => t.id) : []),
    themeNames: Array.isArray(row.theme_names) && row.theme_names.length > 0
        ? row.theme_names
        : (Array.isArray(row.themes) ? row.themes.map((t) => t.name) : []),
    countries: row.countries,
    documents: row.documents,
    statut_publication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
});

export const toAppelPayload = (draft) => {
    const parseIds = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) {
            return input.map((id) => parseInt(id)).filter(Boolean);
        }
        if (typeof input === 'string') {
            return input.split(',')
                .map((s) => parseInt(s.trim()))
                .filter(Boolean);
        }
        return [];
    };

    return {
        title: draft.titre,
        programme_id: draft.programmeId ? parseInt(draft.programmeId) : null,
        funding_body: draft.organismeFinanceur || null,
        description: draft.resume || null,
        objectives: draft.objectifs || null,
        eligibility: draft.eligibilite || null,
        beneficiaries: draft.beneficiaires || null,
        action_type_id: draft.typeActionId ? parseInt(draft.typeActionId) : null,
        budget_available: draft.budgetDisponible ? parseFloat(draft.budgetDisponible) : null,
        funding_rate: draft.tauxFinancement ? parseFloat(draft.tauxFinancement) : null,
        target_audience: draft.publicCible || null,
        publication_date: draft.datePublication || null,
        deadline: draft.dateLimite || null,
        official_link: draft.lienOfficiel || null,
        contact_person: draft.personneContact || null,
        statut_publication: draft.statut_publication || 'draft',
        theme_ids: parseIds(draft.themeIds),
        country_ids: parseIds(draft.paysEligiblesIds),
        scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
    };
};

// ============================================================
// MOBILITÉS
// ============================================================

export const mapMobilite = (row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    status: row.status,

    institutionId: row.institution_id || null,
    institutionName: row.institution_name || null,
    partnerId: row.destination_partner_id || null,
    partnerName: row.partner_name || null,
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
    statut_publication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
    conditions: row.conditions,
    lien: row.application_link,
    procedure: row.application_procedure,
    criteres: row.selection_criteria,
    financement: row.funding_details,
    contact: row.contact_person,
    emailContact: row.contact_email,
    languageRequirements: Array.isArray(row.language_requirements)
        ? row.language_requirements.map((r) => ({
              languageId: r.id,
              languageCode: r.code,
              languageName: r.name,
              minLevel: r.min_level,
          }))
        : [],
});

export const toMobilitePayload = (draft) => ({
    title: draft.title,
    type: draft.type,
    programme_id: draft.programmeId || null,
    destination_country_id: draft.paysDestinationId || null,
    destination_partner_id: draft.partnerId || null,
    institution_id: draft.institutionId || null,
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
    status: draft.status || 'open',
    statut_publication: draft.statutPublication || 'draft',
    scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
    language_requirements: Array.isArray(draft.languageRequirements)
        ? draft.languageRequirements.map((r) => ({ language_id: r.languageId, min_level: r.minLevel || null }))
        : [],
});

// ============================================================
// DOCUMENTS
// ============================================================

export const mapDocument = (row) => ({
    id: row.id,
    nom: row.titre || row.nom,
    titre: row.titre || row.nom,
    description: row.description || '',
    categorie: row.categorie_code || row.categorie || row.categorie_name,
    categorieLabel: row.categorie_label || row.categorie_name || row.categorie_code || row.categorie,
    categorieId: row.categorie_id,
    fileFormat: row.file_format || row.format || 'PDF',
    fileSize: row.file_size || row.taille,
    fichier: row.fichier_url || row.lien,
    fichier_url: row.fichier_url,
    lien: row.fichier_url || row.lien,
    format: row.file_format || row.format,
    taille: row.file_size || row.taille,
    langage: row.langage || 'fr',
    version: row.version || '1.0',
    statutPublication: row.statut_publication || 'draft',
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
    isFeatured: row.is_featured === true,
    dateExpiration: row.date_expiration || null,
    dateUpload: row.date_upload || row.date,
    date: row.date_upload || row.date,

    links: {
        project: Array.isArray(row.links?.project) ? row.links.project : [],
        call: Array.isArray(row.links?.call) ? row.links.call : [],
        agreement: Array.isArray(row.links?.agreement) ? row.links.agreement : [],
        mobility: Array.isArray(row.links?.mobility) ? row.links.mobility : [],
        programme: Array.isArray(row.links?.programme) ? row.links.programme : [],
    },
});

export const toDocumentPayload = (draft) => ({
    titre: draft.titre,
    description: draft.description || null,
    fichier_url: draft.fichier_url,
    change_note: draft.changeNote || null,
    categorie_id: draft.categorieId,
    langage: draft.langage || 'fr',
    version: draft.version || '1.0',
    file_size: draft.fileSize || null,
    file_format: draft.fileFormat || null,
    statut_publication: draft.statutPublication || 'draft',
    scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
    is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true || draft.isFeatured === true,
    date_expiration: draft.dateExpiration || null,

    links: {
        project: draft.projectIds || [],
        call: draft.callIds || [],
        agreement: draft.agreementIds || [],
        mobility: draft.mobilityIds || [],
        programme: draft.programmeIds || [],
    },
});

// ============================================================
// STATISTIQUES
// ============================================================

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

// ============================================================
// PARTENAIRES
// ============================================================

export const mapPartner = (row) => ({
    id: row.id,
    nom: row.name,
    nomOfficiel: row.official_name,
    pays: row.country_name,
    paysId: row.country_id,
    ville: row.city,
    adresse: row.address,

    typeEtablissement: row.establishment_type_label,
    typeEtablissementId: row.establishment_type_id,

    typePartenariatId: row.partnership_type_id,
    typePartenariat: row.partnership_type_label,

    partnershipStatus: row.partnership_status,

    themeIds: Array.isArray(row.theme_ids) ?
        row.theme_ids : (Array.isArray(row.themes) ? row.themes.map((th) => th.id) : []),
    themeNames: Array.isArray(row.theme_names) ?
        row.theme_names : (Array.isArray(row.themes) ? row.themes.map((th) => th.name) : []),

    domaines: splitList(row.cooperation_areas),

    accord: row.agreements?.[0] ? {
            titre: row.agreements[0].title,
            type: row.agreements[0].type,
            depuis: row.agreements[0].start_date ?
                new Date(row.agreements[0].start_date).getFullYear() : null,
        } :
        undefined,

    logo: row.logo_url,
    site: row.website,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    statut_publication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,
    agreements: row.agreements,
    contacts: row.contacts,
    projects: row.projects,
});

export const toPartnerPayload = (draft) => ({
    name: draft.nom,
    official_name: draft.nomOfficiel,
    country_id: draft.paysId || null,
    city: draft.ville,
    address: draft.adresse,
    establishment_type_id: draft.typeEtablissementId || null,
    partnership_type_id: draft.typePartenariatId || null,
    partnership_status: draft.statutPartenariat || 'active',
    website: draft.siteWeb,
    theme_ids: Array.isArray(draft.themeIds) ? draft.themeIds.map(Number) : [],
    cooperation_areas: Array.isArray(draft.domaines) ? draft.domaines.join(', ') : draft.domaines,
    description: draft.description,
    logo_url: draft.logo,
    latitude: draft.latitude || null,
    longitude: draft.longitude || null,
    scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),
});

export const mapPublicContact = (c) => ({
    id: c.id,
    fullName: c.full_name,
    position: c.position,
    email: c.email,
    phone: c.phone,
    isPrimary: c.is_primary,
});

export const mapPartnerDetail = (p) => ({
    ...mapPartner(p),
    contacts: (p.contacts ?? []).map(mapPublicContact),
});

// ============================================================
// ACTUALITÉS / ÉVÉNEMENTS
// ============================================================

export const mapActualite = (row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    summary: row.summary,
    description: row.description,
    projectId: row.project_id,
    eventDate: row.event_date,
    endDate: row.end_date,
    location: row.location,
    imageUrl: row.image_url,
    isFeatured: row.is_featured,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorPhotoUrl: row.author_photo_url,
    quoteText: row.quote_text,
    statut_publication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const toActualitePayload = (data) => ({
    title: data.title,
    type: data.type,
    summary: data.summary || null,
    description: data.description || null,
    project_id: data.projectId || null,
    event_date: data.eventDate || null,
    end_date: data.endDate || null,
    location: data.location || null,
    image_url: data.imageUrl || null,
    is_featured: data.isFeatured === 'true' || data.isFeatured === true,
    author_name: data.authorName || null,
    author_role: data.authorRole || null,
    author_photo_url: data.authorPhotoUrl || null,
    quote_text: data.quoteText || null,
    statut_publication: data.statut_publication || 'draft',
    scheduled_publish_at: toISODateOrNull(data.scheduledPublishAt),  // ← AJOUT
});

// ============================================================
// UTILISATEURS
// ============================================================

export const PLAIN_USER_ROLE_ID = '__utilisateur__';

export const mapUser = (row) => ({
    id: row.id,
    nom: row.full_name,
    email: row.email,
    role: row.role,
    roleId: row.role_id,
    roleName: row.role_name,
    roleSelectValue: row.role === 'admin' && row.role_id ?
        row.role_id : PLAIN_USER_ROLE_ID,
    isActive: row.is_active,
    lastLogin: row.last_login,
    createdAt: row.created_at,
});

export const toUserPayload = (draft) => {
    const isPlainUser = !draft.roleSelectValue ||
        draft.roleSelectValue === PLAIN_USER_ROLE_ID;

    return {
        full_name: draft.nom,
        email: draft.email,
        role: isPlainUser ? 'utilisateur' : 'admin',
        role_id: isPlainUser ? null : draft.roleSelectValue,
        is_active: draft.isActive === 'true' || draft.isActive === true,
        password: draft.password || undefined,
    };
};

// ============================================================
// ACCORDS / AGREEMENTS
// ============================================================

export const mapAgreement = (row) => ({
    id: row.id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    partnerCountry: row.partner_country || null,
    titre: row.title,
    type: row.type,
    description: row.description,
    termes: row.terms_conditions,
    fichierPdf: row.fichier_pdf,
    dateSignature: row.signature_date,
    dateDebut: row.start_date,
    dateFin: row.end_date,
    statut: row.status,
    statutPublication: row.statut_publication,
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
    creeePar: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documents: row.documents || [],
    daysRemaining: row.days_remaining,
    urgencyLevel: row.urgency_level,
    alertMessage: row.alert_message,
});

export const toAgreementPayload = (draft) => ({
    partner_id: draft.partnerId,
    title: draft.titre,
    type: draft.type || null,
    description: draft.description || null,
    terms_conditions: draft.termes || null,
    fichier_pdf: draft.fichierPdf || null,
    signature_date: draft.dateSignature || null,
    start_date: draft.dateDebut || null,
    end_date: draft.dateFin || null,
    status: draft.statut || 'active',
    statut_publication: draft.statutPublication || 'draft',
    scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
});

// ============================================================
// SCHOOL PRESENTATION
// ============================================================

export const mapSchoolPresentation = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        schoolPresentationId: row.school_presentation_id,
        langCode: row.language_code || row.lang_code,
        languageId: row.language_id,
        titre: row.titre,
        description: row.description,
        fichierUrl: row.fichier_url,
        fileFormat: row.file_format,
        fileSize: row.file_size,
        visibilite: row.visibilite,
        statutPublication: row.statut_publication,
        createdAt: row.created_at || row.presentation_created_at,
        updatedAt: row.updated_at,
        revisions: row.revisions || [],
    };
};

// ============================================================
// PROGRAMMES
// ============================================================

export const mapProgramme = (row) => ({
    id: row.id,
    name: row.name,
    nom: row.name,
    acronym: row.acronym || '',
    organismeFinanceur: row.organisme_financeur || '',
    description: row.description || '',
    siteWeb: row.official_website || '',
    logo: row.logo_url || null,
    documentsCount: Number(row.documents_count) || 0,
    statut_publication: row.statut_publication || 'draft',
    scheduledPublishAt: row.scheduled_publish_at,  // ← AJOUT
});

export const toProgrammePayload = (draft) => ({
    name: draft.name || draft.nom,
    acronym: draft.acronym || null,
    organisme_financeur: draft.organismeFinanceur || null,
    description: draft.description || null,
    official_website: draft.siteWeb || null,
    scheduled_publish_at: toISODateOrNull(draft.scheduledPublishAt),  // ← AJOUT
});

// ============================================================
// INSTITUTIONS
// ============================================================

export const mapInstitution = (row) => ({
    id: row.id,
    nom: row.name,
    villeId: row.city_id,
    ville: row.city_name,
    pays: row.country_name,
    partnerId: row.partner_id,
    partnerName: row.partner_name || null,
});

export const toInstitutionPayload = (draft) => ({
    name: draft.nom,
    city_id: draft.villeId || null,
    partner_id: draft.partnerId || null,
});