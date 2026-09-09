

const cron = require('node-cron');
const partnersModel = require('../models/partnersModel');

function startScheduledPublishJob() {
    // Toutes les minutes.
    cron.schedule('* * * * *', async () => {
        try {
            const publishedPartners = await partnersModel.publishScheduledDue();
            if (publishedPartners.length > 0) {
                console.log(
                    `[scheduled-publish] ${publishedPartners.length} partenaire(s) publié(s) automatiquement : ` +
                    publishedPartners.map((p) => p.id).join(', ')
                );
            }
        } catch (err) {
            console.error('[scheduled-publish] erreur lors de la publication programmée :', err.message);
        }
    });
}

module.exports = { startScheduledPublishJob };