
const db = require('../db');

// Récupérer tous les slides publiés + traductions (public)
async function findAllPublic(lang) {
  const query = `
    SELECT 
      s.id, s.badge, s.icon_type, s.icon_value, s.display_order,
      t.title, t.description
    FROM home_slides s
    LEFT JOIN home_slides_translations t ON s.id = t.slide_id AND t.language_id = $1
    WHERE s.statut_publication = 'published'
    ORDER BY s.display_order ASC
  `;
  const result = await db.query(query, [lang]);
  return result.rows; // ✅ FIX: extraire .rows au lieu de renvoyer l'objet pg complet
}

// Récupérer TOUS les slides (admin preview)
async function findAllAdmin(lang) {
  const query = `
    SELECT 
      s.id, s.badge, s.icon_type, s.icon_value, s.display_order, 
      s.statut_publication, s.created_at, s.updated_at,
      t.title, t.description
    FROM home_slides s
    LEFT JOIN home_slides_translations t ON s.id = t.slide_id AND t.language_id = $1
    ORDER BY s.display_order ASC
  `;
  const result = await db.query(query, [lang]);
  return result.rows; // ✅ FIX: idem
}

// Créer un slide
async function create(badge, iconType, iconValue) {
  return db.query(
    `INSERT INTO home_slides (badge, icon_type, icon_value) 
     VALUES ($1, $2, $3) RETURNING *`,
    [badge, iconType, iconValue]
  );
}

// Mettre à jour un slide
async function update(id, { badge, iconType, iconValue }) {
  return db.query(
    `UPDATE home_slides SET badge=$1, icon_type=$2, icon_value=$3, updated_at=now() 
     WHERE id=$4 RETURNING *`,
    [badge, iconType, iconValue, id]
  );
}

// Réordonner (pour drag & drop)
async function reorder(slides) {
  // slides = [{id: 1}, {id: 2}, ...] dans le nouvel ordre
  const promises = slides.map((s, i) =>
    db.query(`UPDATE home_slides SET display_order=$1 WHERE id=$2`, [i, s.id])
  );
  return Promise.all(promises);
}

// Publier/archiver
async function updateStatus(id, status) {
  return db.query(
    `UPDATE home_slides SET statut_publication=$1, updated_at=now() WHERE id=$2 RETURNING *`,
    [status, id]
  );
}

// Supprimer
async function remove(id) {
  return db.query(`DELETE FROM home_slides WHERE id=$1`, [id]);
}

// Traductions
async function getTranslations(slideId) {
  return db.query(
    `SELECT language_id, title, description FROM home_slides_translations WHERE slide_id=$1`,
    [slideId]
  );
}

async function upsertTranslation(slideId, languageId, { title, description }) {
  return db.query(
    `INSERT INTO home_slides_translations (slide_id, language_id, title, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slide_id, language_id) DO UPDATE SET title=$3, description=$4, updated_at=now()
     RETURNING *`,
    [slideId, languageId, title, description]
  );
}

module.exports = { findAllPublic, findAllAdmin, create, update, reorder, updateStatus, remove, getTranslations, upsertTranslation };