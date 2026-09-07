const programmesModel = require('../models/programmesModel');
const pool = require('../db');
const sendError = require('../middleware/errorResponse');

exports.getAll = async (req, res) => {
  try {
    const lang = req.query.lang || 'fr';
    const programmes = await programmesModel.findAllPublic(lang);
    res.json(programmes);
  } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const programmes = await programmesModel.findAllAdmin();
    res.json(programmes);
  } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const programmes = await programmesModel.findAllAdminPreview(lang);
    res.json(programmes);
  } catch (err) { sendError(res, err); }
};

exports.getOne = async (req, res) => {
  try {
    const programme = await programmesModel.findById(req.params.id);
    if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
    res.json(programme);
  } catch (err) { sendError(res, err); }
};

exports.create = async (req, res) => {
  try {
    const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const programme = await programmesModel.create({ ...req.body, logo_url });
    res.status(201).json(programme);
  } catch (err) { sendError(res, err); }
};

exports.update = async (req, res) => {
  try {
    let logo_url = req.body.logo_url || null;
    if (req.file) {
      const existing = await programmesModel.findLogoUrlById(req.params.id);
      if (existing) programmesModel.deleteOldLogoFile(existing.logo_url);
      logo_url = `/uploads/${req.file.filename}`;
    }
    const programme = await programmesModel.update(req.params.id, { ...req.body, logo_url });
    if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
    res.json(programme);
  } catch (err) { sendError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const existing = await programmesModel.findLogoUrlById(req.params.id);
    const programme = await programmesModel.remove(req.params.id);
    if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
    if (existing) programmesModel.deleteOldLogoFile(existing.logo_url);
    res.json({ message: 'Programme supprimé' });
  } catch (err) { sendError(res, err); }
};

// Traductions
exports.getTranslations = async (req, res) => {
  try {
    const rows = await programmesModel.findTranslations(req.params.id);
    const result = {};
    rows.forEach(r => {
      result[r.lang_code] = { name: r.name, description: r.description };
    });
    res.json(result);
  } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async (req, res) => {
  try {
    const { id } = req.params;
    const translations = req.body; // { en: { name, description }, ar: { name, description } }

    for (const [langCode, data] of Object.entries(translations)) {
      const langResult = await pool.query(
        'SELECT id FROM languages WHERE code = $1', [langCode]
      );
      if (langResult.rows.length === 0) continue;
      const languageId = langResult.rows[0].id;
      await programmesModel.upsertTranslation(id, languageId, data);
    }

    res.json({ success: true });
  } catch (err) { sendError(res, err); }
};