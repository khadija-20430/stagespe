const settingsModel = require('../models/settingsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

// Toutes les clés autorisées (DEFAULTS du modèle)
const ALLOWED_KEYS = Object.keys(settingsModel.DEFAULTS);

exports.getSettings = async(req, res) => {
    try {
        const settings = await settingsModel.getAll();
        res.json(settings);
    } catch (err) { 
        sendError(res, err); 
    }
};

exports.updateSettings = async(req, res) => {
    try {
        const body = req.body || {};
        
        // Filtrer uniquement les clés autorisées
        const entries = Object.entries(body).filter(([key]) => ALLOWED_KEYS.includes(key));

        if (entries.length === 0) {
            return res.status(400).json({ error: 'Aucun paramètre valide fourni' });
        }

        // ✅ Validation : reset_code_window_minutes
        if (body.reset_code_window_minutes !== undefined) {
            const n = Number(body.reset_code_window_minutes);
            if (!Number.isInteger(n) || n < 1 || n > 1440) {
                return res.status(400).json({ error: 'La durée de validité doit être un entier entre 1 et 1440 minutes' });
            }
        }

        // ✅ Validation : max_reset_attempts
        if (body.max_reset_attempts !== undefined) {
            const n = Number(body.max_reset_attempts);
            if (!Number.isInteger(n) || n < 1 || n > 20) {
                return res.status(400).json({ error: 'Le nombre de tentatives doit être un entier entre 1 et 20' });
            }
        }

        // ✅ Validation : suspicious_login_threshold
        if (body.suspicious_login_threshold !== undefined) {
            const n = Number(body.suspicious_login_threshold);
            if (!Number.isInteger(n) || n < 2 || n > 10) {
                return res.status(400).json({ error: 'Le seuil de tentatives suspectes doit être un entier entre 2 et 10' });
            }
        }

        // ✅ Validation : reset_email_text doit contenir {{code}}
        if (body.reset_email_text !== undefined && !String(body.reset_email_text).includes('{{code}}')) {
            return res.status(400).json({ error: 'Le texte de l\'email de réinitialisation doit contenir le champ {{code}}' });
        }

        // ✅ Validation : welcome_email_text doit contenir {{fullName}}
        if (body.welcome_email_text !== undefined && !String(body.welcome_email_text).includes('{{fullName}}')) {
            return res.status(400).json({ error: 'Le texte de l\'email de bienvenue doit contenir le champ {{fullName}}' });
        }

        // ✅ Validation : activation_email_text doit contenir {{fullName}}
        if (body.activation_email_text !== undefined && !String(body.activation_email_text).includes('{{fullName}}')) {
            return res.status(400).json({ error: 'Le texte de l\'email d\'activation doit contenir le champ {{fullName}}' });
        }

        // ✅ Validation : deactivation_email_text doit contenir {{fullName}}
        if (body.deactivation_email_text !== undefined && !String(body.deactivation_email_text).includes('{{fullName}}')) {
            return res.status(400).json({ error: 'Le texte de l\'email de désactivation doit contenir le champ {{fullName}}' });
        }

        // ✅ Validation : suspicious_email_text doit contenir {{fullName}} et {{attempts}}
        if (body.suspicious_email_text !== undefined) {
            const text = String(body.suspicious_email_text);
            if (!text.includes('{{fullName}}') || !text.includes('{{attempts}}')) {
                return res.status(400).json({ 
                    error: 'Le texte de l\'email de sécurité doit contenir les champs {{fullName}} et {{attempts}}' 
                });
            }
        }

        // Sauvegarde des paramètres
        await settingsModel.upsertMany(entries.map(([key, value]) => ({ 
            key, 
            value: String(value) 
        })));

        await logAction(req.user.id, 'update_settings', 'app_settings', null, body, req);

        // Retourner les paramètres mis à jour
        const settings = await settingsModel.getAll();
        res.json(settings);

    } catch (err) { 
        sendError(res, err); 
    }
};