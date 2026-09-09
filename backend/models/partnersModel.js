const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { withAuditContext } = require('../lib/auditContext');

// ------------------------------------------------------------
// Selects "simples" (fiche unique) — inchangés, utilisés par findById
// ------------------------------------------------------------
const PARTNER_JOIN = `
  FROM partners
  LEFT JOIN countries ON partners.country_id = countries.id
  LEFT JOIN establishment_types ON partners.establishment_type_id = establishment_types.id
  LEFT JOIN partnership_types ON partners.partnership_type_id = partnership_types.id
`;
const PARTNER_SELECT = `
  SELECT partners.*, countries.name AS country_name,
         establishment_types.label AS establishment_type_label,
         partnership_types.label AS partnership_type_label
`;

// ------------------------------------------------------------
// 🆕 Selects "agrégés" (listes) — ajoutent theme_ids / theme_names
// via partner_themes -> themes, sur le même principe que
// callsModel (theme_ids agrégés pour findAllPublished/findAllAdmin).
// ------------------------------------------------------------
// ============================================================
// PATCH — dans src/models/partnersModel.js (backend)
//
// Remplacer PARTNER_SELECT_WITH_THEMES et PARTNER_JOIN_WITH_THEMES
// par ces versions (ajout de agreement_types, nécessaire pour le
// filtre visiteur "Type d'accord" — cahier des charges 2.3).
// findAllPublished / findAllAdmin n'ont besoin d'aucune autre
// modification : ils utilisent déjà ces deux constantes.
// ============================================================

const PARTNER_SELECT_WITH_THEMES = `
  SELECT partners.*, countries.name AS country_name,
         establishment_types.label AS establishment_type_label,
         partnership_types.label AS partnership_type_label,
         COALESCE(
             ARRAY_AGG(DISTINCT themes.id) FILTER (WHERE themes.id IS NOT NULL),
             '{}'
         ) AS theme_ids,
         COALESCE(
             ARRAY_AGG(DISTINCT themes.name) FILTER (WHERE themes.name IS NOT NULL),
             '{}'
         ) AS theme_names,
         -- 🆕 types de convention liés au partenaire (agreements.type),
         -- utilisé pour le filtre "Type d'accord" (cahier des charges 2.3)
         COALESCE(
             ARRAY_AGG(DISTINCT agreements.type) FILTER (WHERE agreements.type IS NOT NULL),
             '{}'
         ) AS agreement_types
`;
const PARTNER_JOIN_WITH_THEMES = `
  FROM partners
  LEFT JOIN countries ON partners.country_id = countries.id
  LEFT JOIN establishment_types ON partners.establishment_type_id = establishment_types.id
  LEFT JOIN partnership_types ON partners.partnership_type_id = partnership_types.id
  LEFT JOIN partner_themes ON partner_themes.partner_id = partners.id
  LEFT JOIN themes ON themes.id = partner_themes.theme_id
  -- 🆕 join vers agreements uniquement pour agréger les types (pas les FK
  -- de agreements elles-mêmes ailleurs dans PARTNER_JOIN_WITH_THEMES)
  LEFT JOIN agreements ON agreements.partner_id = partners.id
`;
// partners.id détermine fonctionnellement countries.name / establishment_types.label /
// partnership_types.label (relations many-to-one) -> GROUP BY valide en Postgres.
const PARTNER_GROUP_BY = `
  GROUP BY partners.id, countries.name, establishment_types.label, partnership_types.label
`;

function deleteOldLogoFile(logoUrl) {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', logoUrl);
    fs.unlink(filePath, () => {});
}
exports.deleteOldLogoFile = deleteOldLogoFile;

