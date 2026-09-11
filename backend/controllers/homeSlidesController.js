const homeSlidesModel = require('../models/homeSlidesModel');

// ============================================================
// PUBLIC
// ============================================================

exports.getPublic = async (req, res) => {
  const lang = parseInt(req.query.lang, 10) || 1;
  try {
    const slides = await homeSlidesModel.findAllPublic(lang);
    res.json(slides);
  } catch (err) {
    console.error('[home-slides] Erreur getPublic:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ADMIN
// ============================================================

exports.getAllAdmin = async (req, res) => {
  const lang = parseInt(req.query.lang, 10) || 1;
  try {
    const slides = await homeSlidesModel.findAllAdmin(lang);
    res.json(slides);
  } catch (err) {
    console.error('[home-slides] Erreur getAllAdmin:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CREATE ✅ CORRIGÉ
// ============================================================

exports.create = async (req, res) => {
  const { badge, iconType, iconValue, displayOrder, translations, scheduledPublishAt } = req.body;
  
  try {
    const result = await homeSlidesModel.create(
      badge, 
      iconType, 
      iconValue, 
      displayOrder ?? 0,              // ✅ AJOUT
      scheduledPublishAt || null
    );
    const slideId = result.rows[0].id;

    if (translations) {
      for (const [langId, { title, description }] of Object.entries(translations)) {
        await homeSlidesModel.upsertTranslation(slideId, langId, { title, description });
      }
    }

    res.status(201).json({ id: slideId, ...result.rows[0] });
  } catch (err) {
    console.error('[home-slides] Erreur create:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// UPDATE ✅ CORRIGÉ
// ============================================================

exports.update = async (req, res) => {
  const { id } = req.params;
  const { badge, iconType, iconValue, displayOrder, translations, scheduledPublishAt } = req.body;
  
  try {
    const result = await homeSlidesModel.update(id, { 
      badge, 
      iconType, 
      iconValue, 
      displayOrder: displayOrder ?? 0,    // ✅ AJOUT
      scheduledPublishAt: scheduledPublishAt || null 
    });

    if (translations) {
      for (const [langId, { title, description }] of Object.entries(translations)) {
        await homeSlidesModel.upsertTranslation(id, langId, { title, description });
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[home-slides] Erreur update:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// REORDER
// ============================================================

exports.reorder = async (req, res) => {
  const { slides } = req.body;
  try {
    await homeSlidesModel.reorder(slides);
    res.json({ message: 'Slides réordonnées' });
  } catch (err) {
    console.error('[home-slides] Erreur reorder:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// UPDATE STATUS
// ============================================================

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await homeSlidesModel.updateStatus(id, status);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[home-slides] Erreur updateStatus:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// DELETE
// ============================================================

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await homeSlidesModel.remove(id);
    res.json({ message: 'Slide supprimée' });
  } catch (err) {
    console.error('[home-slides] Erreur delete:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// TRANSLATIONS
// ============================================================

exports.getTranslations = async (req, res) => {
  const { id } = req.params;
  try {
    const translations = await homeSlidesModel.getTranslations(id);
    res.json(translations.rows);
  } catch (err) {
    console.error('[home-slides] Erreur getTranslations:', err);
    res.status(500).json({ error: err.message });
  }
};