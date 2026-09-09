const db = require('../db'); 

exports.findBasic = async () => {
    const [partners, projects, programmes, mobility, countries] = await Promise.all([
        // Nombre de partenaires 
        db.query(`SELECT COUNT(*) FROM partners`), 
        // Nombre de projets
        db.query(`SELECT COUNT(*) FROM projects`),
        //  Compter les programmes publies
        db.query(`SELECT COUNT(*) FROM programmes WHERE statut_publication = 'published'`),
        // Compter les mobilites ouvertes
        db.query(`SELECT COUNT(*) FROM mobility WHERE status = 'open'`),
        // Compter les pays partenaires distincts
        db.query(`SELECT COUNT(DISTINCT country_id) FROM partners`)
    ]);

    return {
        partners: parseInt(partners.rows[0].count) || 0,
        projects: parseInt(projects.rows[0].count) || 0,
        programmes: parseInt(programmes.rows[0].count) || 0, 
        openMobility: parseInt(mobility.rows[0].count) || 0, 
        countries: parseInt(countries.rows[0].count) || 0,
    };
};

exports.findFull = async () => {
    const [partners, projects, ongoingProjects, proposedProjects, completedProjects, openCalls, closingSoonCalls, openMobility, totalDocuments, publishedNews, activeAgreements, expiredAgreements, expiringSoon, countries, programmes] = await Promise.all([
        db.query(`SELECT COUNT(*) FROM partners`),
        db.query(`SELECT COUNT(*) FROM projects`),
        db.query(`SELECT COUNT(*) FROM projects WHERE status = 'ongoing'`),
        db.query(`SELECT COUNT(*) FROM projects WHERE status = 'proposed'`),
        db.query(`SELECT COUNT(*) FROM projects WHERE status = 'completed'`),
        db.query(`SELECT COUNT(*) FROM calls WHERE status = 'open'`),
        db.query(`SELECT COUNT(*) FROM calls WHERE status = 'open' AND deadline < NOW() + INTERVAL '30 days'`),
        db.query(`SELECT COUNT(*) FROM mobility WHERE status = 'open'`),
        db.query(`SELECT COUNT(*) FROM documents`),
        db.query(`SELECT COUNT(*) FROM news_events WHERE type = 'news' AND statut_publication = 'published'`),
        db.query(`SELECT COUNT(*) FROM agreements WHERE status = 'active'`),
        db.query(`SELECT COUNT(*) FROM agreements WHERE status = 'expired'`),
        db.query(`SELECT COUNT(*) FROM agreements WHERE status = 'active' AND end_date < NOW() + INTERVAL '60 days'`),
        db.query(`SELECT COUNT(DISTINCT country_id) FROM partners`),
        // Compter les programmes publies pour le dashboard
        db.query(`SELECT COUNT(*) FROM programmes WHERE statut_publication = 'published'`)
    ]);

    return {
        total_active_partners: parseInt(partners.rows[0].count) || 0,
        total_countries: parseInt(countries.rows[0].count) || 0,
        ongoing_projects: parseInt(ongoingProjects.rows[0].count) || 0,
        proposed_projects: parseInt(proposedProjects.rows[0].count) || 0,
        completed_projects: parseInt(completedProjects.rows[0].count) || 0,
        open_calls: parseInt(openCalls.rows[0].count) || 0,
        closing_soon_calls: parseInt(closingSoonCalls.rows[0].count) || 0,
        open_mobility: parseInt(openMobility.rows[0].count) || 0,
        total_documents: parseInt(totalDocuments.rows[0].count) || 0,
        published_news: parseInt(publishedNews.rows[0].count) || 0,
        active_agreements: parseInt(activeAgreements.rows[0].count) || 0,
        expired_agreements: parseInt(expiredAgreements.rows[0].count) || 0,
        expiring_soon: parseInt(expiringSoon.rows[0].count) || 0,
        programmes: parseInt(programmes.rows[0].count) || 0,
    };
};