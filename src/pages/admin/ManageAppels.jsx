import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Languages, X, Save, Loader2, CalendarClock } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DocumentsCell from '../../components/ui/DocumentsCell.jsx';
import {
  getAppelsAdmin, getAppelsAdminPreview, createAppel, updateAppel, deleteAppel,
  publishAppel, archiveAppel,
  getProgrammes, getActionTypes, getCountries, getThemes,
  getCallTranslations, updateCallTranslations,
} from '../../services/api.js';
import { toAppelPayload } from '../../services/mappers.js';
import { CALL_STATUS, callStatusTone } from '../../lib/enums.js';
import { formatScheduledDate } from '../../lib/utils.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

const TRANSLATION_FIELDS = [
  { name: 'title', labelKey: 'titre' },
  { name: 'description', labelKey: 'description' },
  { name: 'objectives', labelKey: 'objectifs' },
];

const emptyTranslationSet = () => ({
  en: { title: '', description: '', objectives: '' },
  ar: { title: '', description: '', objectives: '' },
});

export default function ManageAppels() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [programmes, setProgrammes] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [themes, setThemes] = useState([]);
  const [previewData, setPreviewData] = useState({});

  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getActionTypes().then(setActionTypes);
    getCountries(previewLang).then(setCountries);
    getThemes(previewLang).then(setThemes);
  }, [previewLang]);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getAppelsAdminPreview(previewLang).then((rows) => {
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
  }, [previewLang]);

  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getCallTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));
    } catch (err) {
      setTranslationsError(err.message || t('erreur_chargement_traductions'));
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
      await updateCallTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || t('erreur_enregistrement_traductions'));
    } finally {
      setTranslationsSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('admin.nav.calls')}
        icon={Megaphone}
        idPrefix="app"
        fetcher={getAppelsAdmin}
        toPayload={toAppelPayload}
        onCreate={createAppel}
        onUpdate={updateAppel}
        onDelete={deleteAppel}
        onPublish={publishAppel}
        onArchive={archiveAppel}
        createPermission="calls.create"
        updatePermission="calls.edit"
        deletePermission="calls.delete"
        publishPermission="calls.publish"
        columns={[
          { key: 'titre', label: t('titre'), required: true,
            render: (i) => previewData[i.id]?.titre || i.titre },
          { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
          { key: 'themes', label: t('themes'),
            render: (i) => (previewData[i.id]?.themeNames ?? i.themeNames ?? []).join(', ') || '—' },
          { key: 'eligibility', label: t('pays'),
            render: (i) => (previewData[i.id]?.paysEligibles ?? i.paysEligibles ?? []).join(', ') || '—' },
          { key: 'status', label: t('status'),
            render: (i) => <Badge tone={callStatusTone(i.status)}>{t(`enums.callStatus.${i.status}`, { defaultValue: i.status })}</Badge> },
          { key: 'dateLimite', label: t('dateLimite'),
            render: (i) => i.dateLimite ? new Date(i.dateLimite).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'en' ? 'en-US' : 'fr-FR') : '—' },
          {
            key: 'statut_publication',
            label: t('statutPublication'),
            render: (i) => {
              const status = i.statut_publication || 'draft';
              return (
                <div className="flex flex-col gap-0.5">
                  <Badge tone={publicationStatusTone(status)}>{t(status, { defaultValue: status })}</Badge>
                  {status === 'draft' && i.scheduledPublishAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {t('scheduled', { defaultValue: 'Programmé' })} : {formatScheduledDate(i.scheduledPublishAt)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'documents',
            label: t('documentsSection', { defaultValue: 'Documents' }),
            render: (i) => <DocumentsCell documents={i.documents} />,
          },
          { key: 'translations', label: t('traductions'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openTranslations(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('voir_modifier_traductions')}
              >
                <Languages size={18} />
              </button>
            ) },
        ]}
        fields={[
          { name: 'titre', label: t('titre'), type: 'text', required: true },
          { name: 'programmeId', label: t('programme'), type: 'select',
            options: programmes.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'organismeFinanceur', label: t('organismeFinanceur'), type: 'text' },
          { name: 'paysEligiblesIds', label: t('pays'), type: 'multiselect',
            options: countries.map((c) => ({ value: c.id, label: c.name })) },
          { name: 'themeIds', label: t('themes'), type: 'multiselect',
            options: themes.map((th) => ({ value: th.id, label: th.name })) },
          { name: 'typeActionId', label: t('typeAction'), type: 'select',
            options: actionTypes.map((a) => ({ value: a.id, label: a.label })) },
          { name: 'datePublication', label: t('datePublication'), type: 'date' },
          { name: 'dateLimite', label: t('dateLimite'), type: 'date' },
          { name: 'budgetDisponible', label: t('budget'), type: 'number' },
          { name: 'tauxFinancement', label: t('tauxFinancement'), type: 'number' },
          { name: 'publicCible', label: t('publicCible'), type: 'text' },
          { name: 'lienOfficiel', label: t('lienOfficiel'), type: 'text' },
          { name: 'personneContact', label: t('personneContact'), type: 'text' },
          { name: 'resume', label: t('resume'), type: 'textarea' },
          {
            name: 'scheduledPublishAt',
            label: t('programmerPublication', { defaultValue: 'Programmer la publication' }),
            type: 'datetime-local',
            help: t('programmerPublicationHelp', { defaultValue: 'Laisser vide pour publier manuellement.' }),
          },
        ]}
      />

      {/* ================= MODALE TRADUCTIONS ================= */}
      {translationsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeTranslations}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                {t('traductions_titre_modal')} — {translationsItem.titre}
              </h3>
              <button
                type="button"
                onClick={closeTranslations}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* ONGLETS LANGUE */}
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

            {/* CONTENU */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {translationsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                TRANSLATION_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t(f.labelKey, { defaultValue: f.name })}
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

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={closeTranslations}
                disabled={translationsSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                {t('annuler')}
              </button>
              <button
                type="button"
                onClick={saveTranslations}
                disabled={translationsSaving || translationsLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5"
              >
                {translationsSaving ? '...' : (<><Save size={16} /> {t('enregistrer')}</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}