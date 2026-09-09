const pool = require('../db');

const DEFAULTS = {
    reset_code_window_minutes: '15',
    max_reset_attempts: '5',
    reset_email_subject: ' Réinitialisation de votre mot de passe ESI',
    reset_email_text: 'Votre code de réinitialisation est : {{code}}. Ce code expire dans {{minutes}} minutes.',
    
    welcome_email_subject: ' Bienvenue sur le Portail International ESI',
    welcome_email_text: 'Bonjour {{fullName}},\n\nVotre compte a été créé avec succès sur le Portail International ESI.\n\nEmail : {{email}}\nMot de passe temporaire : {{password}}\n\nVeuillez changer votre mot de passe lors de votre première connexion.',
    
    activation_email_subject: ' Votre compte ESI a été réactivé',
    activation_email_text: 'Bonjour {{fullName}},\n\nVotre compte sur le Portail International ESI a été réactivé.\n\nVous pouvez maintenant vous connecter avec vos identifiants habituels.\n\nDate : {{date}}',
    
    deactivation_email_subject: ' Votre compte ESI a été désactivé',
    deactivation_email_text: 'Bonjour {{fullName}},\n\nVotre compte sur le Portail International ESI a été désactivé par un administrateur.\n\nRaisons possibles : inactivité prolongée, demande de l\'utilisateur, ou mesure de sécurité.\n\nPour plus d\'informations, veuillez contacter le support : cooperation@esi.dz\n\nDate : {{date}}',
    
    suspicious_login_threshold: '3',
    suspicious_email_subject: ' Alertes de sécurité - Tentatives de connexion suspectes',
    suspicious_email_text: 'Bonjour {{fullName}},\n\nNous avons détecté {{attempts}} tentatives de connexion échouées sur votre compte.\n\nAdresse IP : {{ip}}\nDate : {{date}}\n\nSi vous ne reconnaissez pas ces tentatives, nous vous recommandons de changer immédiatement votre mot de passe.'
};

exports.DEFAULTS = DEFAULTS;

// Recuperer tous les parametres
exports.getAll = async () => {
    const result = await pool.query('SELECT key, value FROM app_settings');
    const settings = {};
    result.rows.forEach(row => {
        settings[row.key] = row.value;
    });
    
    // Compléter avec les valeurs par défaut si des clés manquent
    Object.keys(DEFAULTS).forEach(key => {
        if (!(key in settings)) {
            settings[key] = DEFAULTS[key];
        }
    });
    
    return settings;
};

// Mettre a jour plusieurs parametres
exports.upsertMany = async (entries) => {
    for (const entry of entries) {
        await pool.query(
            `INSERT INTO app_settings (key, value) 
             VALUES ($1, $2) 
             ON CONFLICT (key) 
             DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [entry.key, entry.value]
        );
    }
};

// Mettre a jour un seul parametre
exports.upsert = async (key, value) => {
    const result = await pool.query(
        `INSERT INTO app_settings (key, value) 
         VALUES ($1, $2) 
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
         RETURNING *`,
        [key, value]
    );
    return result.rows[0];
};