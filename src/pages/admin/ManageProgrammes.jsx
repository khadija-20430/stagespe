import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Languages, X, Save, Loader2, CalendarClock } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DocumentsCell from '../../components/ui/DocumentsCell.jsx';
import {
  getProgrammesAdmin, getProgrammesAdminPreview,
  createProgramme, updateProgramme, deleteProgramme,
  getProgrammeTranslations, updateProgrammeTranslations,
  publishProgramme, archiveProgramme,
} from '../../services/api.js';
import { toProgrammePayload } from '../../services/mappers.js';
import { formatScheduledDate } from '../../lib/utils.js';

const getTranslationFields = (t) => [
  { name: 'name', label: t('nom') },
  { name: 'organisme_financeur', label: t('organismeFinanceur') },
  { name: 'description', label: t('description') },
];

const emptyTranslationSet = () => ({
  en: { name: '', description: '', organisme_financeur: '' },
  ar: { name: '', description: '', organisme_financeur: '' },
});

const publicationTone = (status) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published' || value === 'publié') return 'green';
  if (value === 'archived') return 'slate';
  return 'amber';
};

const publicationLabel = (status, t) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published' || value === 'publié') return t('published');
  if (value === 'archived') return t('archived');
  return t('draft');
};

export default function ManageProgrammes() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;
  const translationFields = getTranslationFields(t);
  const [previewData, setPreviewData] = useState({});

  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getProgrammesAdminPreview(previewLang).then((rows) => {
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

  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());
    try {
      const existing = await getProgrammeTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));
    } catch (err) {
      setTranslationsError(err.message || t('admin.crud.errors.loadTranslations'));
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
      await updateProgrammeTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || t('admin.crud.errors.save'));
    } finally {
      setTranslationsSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('admin.nav.programmes') || 'Programmes'}
        icon={Layers}
        idPrefix="prog"
        fetcher={getProgrammesAdmin}
        toPayload={toProgrammePayload}
        onCreate={createProgramme}
        onUpdate={updateProgramme}
        onDelete={deleteProgramme}
        onPublish={publishProgramme}
        onArchive={archiveProgramme}
        createPermission="programmes.create"
        updatePermission="programmes.edit"
        deletePermission="programmes.delete"
        publishPermission="programmes.publish"
        columns={[
          {
            key: 'name', label: t('nom'),
            render: (i) => previewData[i.id]?.name || i.name,
          },
          { key: 'acronym', label: t('acronyme'), render: (i) => i.acronym || '—' },
          {
            key: 'organismeFinanceur', label: t('organismeFinanceur'),
            render: (i) => previewData[i.id]?.organismeFinanceur || i.organismeFinanceur || '—',
          },
          {
            key: 'documents',
            label: t('documentsSection', { defaultValue: 'Documents' }),
            render: (i) => <DocumentsCell documents={i.documents} />,
          },
          {
            key: 'statut_publication',
            label: t('statut'),
            render: (item) => {
              const status = item.statutPublication || item.statut_publication || 'draft';
              return (
                <div className="flex flex-col gap-0.5">
                  <Badge tone={publicationTone(status)}>
                    {publicationLabel(status, t)}
                  </Badge>
                  {status === 'draft' && item.scheduledPublishAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {t('programme', { defaultValue: 'Programmé' })} : {formatScheduledDate(item.scheduledPublishAt)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'translations', label: t('traductions'),
            render: (i) => (
              <button type="button" onClick={() => openTranslations(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('admin.crud.viewEditTranslations')}>
                <Languages size={18} />
              </button>
            ),
          },
        ]}
        fields={[
          { name: 'name', label: t('nom'), type: 'text', required: true },
          { name: 'acronym', label: t('acronyme'), type: 'text' },
          { name: 'organismeFinanceur', label: t('organismeFinanceur'), type: 'text' },
          { name: 'description', label: t('description'), type: 'textarea' },
          { name: 'siteWeb', label: t('siteWeb'), type: 'text' },
          {
            name: 'scheduledPublishAt',
            label: t('programmerPublication', { defaultValue: 'Programmer la publication' }),
            type: 'datetime-local',
  help: t('programmerPublicationHelp', { defaultValue: 'Laisser vide pour publier manuellement.' }),
          },
        ]}
      />

      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                {t('traductions_titre_modal')} — {translationsItem.name}
              </h3>
              <button type="button" onClick={closeTranslations} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {['en', 'ar'].map((lang) => (
                  <button key={lang} type="button" onClick={() => setTranslationsTab(lang)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      translationsTab === lang ? 'bg-cobalt text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
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
                translationFields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {f.label}
                    </label>
                    <textarea
                      dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                      rows={f.name === 'name' ? 2 : 4}
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
              <button type="button" onClick={closeTranslations} disabled={translationsSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium">
                {t('annuler')}
              </button>
              <button type="button" onClick={saveTranslations} disabled={translationsSaving || translationsLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5">
                {translationsSaving ? '...' : (<><Save size={16} /> {t('enregistrer')}</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}