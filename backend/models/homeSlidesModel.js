const db = require('../db');

// public slides
async function findAllPublic(lang) {
  const query = `
    SELECT 
      s.id, s.badge, s.icon_type, s.icon_value, s.display_order,
      t.title, t.description
    FROM home_slides s
    LEFT JOIN home_slides_translations t 
      ON s.id = t.slide_id 
      AND t.language_id = $1::integer
    WHERE s.statut_publication = 'published'
    ORDER BY s.display_order ASC
  `;
  const result = await db.query(query, [lang]);
  return result.rows;
}

// admin
async function findAllAdmin(lang) {
  const query = `
    SELECT 
      s.id, s.badge, s.icon_type, s.icon_value, s.display_order, 
      s.statut_publication, 
      s.scheduled_publish_at,
      s.created_at, s.updated_at,
      t.title, t.description
    FROM home_slides s
    LEFT JOIN home_slides_translations t 
      ON s.id = t.slide_id 
      AND t.language_id = $1::integer
    ORDER BY s.display_order ASC
  `;
  const result = await db.query(query, [lang]);
  return result.rows;
}

// creation d un nouveau slide
async function create(badge, iconType, iconValue, displayOrder = 0, scheduledPublishAt = null) {
  return db.query(
    `INSERT INTO home_slides (badge, icon_type, icon_value, display_order, scheduled_publish_at) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [badge, iconType, iconValue, displayOrder, scheduledPublishAt]
  );
}

// mise a jour d un slide
async function update(id, { badge, iconType, iconValue, displayOrder, scheduledPublishAt }) {
  return db.query(
    `UPDATE home_slides 
     SET badge = $1, 
         icon_type = $2, 
         icon_value = $3, 
         display_order = $4,
         scheduled_publish_at = $5,
         updated_at = now() 
     WHERE id = $6 RETURNING *`,
    [badge, iconType, iconValue, displayOrder ?? 0, scheduledPublishAt || null, id]
  );
}

// reordonner les slides
async function reorder(slides) {
  const promises = slides.map((s, i) =>
    db.query(`UPDATE home_slides SET display_order=$1 WHERE id=$2`, [i, s.id])
  );
  return Promise.all(promises);
}

// publication status
async function updateStatus(id, status) {
  return db.query(
    `UPDATE home_slides 
     SET statut_publication = $1::varchar, 
         scheduled_publish_at = CASE 
             WHEN $2::varchar = 'published' THEN NULL 
             ELSE scheduled_publish_at 
         END,
         updated_at = now() 
     WHERE id = $3::integer 
     RETURNING *`,
    [status, status, id]
  );
}

// Supprimer un slide
async function remove(id) {
  return db.query(`DELETE FROM home_slides WHERE id=$1::integer`, [id]);
}

// Traductions
async function getTranslations(slideId) {
  return db.query(
    `SELECT language_id, title, description FROM home_slides_translations WHERE slide_id=$1::integer`,
    [slideId]
  );
}

async function upsertTranslation(slideId, languageId, { title, description }) {
  return db.query(
    `INSERT INTO home_slides_translations (slide_id, language_id, title, description)
     VALUES ($1::integer, $2::integer, $3, $4)
     ON CONFLICT (slide_id, language_id) 
     DO UPDATE SET title=$3, description=$4, updated_at=now()
     RETURNING *`,
    [slideId, languageId, title, description]
  );
}

// publier les slides programmé

async function publishScheduledDue() {
  const result = await db.query(
    `UPDATE home_slides
     SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
     WHERE statut_publication='draft'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()
     RETURNING id, badge`
  );
  return result.rows;
}

module.exports = { 
  findAllPublic, 
  findAllAdmin, 
  create, 
  update, 
  reorder, 
  updateStatus, 
  remove, 
  getTranslations, 
  upsertTranslation,
  publishScheduledDue,
};