const homeSlidesModel = require('../models/homeSlidesModel');

exports.getPublic = async (req, res) => {
  const lang = req.query.lang || 1; // Default FR
  try {
    const slides = await homeSlidesModel.findAllPublic(lang);
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAdmin = async (req, res) => {
  const lang = req.query.lang || 1;
  try {
    const slides = await homeSlidesModel.findAllAdmin(lang);
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { badge, iconType, iconValue, translations } = req.body;
  try {
    const result = await homeSlidesModel.create(badge, iconType, iconValue);
    const slideId = result.rows[0].id;

    // Créer traductions (FR, EN, AR)
    for (const [langId, { title, description }] of Object.entries(translations)) {
      await homeSlidesModel.upsertTranslation(slideId, langId, { title, description });
    }

    res.status(201).json({ id: slideId, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { badge, iconType, iconValue, translations } = req.body;
  try {
    const result = await homeSlidesModel.update(id, { badge, iconType, iconValue });

    // Mettre à jour traductions
    if (translations) {
      for (const [langId, { title, description }] of Object.entries(translations)) {
        await homeSlidesModel.upsertTranslation(id, langId, { title, description });
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reorder = async (req, res) => {
  const { slides } = req.body; // [{id: 1}, {id: 2}, ...]
  try {
    await homeSlidesModel.reorder(slides);
    res.json({ message: 'Slides réordonnées' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // draft ou published
  try {
    const result = await homeSlidesModel.updateStatus(id, status);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await homeSlidesModel.remove(id);
    res.json({ message: 'Slide supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTranslations = async (req, res) => {
  const { id } = req.params;
  try {
    const translations = await homeSlidesModel.getTranslations(id);
    res.json(translations.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};