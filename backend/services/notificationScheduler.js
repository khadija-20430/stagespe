const pool = require('../db');
const notificationsModel = require('../models/notificationsModel');

// ============================================================
// JOB : VÉRIFIER LES ALERTES ET CRÉER DES NOTIFICATIONS
// ============================================================

async function runNotificationChecks() {
    console.log('[NOTIFICATIONS] Exécution des vérifications...');

    try {
        let notificationsCreated = 0;

        // 1️⃣ Conventions bientôt expirées (60 jours) — visible par agreements.view
        const agreementViewers = await notificationsModel.getUsersWithPermission('agreements.view');
        const agreementViewerIds = agreementViewers.map(u => u.id);

        if (agreementViewerIds.length > 0) {
            const expiringAgreements = await pool.query(`
                SELECT a.*, p.name AS partner_name
                FROM agreements a
                JOIN partners p ON a.partner_id = p.id
                WHERE a.status = 'active'
                  AND a.end_date IS NOT NULL
                  AND a.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
                ORDER BY a.end_date ASC
            `);

            for (const agreement of expiringAgreements.rows) {
                const daysLeft = Math.ceil((new Date(agreement.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                const title = `Convention bientôt expirée`;
                const message = `La convention "${agreement.title}" avec ${agreement.partner_name} expire dans ${daysLeft} jours.`;

                const existing = await pool.query(
                    `SELECT id FROM notifications 
                     WHERE user_id = ANY($1) 
                     AND title = $2 
                     AND message LIKE $3
                     AND created_at > NOW() - INTERVAL '1 hour'`, [agreementViewerIds, title, `%${agreement.title}%`]
                );

                if (existing.rows.length === 0) {
                    await notificationsModel.createForUsers(agreementViewerIds, title, message, 'warning');
                    notificationsCreated++;
                }
            }
        }

        // 2️⃣ Appels bientôt clos (15 jours) — visible par calls.view
        const callViewers = await notificationsModel.getUsersWithPermission('calls.view');
        const callViewerIds = callViewers.map(u => u.id);

        if (callViewerIds.length > 0) {
            const closingCalls = await pool.query(`
                SELECT * FROM calls
                WHERE status = 'open'
                  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '15 days'
                ORDER BY deadline ASC
            `);

            for (const call of closingCalls.rows) {
                const daysLeft = Math.ceil((new Date(call.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                const title = `Appel à projets bientôt clos`;
                const message = `L'appel à projets "${call.title}" se clôture dans ${daysLeft} jours.`;

                const existing = await pool.query(
                    `SELECT id FROM notifications 
                     WHERE user_id = ANY($1) 
                     AND title = $2 
                     AND message LIKE $3
                     AND created_at > NOW() - INTERVAL '1 hour'`, [callViewerIds, title, `%${call.title}%`]
                );

                if (existing.rows.length === 0) {
                    await notificationsModel.createForUsers(callViewerIds, title, message, 'warning');
                    notificationsCreated++;
                }
            }
        }

        // 3️⃣ Documents expirés — visible par documents.view
        const documentViewers = await notificationsModel.getUsersWithPermission('documents.view');
        const documentViewerIds = documentViewers.map(u => u.id);

        if (documentViewerIds.length > 0) {
            const expiredDocs = await pool.query(`
                SELECT * FROM documents
                WHERE date_expiration IS NOT NULL 
                  AND date_expiration < CURRENT_DATE
                  AND statut_publication != 'archived'
            `);

            for (const doc of expiredDocs.rows) {
                const title = `Document expiré`;
                const message = `Le document "${doc.titre}" a expiré le ${new Date(doc.date_expiration).toLocaleDateString('fr-FR')}.`;

                const existing = await pool.query(
                    `SELECT id FROM notifications 
                     WHERE user_id = ANY($1) 
                     AND title = $2 
                     AND message LIKE $3
                     AND created_at > NOW() - INTERVAL '1 hour'`, [documentViewerIds, title, `%${doc.titre}%`]
                );

                if (existing.rows.length === 0) {
                    await notificationsModel.createForUsers(documentViewerIds, title, message, 'error');
                    notificationsCreated++;
                }
            }
        }

        // 4️⃣ Brouillons oubliés (30+ jours) — projets/appels/partenaires,
        //     chaque type notifie ses propres viewers (projects.view / calls.view / partners.view)
        const projectViewers = await notificationsModel.getUsersWithPermission('projects.view');
        const partnerViewers = await notificationsModel.getUsersWithPermission('partners.view');

        const viewersByType = {
            projet: projectViewers.map(u => u.id),
            appel: callViewerIds,
            partenaire: partnerViewers.map(u => u.id)
        };

        const staleDrafts = await pool.query(`
            (SELECT 'projet' as type, id, title, created_at FROM projects WHERE statut_publication = 'draft' AND created_at < NOW() - INTERVAL '30 days')
            UNION ALL
            (SELECT 'appel' as type, id, title, created_at FROM calls WHERE statut_publication = 'draft' AND created_at < NOW() - INTERVAL '30 days')
            UNION ALL
            (SELECT 'partenaire' as type, id, name as title, created_at FROM partners WHERE statut_publication = 'draft' AND created_at < NOW() - INTERVAL '30 days')
        `);

        for (const draft of staleDrafts.rows) {
            const recipientIds = viewersByType[draft.type] || [];
            if (recipientIds.length === 0) continue;

            const typeLabel = { projet: 'Projet', appel: "Appel à projets", partenaire: 'Partenaire' }[draft.type] || draft.type;
            const title = `Brouillon ancien (${typeLabel})`;
            const message = `Le ${typeLabel.toLowerCase()} "${draft.title}" est en brouillon depuis plus de 30 jours (${new Date(draft.created_at).toLocaleDateString('fr-FR')}).`;

            const existing = await pool.query(
                `SELECT id FROM notifications 
                 WHERE user_id = ANY($1) 
                 AND title = $2 
                 AND message LIKE $3
                 AND created_at > NOW() - INTERVAL '3 days'`, [recipientIds, title, `%${draft.title}%`]
            );

            if (existing.rows.length === 0) {
                await notificationsModel.createForUsers(recipientIds, title, message, 'info');
                notificationsCreated++;
            }
        }

        // 5️⃣ Mobilités bientôt clôturées — visible par mobility.view
        const mobilityViewers = await notificationsModel.getUsersWithPermission('mobility.view');
        const mobilityViewerIds = mobilityViewers.map(u => u.id);

        if (mobilityViewerIds.length > 0) {
            const expiringMobility = await pool.query(`
                SELECT * FROM mobility
                WHERE status = 'open'
                  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '15 days'
                ORDER BY deadline ASC
            `);

            for (const mobility of expiringMobility.rows) {
                const daysLeft = Math.ceil((new Date(mobility.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                const title = `Mobilité bientôt clôturée`;
                const message = `La mobilité "${mobility.title}" se clôture dans ${daysLeft} jours.`;

                const existing = await pool.query(
                    `SELECT id FROM notifications 
                     WHERE user_id = ANY($1) 
                     AND title = $2 
                     AND message LIKE $3
                     AND created_at > NOW() - INTERVAL '1 hour'`, [mobilityViewerIds, title, `%${mobility.title}%`]
                );

                if (existing.rows.length === 0) {
                    await notificationsModel.createForUsers(mobilityViewerIds, title, message, 'warning');
                    notificationsCreated++;
                }
            }
        }

        console.log(`[NOTIFICATIONS] ${notificationsCreated} nouvelles notifications créées.`);

    } catch (error) {
        console.error('[NOTIFICATIONS] Erreur:', error);
    }
}

// ============================================================
// NETTOYER LES NOTIFICATIONS ANCIENNES (15+ jours)
// ============================================================

async function cleanupOldNotifications() {
    try {
        const deleted = await notificationsModel.deleteOldNotifications(15);
        if (deleted.length > 0) {
            console.log(`[NOTIFICATIONS] ${deleted.length} notifications anciennes supprimées.`);
        }
    } catch (error) {
        console.error('[NOTIFICATIONS] Erreur nettoyage:', error);
    }
}

// ============================================================
// EXÉCUTER TOUS LES JOBS
// ============================================================

async function runAllJobs() {
    await runNotificationChecks();
    await cleanupOldNotifications();
}

module.exports = {
    runNotificationChecks,
    cleanupOldNotifications,
    runAllJobs
};