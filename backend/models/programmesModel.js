const pool = require('../db');
const path = require('path');
const fs = require('fs');

function deleteOldLogoFile(logoUrl) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '..', logoUrl);
  fs.unlink(filePath, () => {});
}
exports.deleteOldLogoFile = deleteOldLogoFile;

exports.findAll = async () => {
  const result = await pool.query('SELECT * FROM programmes ORDER BY name ASC');
  return result.rows;
};

// Admin  tous les programmes avec stats
exports.findAllAdmin = async () => {
  const result = await pool.query(`
    SELECT p.*,
      COUNT(DISTINCT pd.document_id) as documents_count
    FROM programmes p
    LEFT JOIN programme_documents pd ON p.id = pd.programme_id
    GROUP BY p.id
    ORDER BY p.name ASC
  `);
  return result.rows;
};

// Preview traductions pour admin
exports.findAllAdminPreview = async (lang) => {
  const result = await pool.query(`
    SELECT p.id,
      COALESCE(pt.name, p.name) as name,
      COALESCE(pt.description, p.description) as description,
      COALESCE(pt.organisme_financeur, p.organisme_financeur) as organisme_financeur
    FROM programmes p
    LEFT JOIN programme_translations pt 
      ON pt.programme_id = p.id
      AND pt.language_id = (SELECT id FROM languages WHERE code = $1)
    ORDER BY p.name ASC
  `, [lang]);
  return result.rows;
};

exports.findById = async (id) => {
  const result = await pool.query('SELECT * FROM programmes WHERE id = $1', [id]);
  return result.rows[0];
};

exports.findLogoUrlById = async (id) => {
  const result = await pool.query('SELECT logo_url FROM programmes WHERE id = $1', [id]);
  return result.rows[0];
};

// Public  avec traduction
exports.findAllPublic = async (lang = 'fr') => {
  const result = await pool.query(`
    SELECT p.*,
      COALESCE(pt.name, p.name) as name,
      COALESCE(pt.description, p.description) as description,
      COALESCE(pt.organisme_financeur, p.organisme_financeur) as organisme_financeur
    FROM programmes p
    LEFT JOIN programme_translations pt 
      ON pt.programme_id = p.id
      AND pt.language_id = (SELECT id FROM languages WHERE code = $1)
    ORDER BY p.name ASC
  `, [lang]);
  return result.rows;
};

exports.create = async (data) => {
    const { 
        name, acronym, organisme_financeur, description, 
        official_website, logo_url, 
        scheduled_publish_at  
    } = data;
    
    const result = await pool.query(
        `INSERT INTO programmes (name, acronym, organisme_financeur, description, 
                                  official_website, logo_url, scheduled_publish_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, acronym, organisme_financeur, description, 
         official_website, logo_url, scheduled_publish_at || null]
    );
    return result.rows[0];
};

exports.update = async (id, data) => {
    const { 
        name, acronym, organisme_financeur, description, 
        official_website, logo_url, 
        scheduled_publish_at  
    } = data;
    
    const result = await pool.query(
        `UPDATE programmes 
         SET name=$1, acronym=$2, organisme_financeur=$3, description=$4,
             official_website=$5, logo_url=$6, 
             scheduled_publish_at=$7,
             updated_at=now() 
         WHERE id=$8 RETURNING *`,
        [name, acronym, organisme_financeur, description, 
         official_website, logo_url, scheduled_publish_at || null, id]
    );
    return result.rows[0];
};

exports.remove = async (id) => {
  const result = await pool.query('DELETE FROM programmes WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
};

// Traductions
exports.findTranslations = async (programmeId) => {
  const result = await pool.query(`
    SELECT pt.*, l.code as lang_code
    FROM programme_translations pt
    JOIN languages l ON l.id = pt.language_id
    WHERE pt.programme_id = $1
  `, [programmeId]);
  return result.rows;
};

exports.upsertTranslation = async (programmeId, languageId, data) => {
  const result = await pool.query(`
    INSERT INTO programme_translations (programme_id, language_id, name, description, organisme_financeur)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (programme_id, language_id) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        organisme_financeur = EXCLUDED.organisme_financeur,
        updated_at = now()
    RETURNING *
  `, [programmeId, languageId, data.name || '', data.description || null, data.organisme_financeur || null]);
  return result.rows[0];
};
exports.publishScheduledDue = async() => {
    const result = await pool.query(
        `UPDATE programmes
         SET statut_publication='published', scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id, name`
    );
    return result.rows;
};
exports.updateStatutPublication = async (id, statut) => {
    const result = await pool.query(
        `UPDATE programmes
         SET statut_publication = $1, 
             scheduled_publish_at = CASE WHEN $1 = 'published' THEN NULL ELSE scheduled_publish_at END,
             updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [statut, id]
    );
    return result.rows[0];
};