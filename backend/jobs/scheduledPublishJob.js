const cron = require('node-cron');
const partnersModel = require('../models/partnersModel');
const agreementsModel = require('../models/agreementsModel');
const documentsModel = require('../models/documentsModel');
const projectsModel = require('../models/projectsModel');
const programmesModel = require('../models/programmesModel');
const homeSlidesModel = require('../models/homeSlidesModel');
const callsModel = require('../models/callsModel');
const mobilityModel = require('../models/mobilityModel');
const newsEventsModel = require('../models/newsEventsModel');

const MODELS = [
    { name: 'partners', model: partnersModel, label: 'partenaire' },
    { name: 'agreements', model: agreementsModel, label: 'convention' },
    { name: 'documents', model: documentsModel, label: 'document' },
    { name: 'projects', model: projectsModel, label: 'projet' },
    { name: 'programmes', model: programmesModel, label: 'programme' },
    { name: 'home_slides', model: homeSlidesModel, label: 'slide' },
    { name: 'calls', model: callsModel, label: 'appel' },
    { name: 'mobility', model: mobilityModel, label: 'mobilité' },
    { name: 'news_events', model: newsEventsModel, label: 'actualité' },
];

function startScheduledPublishJob() {
    // Toutes les minutes.
    cron.schedule('* * * * *', async () => {
        for (const { name, model, label } of MODELS) {
            try {
                if (typeof model.publishScheduledDue !== 'function') {
                    continue;
                }

                const publishedItems = await model.publishScheduledDue();

                if (publishedItems.length > 0) {
                    console.log(
                        `[scheduled-publish] ${publishedItems.length} ${label}(s) publié(s) automatiquement dans ${name} : ` +
                        publishedItems.map((p) => p.id).join(', ')
                    );
                }
            } catch (err) {
                console.error(`[scheduled-publish] erreur sur ${name} :`, err.message);
            }
        }
    });
}

module.exports = { startScheduledPublishJob };