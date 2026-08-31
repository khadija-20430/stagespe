const settingsModel = require('../models/settingsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const ALLOWED_KEYS = Object.keys(settingsModel.DEFAULTS);

exports.getSettings = async(req, res) => {
    try {
        const settings = await settingsModel.getAll();
        res.json(settings);
    } catch (err) { sendError(res, err); }
};

exports.updateSettings = async(req, res) => {
    try {
        const body = req.body || {};
        // On ignore silencieusement toute clé inconnue envoyée par erreur —
        // seules les clés qu'on gère explicitement peuvent être écrites.
        const entries = Object.entries(body).filter(([key]) => ALLOWED_KEYS.includes(key));

        if (entries.length === 0) {
            return res.status(400).json({ error: 'Aucun paramètre valide fourni' });
        }

        if (body.reset_code_window_minutes !== undefined) {
            const n = Number(body.reset_code_window_minutes);
            if (!Number.isInteger(n) || n < 1 || n > 1440) {
                return res.status(400).json({ error: 'La durée de validité doit être un entier entre 1 et 1440 minutes' });
            }
        }
        if (body.max_reset_attempts !== undefined) {
            const n = Number(body.max_reset_attempts);
            if (!Number.isInteger(n) || n < 1 || n > 20) {
                return res.status(400).json({ error: 'Le nombre de tentatives doit être un entier entre 1 et 20' });
            }
        }
        if (body.reset_email_text !== undefined && !String(body.reset_email_text).includes('{{code}}')) {
            return res.status(400).json({ error: 'Le texte de l\'email doit contenir le champ {{code}}' });
        }

        await settingsModel.upsertMany(entries.map(([key, value]) => ({ key, value: String(value) })));
        await logAction(req.user.id, 'update_settings', 'app_settings', null, body, req);

        const settings = await settingsModel.getAll();
        res.json(settings);
    } catch (err) { sendError(res, err); }
};