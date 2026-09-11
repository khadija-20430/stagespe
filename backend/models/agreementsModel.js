const pool = require('../db');
const { withAuditContext } = require('../lib/auditContext');

exports.findAll = async(filters) => {
    const { partner_id, status, statut_publication } = filters;
    let query = `
        SELECT 
            agreements.*, 
            partners.name AS partner_name,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', d.id,
                        'titre', d.titre,
                        'nom', d.titre,
                        'fichier_url', d.fichier_url,
                        'file_format', d.file_format,
                        'file_size', d.file_size,
                        'description', d.description
                    )
                ) FILTER (WHERE d.id IS NOT NULL), 
                '[]'::json
            ) as documents
        FROM agreements 
        JOIN partners ON agreements.partner_id = partners.id
        LEFT JOIN agreement_documents ad ON agreements.id = ad.agreement_id
        LEFT JOIN documents d ON ad.document_id = d.id
        WHERE 1=1
    `;
    const params = [];
    
    if (partner_id) { 
        params.push(partner_id);
        query += ` AND agreements.partner_id = $${params.length}`; 
    }
    if (status) { 
        params.push(status);
        query += ` AND agreements.status = $${params.length}`; 
    }
   
    if (statut_publication) {
        params.push(statut_publication);
        query += ` AND agreements.statut_publication = $${params.length}`;
    }
    
    query += ' GROUP BY agreements.id, partners.name ORDER BY agreements.start_date DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findExpiringSoon = async() => {
    const query = `
        SELECT 
            agreements.*, 
            partners.name AS partner_name,
            (agreements.end_date - CURRENT_DATE) AS days_remaining,
            CASE 
                WHEN (agreements.end_date - CURRENT_DATE) <= 30 THEN 'urgent'
                ELSE 'warning'
            END as urgency_level
        FROM agreements
        JOIN partners ON agreements.partner_id = partners.id
        WHERE agreements.end_date >= CURRENT_DATE
        ORDER BY agreements.end_date ASC
        LIMIT 20
    `;
    const result = await pool.query(query);
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query('SELECT * FROM agreements WHERE id = $1', [id]);
    return result.rows[0];
};

exports.getFichierPdf = async(id) => {
    const result = await pool.query('SELECT fichier_pdf FROM agreements WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data) => {
    const { 
        partner_id, title, type, description, terms_conditions, 
        fichier_pdf, signature_date, start_date, end_date, 
        status, statut_publication, created_by, document_ids,
        scheduled_publish_at 
    } = data;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO agreements 
            (partner_id, title, type, description, terms_conditions, 
             fichier_pdf, signature_date, start_date, end_date, status, 
             statut_publication, scheduled_publish_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
         RETURNING *`,
        [partner_id, title, type, description, terms_conditions, 
         fichier_pdf, signature_date, start_date, end_date, 
         status || 'active', statut_publication || 'draft',
         scheduled_publish_at || null,
         created_by]
    );
        
        const agreement = result.rows[0];
        
        if (document_ids && document_ids.length > 0) {
            for (const docId of document_ids) {
                await client.query(
                    `INSERT INTO agreement_documents (agreement_id, document_id) 
                     VALUES ($1, $2)`,
                    [agreement.id, docId]
                );
            }
        }
        
        await client.query('COMMIT');
        return agreement;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.update = async(id, data, userId, ip) => {
    const { 
        partner_id, title, type, description, terms_conditions, 
        fichier_pdf, signature_date, start_date, end_date, 
        status, statut_publication, document_ids,
        scheduled_publish_at 
    } = data;
    
    return withAuditContext(userId, ip, async(client) => {
        let query = `UPDATE agreements SET 
            title=$1, type=$2, description=$3, 
            terms_conditions=$4, fichier_pdf=$5, signature_date=$6, 
            start_date=$7, end_date=$8, status=$9`;
        
        const params = [
            title, type, description, terms_conditions, 
            fichier_pdf, signature_date, start_date, end_date, 
            status
        ];

        let paramIndex = 10;

        if (partner_id) {
            query += `, partner_id = $${paramIndex}`;
            params.push(partner_id);
            paramIndex++;
        }

        if (statut_publication !== undefined) {
            query += `, statut_publication = $${paramIndex}`;
            params.push(statut_publication);
            paramIndex++;
        }
        if (scheduled_publish_at !== undefined) {
        query += `, scheduled_publish_at = $${paramIndex}`;
        params.push(scheduled_publish_at);
        paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(id);
        
        const result = await client.query(query, params);
        
        if (result.rows.length === 0) return null;
        
        if (document_ids !== undefined) {
            await client.query(
                'DELETE FROM agreement_documents WHERE agreement_id = $1',
                [id]
            );
            
            if (document_ids && document_ids.length > 0) {
                for (const docId of document_ids) {
                    await client.query(
                        `INSERT INTO agreement_documents (agreement_id, document_id) 
                         VALUES ($1, $2)`,
                        [id, docId]
                    );
                }
            }
        }
        
        return result.rows[0];
    });
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM agreements WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};

exports.publishScheduledDue = async() => {
    const result = await pool.query(
        `UPDATE agreements
         SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id, title`
    );
    return result.rows;
};

exports.publish = async(id) => {
    const result = await pool.query(
        `UPDATE agreements 
         SET statut_publication='published', 
             published_at=NOW(),
             scheduled_publish_at=NULL
         WHERE id=$1 
         RETURNING *`, 
        [id]
    );
    return result.rows[0];
};
module.exports = exports;