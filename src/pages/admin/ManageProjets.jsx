import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Languages, X, Save, Loader2 } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getProjetsAdmin, getProjetsAdminPreview, createProjet, updateProjet, deleteProjet, getProgrammes,
  getPartenaires, getProjetTranslations, updateProjetTranslations,
  publishProjet, archiveProjet,
} from '../../services/api.js';
import { toProjetPayload } from '../../services/mappers.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

const PREVIEW_LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Titre' },
  { name: 'description', label: 'Description' },
  { name: 'objectives', label: 'Objectifs' },
  { name: 'target_groups', label: 'Groupes cibles' },
];

const emptyTranslationSet = () => ({
  en: { title: '', description: '', objectives: '', target_groups: '' },
  ar: { title: '', description: '', objectives: '', target_groups: '' },
});

export default function ManageProjets() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [previewLang, setPreviewLang] = useState('fr');
  const [previewData, setPreviewData] = useState({});

  // ---- Modale de traduction manuelle ----
  const [translationsItem, setTranslationsItem] = useState(null); // le projet en cours d'édition, ou null
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getPartenaires().then(setPartenaires);
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getProjetsAdminPreview(previewLang).then((rows) => {
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

  const partnerName = (id) => {
    if (!id) return '—';
    const partner = partenaires.find((p) => String(p.id) === String(id));
    return partner ? partner.nom : '—';
  };

  // ---- Ouvrir la modale de traduction ----
  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getProjetTranslations(item.id); // { en: {...}, ar: {...} } (langues absentes si jamais traduites)
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
      await updateProjetTranslations(translationsItem.id, translationsDraft);
      refreshPreview(); // met à jour l'aperçu du tableau si on est en train de le regarder
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setTranslationsSaving(false);
    }
  };

  return (
    <div>
      {/* Sélecteur d'aperçu — lecture seule, ne touche jamais aux données réelles éditées */}
      <div className="mb-4 flex items-center gap-2">
        <Languages size={16} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          Aperçu traduction :
        </span>
        {PREVIEW_LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setPreviewLang(l.code)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              previewLang === l.code
                ? 'bg-cobalt text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <CrudManager
        title={t('projects')}
        icon={FlaskConical}
        idPrefix="proj"
        fetcher={getProjetsAdmin}
        toPayload={toProjetPayload}
        onCreate={createProjet}
        onUpdate={updateProjet}
        onDelete={deleteProjet}
        onPublish={publishProjet}
        onArchive={archiveProjet}
        columns={[
          { key: 'titre', label: t('titre'), required: true,
            render: (i) => previewData[i.id]?.titre || i.titre },
          { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
          { key: 'statut', label: t('statut'),
            render: (i) => <Badge tone={projectStatusTone(i.statut)}>{t(`${i.statut}`)}</Badge> },
          { key: 'budget', label: t('budget'),
            render: (i) => i.budget != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget) : '—' },
          { key: 'coordinator_partner_id', label: t('coordinateur'),
            render: (i) => partnerName(i.coordinator_partner_id) },
          { key: 'statut_publication', label: t('statutPublication'),
            render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{t(`${i.statut_publication}`)}</Badge> },
          { key: 'translations', label: 'Traductions',
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
        ]}
        fields={[
          { name: 'titre', label: t('titre'), type: 'text', required: true },
          { name: 'acronyme', label: t('acronyme'), type: 'text' },
          { name: 'codeReference', label: t('codeReference'), type: 'text' },
          { name: 'programmeId', label: t('programme'), type: 'select',
            options: programmes.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'statut', label: t('statut'), type: 'select',
            options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
          { name: 'budget', label: t('budget'), type: 'number' },
          { name: 'debut', label: t('debut'), type: 'date' },
          { name: 'fin', label: t('fin'), type: 'date' },
          { name: 'coordinator_partner_id', label: t('coordinator_partner_id'), type: 'select',
            options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
          { name: 'siteWeb', label: t('siteWeb'), type: 'text' },
          { name: 'resume', label: t('resume'), type: 'textarea' },
          { name: 'objectifs', label: t('objectifs'), type: 'textarea' },
          { name: 'groupesCibles', label: t('groupesCibles'), type: 'textarea' },
          { name: 'resultats', label: t('resultats'), type: 'list' },
          { name: 'livrables', label: t('livrables'), type: 'list' },
          { name: 'misEnAvant', label: t('misEnAvant'), type: 'select',
            options: [{ value: 'true', label: t('yes') }, { value: 'false', label: t('no') }] },
        ]}
      />

      {/* =========================================================
          MODALE — TRADUCTIONS MANUELLES (EN / AR)
          Indépendante de la modale d'édition de CrudManager.
      ========================================================== */}
      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                Traductions — {translationsItem.titre}
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
    </div>
  );
}