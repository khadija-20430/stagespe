// lib/i18n.js
const pool = require('../db');
const { translateBatch } = require('./googleTranslate');

const TRANSLATION_CONFIG = {
  project: { table: 'project_translations', fk: 'project_id', fields: ['title', 'description', 'objectives', 'target_groups'] },
  partner: { table: 'partner_translations', fk: 'partner_id', fields: ['name', 'official_name', 'description', 'cooperation_areas'] },
  call: { table: 'call_translations', fk: 'call_id', fields: ['title', 'description', 'objectives', 'eligibility', 'beneficiaries'] },
  mobility: { table: 'mobility_translations', fk: 'mobility_id', fields: ['title', 'description', 'conditions', 'target_audience', 'application_procedure', 'selection_criteria'] },
  news: { table: 'news_translations', fk: 'news_id', fields: ['title', 'summary', 'description', 'quote_text'] },
  project_deliverable: { table: 'project_deliverable_translations', fk: 'deliverable_id', fields: ['description'] },
  project_result: { table: 'project_result_translations', fk: 'result_id', fields: ['description'] },
agreement: { table: 'agreement_translations', fk: 'agreement_id', fields: ['title', 'description', 'terms_conditions', 'type'] },document: { table: 'document_translations', fk: 'document_id', fields: ['titre', 'description'] },
};

const TARGET_LANGUAGES = ['en', 'ar']; // fr par defaut donc pas besoin de traduction


async function getLanguageId(langCode) {
  if (!langCode || langCode === 'fr') return null; 
  const result = await pool.query('SELECT id FROM languages WHERE code = $1 AND is_active = TRUE', [langCode]);
  return result.rows[0] ? result.rows[0].id : null;
}

// lecture d une liste de resultats 
async function translateList(entityType, rows, langCode) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config || !langCode || langCode === 'fr' || rows.length === 0) return rows;

  const languageId = await getLanguageId(langCode);
  if (!languageId) return rows; // si langue inconnue ou inactive on garde fr

  const ids = rows.map((r) => r.id);
  const result = await pool.query(
    `SELECT * FROM ${config.table} WHERE ${config.fk} = ANY($1) AND language_id = $2`,
    [ids, languageId]
  );

  const byId = {};
  for (const row of result.rows) byId[row[config.fk]] = row;

  return rows.map((row) => {
    const t = byId[row.id];
    if (!t) return row; // si pas encore traduit on garde fr aussi
    const merged = { ...row };
    for (const field of config.fields) {
      if (t[field]) merged[field] = t[field]; // on remplace seulement si traduction existante
    }
    return merged;
  });
}

// lecture d un seul resultat 
async function translateOne(entityType, row, langCode) {
  if (!row) return row;
  const [translated] = await translateList(entityType, [row], langCode);
  return translated;
}

async function translateRelatedField(rows, langCode, { entityType, idField, nameField, sourceField = 'name' }) {
  if (!langCode || langCode === 'fr' || rows.length === 0) return rows;

  const ids = [...new Set(rows.map((r) => r[idField]).filter(Boolean))];
  if (ids.length === 0) return rows;

  const fakeRows = ids.map((id) => ({ id }));
  const translated = await translateList(entityType, fakeRows, langCode);

  const byId = {};
  translated.forEach((r) => { byId[r.id] = r[sourceField]; });

  return rows.map((row) => {
    const translatedName = byId[row[idField]];
    if (!translatedName) return row; 
    return { ...row, [nameField]: translatedName };
  });
}
// ecriture des traductions (directement apres create ou update)
async function upsertTranslations(entityType, entityId, translationsInput) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config || !translationsInput) return;

  for (const langCode of Object.keys(translationsInput)) {
    if (langCode === 'fr') continue; 
    const languageId = await getLanguageId(langCode);
    if (!languageId) continue;

    const fieldsInput = translationsInput[langCode] || {};
    const mainField = config.fields[0]; 
    const columns = [config.fk, 'language_id', ...config.fields];
    const values = [
      entityId,
      languageId,
      ...config.fields.map((f) => (f === mainField ? (fieldsInput[f] || '') : fieldsInput[f] ?? null)),
    ];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const updateSet = config.fields.map((f) => `${f} = EXCLUDED.${f}`).join(', ');

    await pool.query(
      `INSERT INTO ${config.table} (${columns.join(', ')})
       VALUES (${placeholders})
       ON CONFLICT (${config.fk}, language_id)
       DO UPDATE SET ${updateSet}, updated_at = NOW()`,
      values
    );
  }
}

// traduction automatique via MyMemory (apres create/update)
async function autoTranslateAndSave(entityType, entityId, frenchData) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config) return;

  for (const targetLang of TARGET_LANGUAGES) {
    const languageId = await getLanguageId(targetLang);
    if (!languageId) continue;

    const sourceTexts = config.fields.map((f) => frenchData[f] || null);

    let translatedTexts;
    try {
      translatedTexts = await translateBatch(sourceTexts, targetLang, 'fr');
    } catch (err) {
      console.error(`[I18N] Traduction ${targetLang} échouée pour ${entityType}#${entityId}:`, err.message);
      continue; // une langue en echec ne bloque pas les autres
    }

    const translationPayload = {};
    config.fields.forEach((f, i) => {
      if (translatedTexts[i]) translationPayload[f] = translatedTexts[i];
    });

    if (Object.keys(translationPayload).length > 0) {
      await upsertTranslations(entityType, entityId, { [targetLang]: translationPayload });
    }
  }
}


async function getAllTranslations(entityType, entityId) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config) return {};
  const result = await pool.query(
    `SELECT t.*, l.code AS lang_code FROM ${config.table} t
     JOIN languages l ON t.language_id = l.id
     WHERE t.${config.fk} = $1`,
    [entityId]
  );
  const grouped = {};
  for (const row of result.rows) {
    grouped[row.lang_code] = {};
    for (const field of config.fields) grouped[row.lang_code][field] = row[field];
  }
  return grouped;
}

async function deleteTranslations(entityType, entityId) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config) return;
  await pool.query(`DELETE FROM ${config.table} WHERE ${config.fk} = $1`, [entityId]);
}


module.exports = {
  translateList,
  translateOne,
  translateRelatedField,
  upsertTranslations,
  autoTranslateAndSave,
  getAllTranslations,
  deleteTranslations,
};