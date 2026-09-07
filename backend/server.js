const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { globalLimiter, loginLimiter } = require('./middleware/rateLimiter');
const sanitizeBody = require('./middleware/sanitize');
const ensureSuperAdmin = require('./lib/bootstrapAdmin');
const { runAllJobs } = require('./services/notificationScheduler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(express.json());
app.use(sanitizeBody);
app.use(globalLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES PUBLIQUES (référentiels)
// ============================================================
app.use('/api/languages', require('./routes/languagesRoutes'));
app.use('/api/countries', require('./routes/countriesRoutes'));
app.use('/api/programmes', require('./routes/programmesRoutes'));
app.use('/api/themes', require('./routes/themesRoutes'));
app.use('/api/partnership-types', require('./routes/partnershipTypesRoutes'));
app.use('/api/establishment-types', require('./routes/establishmentTypesRoutes'));
app.use('/api/action-types', require('./routes/actionTypesRoutes'));
app.use('/api/cities', require('./routes/citiesRoutes'));
app.use('/api/institutions', require('./routes/institutionsRoutes'));

// ============================================================
// ROUTES AUTH & RBAC
// ============================================================
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/roles', require('./routes/rolesRoutes'));
app.use('/api/permissions', require('./routes/permissionsRoutes'));

// ============================================================
// ROUTES MÉTIER
// ============================================================
app.use('/api/partners', require('./routes/partnersRoutes'));
app.use('/api/partner-contacts', require('./routes/partnerContactsRoutes'));
app.use('/api/agreements', require('./routes/agreementsRoutes'));
app.use('/api/projects', require('./routes/projectsRoutes'));
app.use('/api/project-partners', require('./routes/projectPartnersRoutes'));
app.use('/api/calls', require('./routes/callsRoutes'));
app.use('/api/mobility', require('./routes/mobilityRoutes'));
app.use('/api/news-events', require('./routes/newsEventsRoutes'));
app.use('/api/document-categories', require('./routes/documentCategoriesRoutes'));
app.use('/api/documents', require('./routes/documentsRoutes'));

// ============================================================
// ROUTES SCHOOL PRESENTATION
// ============================================================
app.use('/api/school-presentation', require('./routes/schoolPresentationRoutes'));

// ============================================================
// ROUTES SYSTÈME
// ============================================================
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// ============================================================
// ROUTE RACINE
// ============================================================
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API Portail International ESI' });
});

// ============================================================
// MIDDLEWARE D'ERREUR
// ============================================================
app.use((err, req, res, next) => {
    console.error('[ERREUR NON GÉRÉE]', err);
    res.status(500).json({ error: 'Une erreur interne est survenue' });
});

// ============================================================
// 🕐 CRON JOB : EXÉCUTER TOUS LES JOURS À 1H DU MATIN
// ============================================================

function scheduleDailyJobAt1AM() {
    const now = new Date();
    const next1AM = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        1, 0, 0, 0
    );

    // Si 1h du matin est déjà passé aujourd'hui, on programme pour demain
    if (now >= next1AM) {
        next1AM.setDate(next1AM.getDate() + 1);
    }

    const delayMs = next1AM - now;
    console.log(`[NOTIFICATIONS] Prochaine exécution planifiée : ${next1AM.toLocaleString('fr-FR')}`);

    setTimeout(() => {
        runAllJobs().catch(err => console.error('[CRON] Erreur jobs notifications:', err));

        // Une fois déclenché à 1h, on répète toutes les 24h à partir de là
        setInterval(() => {
            runAllJobs().catch(err => console.error('[CRON] Erreur jobs notifications:', err));
        }, 24 * 60 * 60 * 1000);

    }, delayMs);
}

// ============================================================
// DÉMARRAGE
// ============================================================
const PORT = process.env.PORT || 5000;

ensureSuperAdmin().finally(() => {
    app.listen(PORT, () => {
        console.log(`Serveur backend lancé sur le port ${PORT}`);
    });
});

scheduleDailyJobAt1AM();