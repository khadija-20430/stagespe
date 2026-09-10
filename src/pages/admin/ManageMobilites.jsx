import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane, Languages, Globe2, X, Save, Loader2 } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getMobilitesAdmin, getMobilitesAdminPreview, createMobilite, updateMobilite, deleteMobilite,
  publishMobilite, archiveMobilite,
  getProgrammes, getCountries, getPartenaires, getInstitutions, getLanguages,
  getMobiliteById, updateMobilityLanguageRequirements,
  getMobilitiesTranslations, updateMobilitiesTranslations,
} from '../../services/api.js';
import { toMobilitePayload } from '../../services/mappers.js';
import { MOBILITY_TYPE } from '../../lib/enums.js';

const MOBILITY_STATUS = ['open', 'closed', 'upcoming'];
const mobilityStatusTone = (s) => (s === 'open' ? 'green' : s === 'upcoming' ? 'amber' : 'slate');
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Titre' },
  { name: 'description', label: 'Description' },
  { name: 'conditions', label: 'Conditions' },
  { name: 'target_audience', label: 'Public cible' },
  { name: 'application_procedure', label: 'Procédure de candidature' },
  { name: 'selection_criteria', label: 'Critères de sélection' },
];

const emptyTranslationSet = () => ({
  en: { title: '', description: '', conditions: '', target_audience: '', application_procedure: '', selection_criteria: '' },
  ar: { title: '', description: '', conditions: '', target_audience: '', application_procedure: '', selection_criteria: '' },
});

