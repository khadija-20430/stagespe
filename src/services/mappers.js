const splitList = (value) =>
    value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

export const mapPartner = (row) => ({
    id: row.id,
    nom: row.name,
    nomOfficiel: row.official_name,
    pays: row.country_name,
    ville: row.city,
    adresse: row.address,
    type: row.establishment_type,
    typeEtablissement: row.establishment_type,
    partnershipStatus: row.partnership_status,
    domaines: splitList(row.cooperation_areas),
    accord: row.agreements?.[0] ? {
            titre: row.agreements[0].title,
            type: row.agreements[0].type,
            depuis: row.agreements[0].start_date ?
                new Date(row.agreements[0].start_date).getFullYear() : null,
        } : undefined,
    logo: row.logo_url,
    site: row.website,
    statutPublication: row.statut_publication,
    agreements: row.agreements,
    contacts: row.contacts,
    projects: row.projects,
});

export const mapProjet = (row) => ({
    id: row.id,
    titre: row.title,
    programme: row.programme_name,
    statut: row.status,
    partenaires: row.partners ?
        row.partners.map((p) => p.partner_name) : row.coordinator_partner_name ? [row.coordinator_partner_name] : [],
    budget: row.budget != null ? Number(row.budget) : null,
    debut: row.start_date,
    fin: row.end_date,
    resume: row.description,
    coordinateur: row.coordinator_partner_name,
    isFeatured: row.is_featured,
    statutPublication: row.statut_publication,
    news: row.news,
    documents: row.documents,
});

export const mapAppel = (row) => ({
    id: row.id,
    titre: row.title,
    programme: row.programme_name,
    paysEligibles: row.countries?.length
        ? row.countries.map((c) => c.name)
        : splitList(row.eligible_countries),
    statut: row.status,
    dateLimite: row.deadline,
    budgetDisponible: row.budget_available != null ? Number(row.budget_available) : null,
    budgetLabel: row.budget_available != null ?
        `${Number(row.budget_available).toLocaleString('fr-FR')} €` : null,
    resume: row.description,
    lien: row.official_link || '#',
    themes: row.themes,
    countries: row.countries,
    documents: row.documents,
});

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
    isFeatured: row.is_featured === true,
    dateExpiration: row.date_expiration || null,
    dateUpload: row.date_upload || row.date,
    date: row.date_upload || row.date,
});

export const toDocumentPayload = (draft) => ({
    titre: draft.titre,
    description: draft.description || null,
    fichier_url: draft.fichier_url,
    categorie_id: draft.categorieId || null,
    langage: draft.langage || 'fr',
    version: draft.version || '1.0',
    file_size: draft.fileSize || null,
    file_format: draft.fileFormat || null,
    statut_publication: draft.statutPublication || 'draft',
    is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true || draft.isFeatured === true,
    date_expiration: draft.dateExpiration || null,
});

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
    status: 'proposed',
    statut_publication: draft.statutPublication || 'draft',
    programme_id: draft.programmeId || null,
    coordinator_partner_id: draft.coordinateurPartenaireId || null,
    budget: draft.budget || null,
    start_date: draft.debut || null,
    end_date: draft.fin || null,
    is_featured: draft.misEnAvant === 'true' || draft.misEnAvant === true,
    deliverables: typeof draft.livrables === 'string' ?
        draft.livrables.split(',').map((s) => s.trim()).filter(Boolean) : draft.livrables,
    results: typeof draft.resultats === 'string' ?
        draft.resultats.split(',').map((s) => s.trim()).filter(Boolean) : draft.resultats,
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
    status: 'open',
    statut_publication: draft.statutPublication || 'draft',
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
    status: 'open',
    statut_publication: draft.statutPublication || 'draft',
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
    auteur: row.author_name ? {
        nom: row.author_name,
        role: row.author_role,
        photo: row.author_photo_url,
    } : undefined,
    citation: row.quote_text,
    statut: row.statut,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const toActualitePayload = (data) => {
    return {
        titre: data.title,
        type: data.type,
        resume: data.summary || '',
        contenu: data.description || '',
        projetId: data.projectId || null,
        dateEvenement: data.eventDate || null,
        dateFin: data.endDate || null,
        lieu: data.location || '',
        imageUrl: data.imageUrl || '',
        misEnAvant: data.isFeatured === 'true' || data.isFeatured === true,
        nomAuteur: data.authorName || '',
        roleAuteur: data.authorRole || '',
        urlPhotoAuteur: data.authorPhotoUrl || '',
        texteDeposition: data.quoteText || '',
        statut_publication: data.statut_publication || 'draft',
    };
};