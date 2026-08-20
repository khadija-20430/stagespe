const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { globalLimiter, loginLimiter } = require('./middleware/rateLimiter');
const sanitizeBody = require('./middleware/sanitize');
const ensureSuperAdmin = require('./lib/bootstrapAdmin');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(sanitizeBody);
app.use(globalLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/languages', require('./routes/languagesRoutes'));
app.use('/api/countries', require('./routes/countriesRoutes'));
app.use('/api/programmes', require('./routes/programmesRoutes'));
app.use('/api/themes', require('./routes/themesRoutes'));
app.use('/api/partnership-types', require('./routes/partnershipTypesRoutes'));
app.use('/api/establishment-types', require('./routes/establishmentTypesRoutes'));
app.use('/api/action-types', require('./routes/actionTypesRoutes'));
app.use('/api/cities', require('./routes/citiesRoutes'));
app.use('/api/institutions', require('./routes/institutionsRoutes'));

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/authRoutes'));

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

app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API Portail International ESI' });
});

app.use((err, req, res, next) => {
    console.error('[ERREUR NON GÉRÉE]', err);
    res.status(500).json({ error: 'Une erreur interne est survenue' });
});

const PORT = process.env.PORT || 5000;

// On crée/vérifie le compte super_admin AVANT d'ouvrir le serveur aux requêtes,
// pour être sûr que le compte est prêt dès le premier appel. Idempotent :
// ne recrée jamais un compte déjà existant (vérifié par email).
ensureSuperAdmin().finally(() => {
    app.listen(PORT, () => {
        console.log(`Serveur backend lancé sur le port ${PORT}`);
    });
});