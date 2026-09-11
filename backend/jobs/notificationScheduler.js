const pool = require('../db');
const notificationsModel = require('../models/notificationsModel');


async function processMilestones({
    entityType,       // agreement, call, mobilility...
    query,            
    viewerIds,
    soonDaysBefore,   
    buildSoonMessage,
    buildExpiredMessage
}) {
    if (viewerIds.length === 0) return 0;

    let count = 0;
    const result = await pool.query(query);

    for (const row of result.rows) {
        const refDate = new Date(row.ref_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        refDate.setHours(0, 0, 0, 0);

        const daysLeft = Math.round((refDate - today) / (1000 * 60 * 60 * 24));

        // Jalon (expire bientot) des qu on est a J-5 ou moins
        if (daysLeft >= 0 && daysLeft <= soonDaysBefore) {
            const already = await notificationsModel.wasMilestoneSent(entityType, row.id, 'soon');
            if (!already) {
                const { title, message } = buildSoonMessage(row, daysLeft);
                await notificationsModel.createForUsers(viewerIds, title, message, 'warning');
                await notificationsModel.markMilestoneSent(entityType, row.id, 'soon');
                count++;
            }
        }

        // Jalon (expiré) des que la date est depassée
        if (daysLeft < 0) {
            const already = await notificationsModel.wasMilestoneSent(entityType, row.id, 'expired');
            if (!already) {
                const { title, message } = buildExpiredMessage(row);
                await notificationsModel.createForUsers(viewerIds, title, message, 'error');
                await notificationsModel.markMilestoneSent(entityType, row.id, 'expired');
                count++;
            }
        }
    }

    return count;
}


async function runNotificationChecks() {
    console.log('[NOTIFICATIONS] Exécution des vérifications...');
    try {
        let notificationsCreated = 0;

        // Conventions
        const agreementViewers = await notificationsModel.getUsersWithPermission('agreements.view');
        notificationsCreated += await processMilestones({
            entityType: 'agreement',
            viewerIds: agreementViewers.map(u => u.id),
            soonDaysBefore: 5,
            query: `
                SELECT a.id, a.title, a.end_date AS ref_date, p.name AS partner_name
                FROM agreements a
                JOIN partners p ON a.partner_id = p.id
                WHERE a.status = 'active' AND a.end_date IS NOT NULL
            `,
            buildSoonMessage: (row, daysLeft) => ({
                title: 'Convention bientôt expirée',
                message: `La convention "${row.title}" avec ${row.partner_name} expire dans ${daysLeft} jour(s).`
            }),
            buildExpiredMessage: (row) => ({
                title: 'Convention expirée',
                message: `La convention "${row.title}" avec ${row.partner_name} a expiré.`
            })
        });

        // Appels a projets
        const callViewers = await notificationsModel.getUsersWithPermission('calls.view');
        const callViewerIds = callViewers.map(u => u.id);
        notificationsCreated += await processMilestones({
            entityType: 'call',
            viewerIds: callViewerIds,
            soonDaysBefore: 5,
            query: `
                SELECT id, title, deadline AS ref_date
                FROM calls
                WHERE status = 'open' AND deadline IS NOT NULL
            `,
            buildSoonMessage: (row, daysLeft) => ({
                title: 'Appel à projets bientôt clos',
                message: `L'appel à projets "${row.title}" se clôture dans ${daysLeft} jour(s).`
            }),
            buildExpiredMessage: (row) => ({
                title: 'Appel à projets clos',
                message: `L'appel à projets "${row.title}" est clôturé.`
            })
        });

        // Mobility
        const mobilityViewers = await notificationsModel.getUsersWithPermission('mobility.view');
        notificationsCreated += await processMilestones({
            entityType: 'mobility',
            viewerIds: mobilityViewers.map(u => u.id),
            soonDaysBefore: 5,
            query: `
                SELECT id, title, deadline AS ref_date
                FROM mobility
                WHERE status = 'open' AND deadline IS NOT NULL
            `,
            buildSoonMessage: (row, daysLeft) => ({
                title: 'Mobilité bientôt clôturée',
                message: `La mobilité "${row.title}" se clôture dans ${daysLeft} jour(s).`
            }),
            buildExpiredMessage: (row) => ({
                title: 'Mobilité clôturée',
                message: `La mobilité "${row.title}" est clôturée.`
            })
        });

        //  Documents expires
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
                const already = await notificationsModel.wasMilestoneSent('document', doc.id, 'expired');
                if (!already) {
                    const title = 'Document expiré';
                    const message = `Le document "${doc.titre}" a expiré le ${new Date(doc.date_expiration).toLocaleDateString('fr-FR')}.`;
                    await notificationsModel.createForUsers(documentViewerIds, title, message, 'error');
                    await notificationsModel.markMilestoneSent('document', doc.id, 'expired');
                    notificationsCreated++;
                }
            }
        }

        //  Brouillons oublies
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

            const already = await notificationsModel.wasMilestoneSent(draft.type, draft.id, 'stale_draft');
            if (!already) {
                const typeLabel = { projet: 'Projet', appel: "Appel à projets", partenaire: 'Partenaire' }[draft.type] || draft.type;
                const title = `Brouillon ancien (${typeLabel})`;
                const message = `Le ${typeLabel.toLowerCase()} "${draft.title}" est en brouillon depuis plus de 30 jours.`;
                await notificationsModel.createForUsers(recipientIds, title, message, 'info');
                await notificationsModel.markMilestoneSent(draft.type, draft.id, 'stale_draft');
                notificationsCreated++;
            }
        }

        console.log(`[NOTIFICATIONS] ${notificationsCreated} nouvelles notifications créées.`);
    } catch (error) {
        console.error('[NOTIFICATIONS] Erreur:', error);
    }
}

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

async function runAllJobs() {
    await runNotificationChecks();
    await cleanupOldNotifications();
}

module.exports = { runNotificationChecks, cleanupOldNotifications, runAllJobs };