export default function ManageMobilites() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  // ---- Données de référence ----
  const [programmes, setProgrammes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [previewData, setPreviewData] = useState({});

  // ---- Modale de traduction manuelle ----
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  // ---- Modale langues requises ----
  const [langItem, setLangItem] = useState(null);
  const [langDraft, setLangDraft] = useState([]); // [{ languageId, minLevel }]
  const [langLoading, setLangLoading] = useState(false);
  const [langSaving, setLangSaving] = useState(false);

  // ---- Chargement initial des référentiels (un seul effet) ----
  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getCountries().then(setCountries);
    getPartenaires().then(setPartenaires);
    getInstitutions().then(setInstitutions);
    getLanguages().then(setLanguages);
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getMobilitesAdminPreview(previewLang).then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.id] = r; });
      setPreviewData(map);
    });
  };

  useEffect(() => {
    if (previewLang === 'fr') {
      setPreviewData({});
      return;
    }
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLang]);

  // ---- Traductions ----
  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getMobilitiesTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));
    } catch (err) {
      setTranslationsError(err.message || 'Erreur de chargement des traductions');
    } finally {
      setTranslationsLoading(false);
    }
  };

  const closeTranslations = () => {
    if (translationsSaving) return;
    setTranslationsItem(null);
  };

  const setTranslationField = (lang, field, value) => {
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  const saveTranslations = async () => {
    setTranslationsSaving(true);
    setTranslationsError('');

    try {
      await updateMobilitiesTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setTranslationsSaving(false);
    }
  };

  // ---- Langues requises ----
  const openLanguages = async (item) => {
    setLangItem(item);
    setLangLoading(true);
    try {
      const fresh = await getMobiliteById(item.id);
      setLangDraft(fresh.languageRequirements.map((r) => ({ languageId: r.languageId, minLevel: r.minLevel || '' })));
    } finally {
      setLangLoading(false);
    }
  };

  const closeLanguages = () => {
    if (langSaving) return;
    setLangItem(null);
  };

  const toggleLanguage = (languageId) => {
    setLangDraft((prev) =>
      prev.some((r) => r.languageId === languageId)
        ? prev.filter((r) => r.languageId !== languageId)
        : [...prev, { languageId, minLevel: '' }]
    );
  };

  const setLangLevel = (languageId, minLevel) => {
    setLangDraft((prev) => prev.map((r) => (r.languageId === languageId ? { ...r, minLevel } : r)));
  };

  const saveLanguages = async () => {
    setLangSaving(true);
    try {
      await updateMobilityLanguageRequirements(langItem.id, langDraft);
      setLangItem(null);
    } finally {
      setLangSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('mobility')}
        icon={Plane}
        idPrefix="mob"
        fetcher={getMobilitesAdmin}
        toPayload={toMobilitePayload}
        onCreate={createMobilite}
        onUpdate={updateMobilite}
        onDelete={deleteMobilite}
        onPublish={publishMobilite}
        onArchive={archiveMobilite}
        createPermission="mobility.create"
        updatePermission="mobility.edit"
        deletePermission="mobility.delete"
        publishPermission="mobility.publish"
        columns={[
          { key: 'title', label: t('title'),
            render: (i) => previewData[i.id]?.title || i.title },
          { key: 'paysDestination', label: t('pays') },
          { key: 'type', label: t('type'),
            render: (i) => <Badge tone="navy">{t(`${i.type}`)}</Badge> },
          { key: 'status', label: t('status'),
            render: (i) => <Badge tone={mobilityStatusTone(i.status)}>{t(`${i.status}`)}</Badge> },
          { key: 'places', label: t('places') },
          { key: 'statut_publication', label: t('statutPublication'),
            render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{t(`${i.statut_publication}`)}</Badge> },
          { key: 'translations', label: t('traductions'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openTranslations(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title="Voir / modifier les traductions"
              >
                <Languages size={18} />
              </button>
            ) },
          { key: 'languages', label: t('languesRequises'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openLanguages(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title="Langues requises"
              >
                <Globe2 size={18} />
              </button>
            ) },
        ]}
        fields={[
          { name: 'title', label: t('title'), type: 'text', required: true },
          { name: 'type', label: t('type'), required: true, type: 'select',
            options: MOBILITY_TYPE.map((code) => ({ value: code, label: t(`${code}`) })) },
          { name: 'programmeId', label: t('programme'), type: 'select',
            options: programmes.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'paysDestinationId', label: t('pays'), type: 'select',
            options: countries.map((c) => ({ value: c.id, label: c.name })) },
          { name: 'partnerId', label: t('partenaire'), type: 'select',
            options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
          { name: 'institutionId', label: t('institutionAccueil'), type: 'select',
            options: institutions.map((inst) => ({ value: inst.id, label: inst.nom })) },
          { name: 'duree', label: t('duree'), type: 'text' },
          { name: 'periode', label: t('periode'), type: 'text' },
          { name: 'places', label: t('places'), type: 'number' },
          { name: 'dateLimite', label: t('dateLimite'), type: 'date' },
          { name: 'status', label: t('status'), type: 'select',
            options: MOBILITY_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
          { name: 'publicCible', label: t('publicCible'), type: 'textarea' },
          { name: 'conditions', label: t('conditions'), type: 'textarea' },
          { name: 'financement', label: t('financement'), type: 'textarea' },
          { name: 'lienCandidature', label: t('lienCandidature'), type: 'text' },
          { name: 'personneContact', label: t('personneContact'), type: 'text' },
          { name: 'emailContact', label: t('emailContact'), type: 'text' },
          { name: 'description', label: t('description'), type: 'textarea' },
        ]}
      />

      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                Traductions — {translationsItem.title}
              </h3>
              <button type="button" onClick={closeTranslations} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {['en', 'ar'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTranslationsTab(lang)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      translationsTab === lang
                        ? 'bg-cobalt text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {translationsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                TRANSLATION_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {f.label}
                    </label>
                    <textarea
                      dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                      rows={f.name === 'title' ? 2 : 4}
                      value={translationsDraft[translationsTab][f.name] ?? ''}
                      onChange={(e) => setTranslationField(translationsTab, f.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition"
                    />
                  </div>
                ))
              )}

              {translationsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{translationsError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={closeTranslations}
                disabled={translationsSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveTranslations}
                disabled={translationsSaving || translationsLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5"
              >
                {translationsSaving ? '...' : (<><Save size={16} /> Enregistrer</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {langItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy dark:text-white">
                Langues requises — {langItem.title}
              </h3>
              <button type="button" onClick={closeLanguages} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {langLoading ? (
              <div className="flex justify-center py-8 text-cobalt">
                <Loader2 size={28} className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {languages.map((lang) => {
                  const active = langDraft.find((r) => r.languageId === lang.id);
                  return (
                    <div key={lang.id} className="flex items-center gap-3">
                      <input type="checkbox" checked={!!active} onChange={() => toggleLanguage(lang.id)} />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{lang.name}</span>
                      {active && (
                        <input
                          type="text"
                          placeholder="Niveau min. (ex: B2)"
                          value={active.minLevel}
                          onChange={(e) => setLangLevel(lang.id, e.target.value)}
                          className="w-28 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeLanguages}
                disabled={langSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveLanguages}
                disabled={langSaving || langLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5"
              >
                {langSaving ? '...' : (<><Save size={16} /> Enregistrer</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}