exports.findAllPublished = async(filters) => {
    const { country_id, establishment_type_id, partnership_type_id, partnership_status, theme_id, search } = filters;
    let query = `${PARTNER_SELECT_WITH_THEMES} ${PARTNER_JOIN_WITH_THEMES} WHERE partners.statut_publication = 'published'`;
    const params = [];
    if (country_id) {
        params.push(country_id);
        query += ` AND partners.country_id = $${params.length}`;
    }
    if (establishment_type_id) {
        params.push(establishment_type_id);
        query += ` AND partners.establishment_type_id = $${params.length}`;
    }
    if (partnership_type_id) {
        params.push(partnership_type_id);
        query += ` AND partners.partnership_type_id = $${params.length}`;
    }
    if (partnership_status) {
        params.push(partnership_status);
        query += ` AND partners.partnership_status = $${params.length}`;
    }
    // 🆕 filtre par thème (cahier des charges 2.3 : "Domaine de coopération")
    if (theme_id) {
        params.push(theme_id);
        query += ` AND EXISTS (
            SELECT 1 FROM partner_themes pt
            WHERE pt.partner_id = partners.id AND pt.theme_id = $${params.length}
        )`;
    }
    if (search) {
        params.push(`%${search}%`);
        query += ` AND partners.name ILIKE $${params.length}`;
    }
    query += ` ${PARTNER_GROUP_BY} ORDER BY partners.id DESC`;
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findAllForMap = async() => {
    const result = await pool.query(
        `SELECT id, name, latitude, longitude, country_id FROM partners
     WHERE statut_publication = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    return result.rows;
};

exports.findAllAdmin = async() => {
    // 🆕 theme_ids / theme_names ajoutés — utilisés pour pré-remplir le select
    // multiple "Thèmes" à l'édition et pour la colonne "Thèmes" du tableau admin.
    const result = await pool.query(
        `${PARTNER_SELECT_WITH_THEMES} ${PARTNER_JOIN_WITH_THEMES} ${PARTNER_GROUP_BY} ORDER BY partners.id DESC`
    );
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query(`${PARTNER_SELECT} ${PARTNER_JOIN} WHERE partners.id = $1`, [id]);
    return result.rows[0];
};

// 🆕 thèmes liés à un partenaire — utilisé par getOne (fiche détail publique),
// même principe que findAgreementsByPartner / findPublicContactsByPartner.
exports.findThemesByPartner = async(partnerId) => {
    const result = await pool.query(
        `SELECT themes.* FROM themes
         JOIN partner_themes ON partner_themes.theme_id = themes.id
         WHERE partner_themes.partner_id = $1`, [partnerId]
    );
    return result.rows;
};

exports.findAgreementsByPartner = async(partnerId) => {
    const result = await pool.query('SELECT * FROM agreements WHERE partner_id = $1 ORDER BY start_date DESC', [partnerId]);
    return result.rows;
};

exports.findPublicContactsByPartner = async(partnerId) => {
    const result = await pool.query(
        'SELECT id, full_name, position, email, phone, is_primary FROM partner_contacts WHERE partner_id = $1 AND is_public = TRUE', [partnerId]
    );
    return result.rows;
};

exports.findPublishedProjectsByPartner = async(partnerId) => {
    const result = await pool.query(
        `SELECT projects.id, projects.title, projects.status FROM project_partners
     JOIN projects ON project_partners.project_id = projects.id
     WHERE project_partners.partner_id = $1 AND projects.statut_publication = 'published'`, [partnerId]
    );
    return result.rows;
};

exports.findLogoUrlById = async(id) => {
    const result = await pool.query('SELECT logo_url FROM partners WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data, userId) => {
    const {
        name,
        official_name,
        country_id,
        city,
        address,
        establishment_type_id,
        partnership_type_id,
        partnership_status,
        website,
        cooperation_areas,
        description,
        logo_url,
        latitude,
        longitude,
        theme_ids,
        // 🆕 date de programmation de publication (ISO datetime ou null)
        scheduled_publish_at,
    } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO partners
         (name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status,
          website, cooperation_areas, description, logo_url, latitude, longitude, scheduled_publish_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`, [name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status || 'active',
                website, cooperation_areas, description, logo_url, latitude, longitude, scheduled_publish_at || null, userId
            ]
        );
        const partner = result.rows[0];

        // 🆕 insertion des thèmes sélectionnés dans partner_themes
        if (Array.isArray(theme_ids) && theme_ids.length > 0) {
            const values = theme_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(`INSERT INTO partner_themes (partner_id, theme_id) VALUES ${values}`, [partner.id, ...theme_ids]);
        }

        await client.query('COMMIT');
        return partner;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.update = async(id, data, auditContext) => {
    const {
        name,
        official_name,
        country_id,
        city,
        address,
        establishment_type_id,
        partnership_type_id,
        partnership_status,
        website,
        cooperation_areas,
        description,
        logo_url,
        latitude,
        longitude,
        theme_ids,
        scheduled_publish_at,
    } = data;

    return withAuditContext(auditContext.userId, auditContext.ip, async(client) => {
        const result = await client.query(
            `UPDATE partners SET name=$1, official_name=$2, country_id=$3, city=$4, address=$5, establishment_type_id=$6,
       partnership_type_id=$7, partnership_status=$8, website=$9, cooperation_areas=$10, description=$11,
       logo_url=$12, latitude=$13, longitude=$14, scheduled_publish_at=$15
       WHERE id=$16 RETURNING *`, [name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status,
                website, cooperation_areas, description, logo_url, latitude, longitude, scheduled_publish_at || null, id
            ]
        );
        if (result.rows.length === 0) return null;

        // 🆕 remplacement des thèmes liés (delete + re-insert, comme call_themes)
        if (Array.isArray(theme_ids)) {
            await client.query('DELETE FROM partner_themes WHERE partner_id = $1', [id]);
            if (theme_ids.length > 0) {
                const values = theme_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
                await client.query(`INSERT INTO partner_themes (partner_id, theme_id) VALUES ${values}`, [id, ...theme_ids]);
            }
        }

        return result.rows[0];
    });
};

exports.publish = async(id) => {
    // 🆕 on nettoie scheduled_publish_at si on publie manuellement avant l'échéance
    const result = await pool.query(
        `UPDATE partners SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

exports.archive = async(id) => {
    const result = await pool.query(
        `UPDATE partners SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

// 🆕 utilisé par le job planifié (cron) : publie automatiquement tous les
// partenaires en brouillon dont la date programmée est atteinte.
// Renvoie la liste des ids publiés (pour logs / notifications éventuelles).
exports.publishScheduledDue = async() => {
    const result = await pool.query(
        `UPDATE partners
         SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id`
    );
    return result.rows;
};

exports.duplicate = async(id, userId) => {
    const result = await pool.query(
        `INSERT INTO partners
     (name, official_name, country_id, city, establishment_type_id, partnership_type_id, partnership_status,
      website, cooperation_areas, description, logo_url, latitude, longitude, statut_publication, created_by)
     SELECT name || ' (copie)', official_name, country_id, city, establishment_type_id, partnership_type_id,
            partnership_status, website, cooperation_areas, description, logo_url, latitude, longitude,
            'draft', $2
     FROM partners WHERE id = $1 RETURNING *`, [id, userId]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM partners WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};