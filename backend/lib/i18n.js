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
agreement: { table: 'agreement_translations', fk: 'agreement_id', fields: ['title', 'description', 'terms_conditions'] },
};

const TARGET_LANGUAGES = ['en', 'ar']; // le français est déjà la langue de base, jamais traduit

async function getLanguageId(langCode) {
  if (!langCode || langCode === 'fr') return null; // le français est déjà dans la table principale
  const result = await pool.query('SELECT id FROM languages WHERE code = $1 AND is_active = TRUE', [langCode]);
  return result.rows[0] ? result.rows[0].id : null;
}

// LECTURE — pour une LISTE de résultats (une seule requête groupée, pas de boucle)
async function translateList(entityType, rows, langCode) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config || !langCode || langCode === 'fr' || rows.length === 0) return rows;

  const languageId = await getLanguageId(langCode);
  if (!languageId) return rows; // langue inconnue/inactive -> on garde le français

  const ids = rows.map((r) => r.id);
  const result = await pool.query(
    `SELECT * FROM ${config.table} WHERE ${config.fk} = ANY($1) AND language_id = $2`,
    [ids, languageId]
  );

  const byId = {};
  for (const row of result.rows) byId[row[config.fk]] = row;

  return rows.map((row) => {
    const t = byId[row.id];
    if (!t) return row; // pas encore traduit -> on garde le français
    const merged = { ...row };
    for (const field of config.fields) {
      if (t[field]) merged[field] = t[field]; // on remplace SEULEMENT si la traduction existe
    }
    return merged;
  });
}

// LECTURE — pour UN SEUL résultat (fiche détail)
async function translateOne(entityType, row, langCode) {
  if (!row) return row;
  const [translated] = await translateList(entityType, [row], langCode);
  return translated;
}

// ÉCRITURE — enregistre les traductions (manuelles OU générées automatiquement)
// attend : { en: { title: '...', description: '...' }, ar: { title: '...' } }
async function upsertTranslations(entityType, entityId, translationsInput) {
  const config = TRANSLATION_CONFIG[entityType];
  if (!config || !translationsInput) return;

  for (const langCode of Object.keys(translationsInput)) {
    if (langCode === 'fr') continue; // le français ne passe jamais par ici
    const languageId = await getLanguageId(langCode);
    if (!languageId) continue;

    const fieldsInput = translationsInput[langCode] || {};
    const mainField = config.fields[0]; // ex: 'title' ou 'name' -> NOT NULL, donc jamais vide
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

// TRADUCTION AUTOMATIQUE — appelée après un create/update en français,
// génère EN + AR via Google Translate et les enregistre via upsertTranslations
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
      continue; // une langue en échec ne bloque pas l'autre
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

// Pour préremplir le formulaire d'édition admin (toutes langues d'un coup)
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
  upsertTranslations,
  autoTranslateAndSave,
  getAllTranslations,
  deleteTranslations,
};