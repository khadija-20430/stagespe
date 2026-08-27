const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { withAuditContext } = require('../lib/auditContext');

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

// Supprime physiquement un ancien logo du dossier uploads (best-effort,
// on ne bloque jamais la requête si le fichier n'existe déjà plus).
function deleteOldLogoFile(logoUrl) {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', logoUrl);
    fs.unlink(filePath, () => {});
}
exports.deleteOldLogoFile = deleteOldLogoFile;

exports.findAllPublished = async(filters) => {
    const { country_id, establishment_type_id, partnership_type_id, partnership_status, search } = filters;
    let query = `${PARTNER_SELECT} ${PARTNER_JOIN} WHERE partners.statut_publication = 'published'`;
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
    if (search) {
        params.push(`%${search}%`);
        query += ` AND partners.name ILIKE $${params.length}`;
    }
    query += ' ORDER BY partners.id DESC';
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
    const result = await pool.query(`${PARTNER_SELECT} ${PARTNER_JOIN} ORDER BY partners.id DESC`);
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query(`${PARTNER_SELECT} ${PARTNER_JOIN} WHERE partners.id = $1`, [id]);
    return result.rows[0];
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
        longitude
    } = data;

    const result = await pool.query(
        `INSERT INTO partners
     (name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status,
      website, cooperation_areas, description, logo_url, latitude, longitude, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`, [name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status || 'active',
            website, cooperation_areas, description, logo_url, latitude, longitude, userId
        ]
    );
    return result.rows[0];
};

// Passe par withAuditContext pour que les triggers PostgreSQL de journalisation
// disposent de l'utilisateur/IP courant (pas de logAction explicite ici).
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
        longitude
    } = data;

    return withAuditContext(auditContext.userId, auditContext.ip, async(client) => {
        const result = await client.query(
            `UPDATE partners SET name=$1, official_name=$2, country_id=$3, city=$4, address=$5, establishment_type_id=$6,
       partnership_type_id=$7, partnership_status=$8, website=$9, cooperation_areas=$10, description=$11,
       logo_url=$12, latitude=$13, longitude=$14
       WHERE id=$15 RETURNING *`, [name, official_name, country_id, city, address, establishment_type_id, partnership_type_id, partnership_status,
                website, cooperation_areas, description, logo_url, latitude, longitude, id
            ]
        );
        return result.rows[0];
    });
};

exports.publish = async(id) => {
    const result = await pool.query(
        `UPDATE partners SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

exports.archive = async(id) => {
    const result = await pool.query(
        `UPDATE partners SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
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