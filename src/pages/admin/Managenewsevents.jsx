import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper, Languages, X, Save, Loader2, CalendarClock } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';

import {
  getActualitesAdmin,
  getActualitesAdminPreview,
  createActualite,
  updateActualite,
  deleteActualite,
  publishActualite,
  archiveActualite,
  getProjets,
  getActualiteTranslations,
  updateActualiteTranslations,
} from '../../services/api.js';

import { toActualitePayload } from '../../services/mappers.js';
import { formatScheduledDate } from '../../lib/utils.js';

const NEWS_EVENT_TYPES = [
  'news',
  'event',
  'workshop',
  'meeting',
  'testimonial',
];

const publicationStatusTone = (status) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published' || value === 'publié' || value === 'منشور') return 'green';
  if (value === 'archived' || value === 'مؤرشف') return 'slate';
  return 'amber';
};

const publicationStatusLabel = (status, t) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published' || value === 'publié' || value === 'منشور') return t('statut_publie');
  if (value === 'archived' || value === 'مؤرشف') return t('statut_archive');
  return t('statut_brouillon');
};

const TRANSLATION_FIELDS = [
  { name: 'title', labelKey: 'titre' },
  { name: 'summary', labelKey: 'summary' },
  { name: 'description', labelKey: 'description' },
  { name: 'quote_text', labelKey: 'quoteText' },
];

const emptyTranslationSet = () => ({
  en: { title: '', summary: '', description: '', quote_text: '' },
  ar: { title: '', summary: '', description: '', quote_text: '' },
});

export default function ManageNewsEvents() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [projects, setProjects] = useState([]);
  const [previewData, setPreviewData] = useState({});

  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  useEffect(() => {
    getProjets()
      .then(setProjects)
      .catch((err) => {
        console.error('Erreur récupération projets:', err);
      });
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getActualitesAdminPreview(previewLang).then((rows) => {
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
      const existing = await getActualiteTranslations(item.id);
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
      await updateActualiteTranslations(translationsItem.id, translationsDraft);
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
        title={t('newsEvents')}
        icon={Newspaper}
        idPrefix="news-event"
        fetcher={getActualitesAdmin}
        toPayload={toActualitePayload}
        onCreate={createActualite}
        onUpdate={updateActualite}
        onDelete={deleteActualite}
        onPublish={publishActualite}
        onArchive={archiveActualite}
        createPermission="news_events.create"
        updatePermission="news_events.edit"
        deletePermission="news_events.delete"
        publishPermission="news_events.publish"
        columns={[
          {
            key: 'title',
            label: t('title'),
            render: (item) => previewData[item.id]?.title || item.title,
          },
          {
            key: 'type',
            label: t('type'),
            render: (item) => <Badge tone="cobalt">{t(item.type)}</Badge>,
          },
          {
            key: 'eventDate',
            label: t('eventDate'),
            render: (item) => item.eventDate || item.event_date || '—',
          },
          {
            key: 'location',
            label: t('location'),
            render: (item) => item.location || '—',
          },
          {
            key: 'isFeatured',
            label: t('featured'),
            render: (item) => {
              const featured = item.isFeatured ?? item.is_featured ?? false;
              return (
                <Badge tone={featured ? 'green' : 'slate'}>
                  {featured ? t('yes') : t('no')}
                </Badge>
              );
            },
          },
          {
            key: 'statut_publication',
            label: t('status'),
            render: (item) => {
              const status = item.statut_publication || 'draft';
              return (
                <div className="flex flex-col gap-0.5">
                  <Badge tone={publicationStatusTone(status)}>
                    {publicationStatusLabel(status, t)}
                  </Badge>
                  {status === 'draft' && item.scheduledPublishAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {t('scheduled', { defaultValue: 'Programmé' })} : {formatScheduledDate(item.scheduledPublishAt)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'translations',
            label: t('traductions'),
            render: (item) => (
              <button
                type="button"
                onClick={() => openTranslations(item)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('voir_modifier_traductions')}
              >
                <Languages size={18} />
              </button>
            ),
          },
        ]}
        fields={[
          {
            name: 'title',
            label: t('title'),
            type: 'text',
            required: true,
            help: t('newsEventsForm.titleHelp', { defaultValue: "Titre de l'actualité ou événement" }),
          },
          {
            name: 'type',
            label: t('type'),
            type: 'select',
            required: true,
            options: NEWS_EVENT_TYPES.map((type) => ({ value: type, label: t(type) })),
            help: t('newsEventsForm.typeHelp', { defaultValue: 'Type de contenu' }),
          },
          {
            name: 'summary',
            label: t('summary'),
            type: 'textarea',
            help: t('newsEventsForm.summaryHelp', { defaultValue: "Résumé court de l'actualité" }),
          },
          {
            name: 'description',
            label: t('description'),
            type: 'textarea',
            help: t('newsEventsForm.descriptionHelp', { defaultValue: 'Description complète' }),
          },
          {
            name: 'projectId',
            label: t('project'),
            type: 'select',
            options: [
              { value: '', label: t('newsEventsForm.noProject', { defaultValue: 'Aucun projet' }) },
              ...projects.map((project) => ({
                value: project.id,
                label: project.titre || project.title,
              })),
            ],
            help: t('newsEventsForm.projectHelp', { defaultValue: 'Projet associé' }),
          },
          {
            name: 'eventDate',
            label: t('eventDate'),
            type: 'date',
            help: t('newsEventsForm.dateHelp', { defaultValue: 'Format : YYYY-MM-DD — Exemple : 2026-05-19' }),
          },
          {
            name: 'endDate',
            label: t('endDate'),
            type: 'date',
            help: t('newsEventsForm.dateHelp', { defaultValue: 'Format : YYYY-MM-DD — Exemple : 2026-05-19' }),
          },
          {
            name: 'location',
            label: t('location'),
            type: 'text',
            help: t('newsEventsForm.locationHelp', { defaultValue: "Lieu de l'événement" }),
          },
          {
            name: 'imageUrl',
            label: t('imageUrl'),
            type: 'text',
            help: t('newsEventsForm.imageHelp', { defaultValue: "URL de l'image" }),
          },
          {
            name: 'isFeatured',
            label: t('featured'),
            type: 'select',
            options: [
              { value: 'false', label: t('no') },
              { value: 'true', label: t('yes') },
            ],
            help: t('newsEventsForm.featuredHelp', { defaultValue: "Mettre en avant sur la page d'accueil" }),
          },
          {
            name: 'authorName',
            label: t('authorName'),
            type: 'text',
            required: (values) => values.type === 'testimonial',
            help: t('newsEventsForm.authorNameHelp', { defaultValue: "Nom de l'auteur" }),
          },
          {
            name: 'authorRole',
            label: t('authorRole'),
            type: 'text',
            required: (values) => values.type === 'testimonial',
            help: t('newsEventsForm.authorRoleHelp', { defaultValue: "Rôle/position de l'auteur" }),
          },
          {
            name: 'authorPhotoUrl',
            label: t('authorPhotoUrl'),
            type: 'text',
            help: t('newsEventsForm.authorPhotoHelp', { defaultValue: "URL de la photo de l'auteur" }),
          },
          {
            name: 'quoteText',
            label: t('quoteText'),
            type: 'textarea',
            help: t('newsEventsForm.quoteHelp', { defaultValue: 'Citation ou témoignage' }),
          },
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
                {t('traductions_titre_modal')} — {translationsItem.title}
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