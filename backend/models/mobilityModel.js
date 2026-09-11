const pool = require('../db');

const MOBILITY_JOIN = `
  FROM mobility
  LEFT JOIN programmes ON mobility.programme_id = programmes.id
  LEFT JOIN countries ON mobility.destination_country_id = countries.id
  LEFT JOIN partners ON mobility.destination_partner_id = partners.id
  LEFT JOIN institutions ON mobility.institution_id = institutions.id
  LEFT JOIN cities ON institutions.city_id = cities.id
`;
const MOBILITY_SELECT = `
  SELECT mobility.*, programmes.name AS programme_name, countries.name AS country_name,
         partners.name AS partner_name, institutions.name AS institution_name, cities.name AS city_name
`;

const MOBILITY_FIELDS = [
    'title', 'type', 'programme_id', 'project_id', 'agreement_id', 'destination_country_id',
    'destination_partner_id', 'institution_id', 'target_audience', 'description', 'conditions',
    'places_count', 'duration', 'period', 'funding_details', 'application_link', 'contact_person', 'contact_email',
    'deadline', 'start_date', 'end_date', 'status',
    'scheduled_publish_at' 
];

// Remplace toutes les exigences de langue d'une offre par la nouvelle liste envoyée
async function replaceLanguageRequirements(client, mobilityId, requirements) {
    if (!Array.isArray(requirements)) return;
    await client.query('DELETE FROM mobility_language_requirements WHERE mobility_id = $1', [mobilityId]);
    for (const req of requirements) {
        if (req && req.language_id) {
            await client.query(
                'INSERT INTO mobility_language_requirements (mobility_id, language_id, min_level) VALUES ($1,$2,$3)', [mobilityId, req.language_id, req.min_level || null]
            );
        }
    }
}

exports.findAllPublished = async(filters) => {
    const { type, status, programme_id, destination_country_id } = filters;
    let query = `${MOBILITY_SELECT},
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', d.id,
                    'titre', d.titre,
                    'fichier_url', d.fichier_url,
                    'file_format', d.file_format,
                    'file_size', d.file_size
                ) ORDER BY d.id
            )
            FROM mobility_documents mdoc
            JOIN documents d ON d.id = mdoc.document_id
            WHERE mdoc.mobility_id = mobility.id
              AND d.statut_publication = 'published'
        ), '[]') AS documents
      ${MOBILITY_JOIN} WHERE mobility.statut_publication = 'published'`;
    const params = [];
    if (type) { params.push(type);
        query += ` AND mobility.type = $${params.length}`; }
    if (status) { params.push(status);
        query += ` AND mobility.status = $${params.length}`; }
    if (programme_id) { params.push(programme_id);
        query += ` AND mobility.programme_id = $${params.length}`; }
    if (destination_country_id) { params.push(destination_country_id);
        query += ` AND mobility.destination_country_id = $${params.length}`; }
    query += ' ORDER BY mobility.deadline ASC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findAllAdmin = async() => {
    const query = `${MOBILITY_SELECT},
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', d.id,
                    'titre', d.titre,
                    'fichier_url', d.fichier_url,
                    'file_format', d.file_format,
                    'file_size', d.file_size
                ) ORDER BY d.id
            )
            FROM mobility_documents mdoc
            JOIN documents d ON d.id = mdoc.document_id
            WHERE mdoc.mobility_id = mobility.id
        ), '[]') AS documents
      ${MOBILITY_JOIN} ORDER BY mobility.deadline ASC`;
    const result = await pool.query(query);
    return result.rows;
};

exports.findById = async(id) => {
    const query = `${MOBILITY_SELECT},
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', d.id,
                    'titre', d.titre,
                    'fichier_url', d.fichier_url,
                    'file_format', d.file_format,
                    'file_size', d.file_size
                ) ORDER BY d.id
            )
            FROM mobility_documents mdoc
            JOIN documents d ON d.id = mdoc.document_id
            WHERE mdoc.mobility_id = mobility.id
        ), '[]') AS documents
      ${MOBILITY_JOIN} WHERE mobility.id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

exports.getLanguageRequirements = async(mobilityId) => {
    const result = await pool.query(
        `SELECT languages.id, languages.code, languages.name, mobility_language_requirements.min_level
     FROM mobility_language_requirements
     JOIN languages ON mobility_language_requirements.language_id = languages.id
     WHERE mobility_id = $1`, [mobilityId]
    );
    return result.rows;
};

exports.create = async(data, userId) => {
        const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const values = MOBILITY_FIELDS.map(f => {
            if (f === 'status') return data.status || 'open';
            if (f === 'scheduled_publish_at') return data.scheduled_publish_at || null;
            return data[f];
        });
        const result = await client.query(
            `INSERT INTO mobility (${MOBILITY_FIELDS.join(', ')}, created_by)
             VALUES (${MOBILITY_FIELDS.map((_, i) => `$${i + 1}`).join(',')}, $${MOBILITY_FIELDS.length + 1})
             RETURNING *`,
            [...values, userId]
        );
    const mobility = result.rows[0];
    await replaceLanguageRequirements(client, mobility.id, data.language_requirements);
    await client.query('COMMIT');
    return mobility;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const values = MOBILITY_FIELDS.map(f => {
      if (f === 'scheduled_publish_at') return data.scheduled_publish_at ?? null;
      return data[f];
    });
    
    const setClause = MOBILITY_FIELDS.map((f, i) => `${f}=$${i + 1}`).join(', ');
    const result = await client.query(
      `UPDATE mobility SET ${setClause}, updated_at=NOW() WHERE id=$${MOBILITY_FIELDS.length + 1} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    await replaceLanguageRequirements(client, id, data.language_requirements);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.publishScheduledDue = async() => {
    const result = await pool.query(
        `UPDATE mobility
         SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id, title`
    );
    return result.rows;
};
exports.publish = async (id) => {
    const result = await pool.query(
        `UPDATE mobility 
         SET statut_publication='published', 
             published_at=NOW(),
             scheduled_publish_at=NULL
         WHERE id=$1 
         RETURNING *`,
        [id]
    );
    return result.rows[0];
};

exports.archive = async (id) => {
  const result = await pool.query(
    `UPDATE mobility SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

exports.remove = async (id) => {
  const result = await pool.query('DELETE FROM mobility WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
};
exports.updateLanguageRequirements = async (mobilityId, requirements) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await replaceLanguageRequirements(client, mobilityId, requirements);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};