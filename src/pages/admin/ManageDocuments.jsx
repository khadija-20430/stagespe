import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Eye, Download, Languages, History, X, Save, Loader2 } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';

import {
  getDocumentsAdmin,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentCategories,
  uploadFile,
  getFileUrl,
  publishDocument,
  archiveDocument,
  getDocumentsAdminPreview,
  getDocumentTranslations,
  updateDocumentTranslations,
  getDocumentRevisions,
  restoreDocumentRevision,
  getProjetsAdmin,
  getAppelsAdmin,
  getAgreementsAdmin,
  getMobilitesAdmin,
  getProgrammesAdmin,
  syncDocumentLinks,
} from '../../services/api.js';
import { toDocumentPayload } from '../../services/mappers.js';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

// Champs traduisibles — noms de colonnes réels de document_translations
const TRANSLATION_FIELDS = [
  { name: 'titre', label: 'Titre' },
  { name: 'description', label: 'Description' },
];

const emptyTranslationSet = () => ({
  en: { titre: '', description: '' },
  ar: { titre: '', description: '' },
});

const formatBytes = (bytes) => {
  if (!bytes) return '—';

  const units = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  let n = Number(bytes);

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }

  return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

const getFileName = (path) => {
  if (!path) return 'document';

  try {
    const cleanPath = String(path).split('?')[0];
    return cleanPath.split('/').pop() || 'document';
  } catch {
    return 'document';
  }
};

const downloadFile = async (path, fallbackName = 'document') => {
  try {
    const url = getFileUrl(path);

    if (!url) {
      throw new Error('Aucun fichier disponible');
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Impossible de télécharger le fichier (${response.status})`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = blobUrl;
    link.download = fallbackName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    alert(error.message || 'Erreur lors du téléchargement du fichier');
  }
};

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

export default function ManageDocuments() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [categories, setCategories] = useState([]);

  // Entités liables (projets, appels, conventions, mobilités, programmes)
  const [projects, setProjects] = useState([]);
  const [calls, setCalls] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [mobilities, setMobilities] = useState([]);
  const [programmes, setProgrammes] = useState([]);

  //  Aperçu de traduction (lecture seule, suit la langue globale du site)
  const [previewData, setPreviewData] = useState({});

  // Modale de traduction manuelle
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  // Modale d'historique des versions
  const [revisionsItem, setRevisionsItem] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    getDocumentCategories()
      .then(setCategories)
      .catch((err) => console.error('Erreur récupération catégories:', err));
  }, []);

  useEffect(() => {
    getProjetsAdmin().then(setProjects).catch(console.error);
    getAppelsAdmin().then(setCalls).catch(console.error);
    getAgreementsAdmin().then(setAgreements).catch(console.error);
    getMobilitesAdmin().then(setMobilities).catch(console.error);
    getProgrammesAdmin().then(setProgrammes).catch(console.error);
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getDocumentsAdminPreview(previewLang).then((rows) => {
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

  // ------------------------------------------------------------
  // TRADUCTIONS
  // ------------------------------------------------------------

  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getDocumentTranslations(item.id);
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
      await updateDocumentTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setTranslationsSaving(false);
    }
  };

  // ------------------------------------------------------------
  // HISTORIQUE DES VERSIONS
  // ------------------------------------------------------------

  const openRevisions = async (item) => {
    setRevisionsItem(item);
    setRevisionsLoading(true);
    setRevisions([]);

    try {
      const rows = await getDocumentRevisions(item.id);
      setRevisions(rows);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      alert(err.message || "Erreur lors du chargement de l'historique");
    } finally {
      setRevisionsLoading(false);
    }
  };

  const closeRevisions = () => {
    if (restoringId) return;
    setRevisionsItem(null);
    setRevisions([]);
  };

  const handleRestore = async (revisionId) => {
    if (!confirm("Restaurer cette version ? La version actuelle sera archivée dans l'historique.")) return;

    setRestoringId(revisionId);

    try {
      await restoreDocumentRevision(revisionsItem.id, revisionId);
      closeRevisions();
      refreshDocuments();
      refreshPreview();
    } catch (err) {
      alert(err.message || 'Erreur lors de la restauration');
    } finally {
      setRestoringId(null);
    }
  };

  // ------------------------------------------------------------
  // CRUD DOCUMENTS
  // ------------------------------------------------------------

  // Édition d'un document : met à jour les champs classiques puis
  // synchronise les liens (project/call/agreement/mobility/programme)
  // en comparant l'état précédent (déjà présent sur l'item grâce à
  // mapDocument) et la nouvelle sélection du formulaire.
  const onUpdateDocument = async (id, payload) => {
    const { links: newLinks, ...rest } = payload;
    const previous = documentsRef.current.find((d) => d.id === id);

    await updateDocument(id, rest);

    if (newLinks) {
      await syncDocumentLinks(id, previous?.links || {}, newLinks);
    }
  };

  // Garde une référence à la dernière liste chargée pour retrouver
  // les liens précédents d'un document au moment de l'édition.
  const documentsRef = { current: [] };
  const fetchDocuments = async () => {
    const rows = await getDocumentsAdmin();
    documentsRef.current = rows;
    return rows;
  };

  // Permet de forcer un rechargement de la liste après une restauration.
  // Si CrudManager expose un ref/callback de refresh, remplace cet appel
  // par celui-ci ; en attendant, on relit simplement les documents pour
  // garder documentsRef à jour (utile pour les prochaines synchro de liens).
  const refreshDocuments = () => {
    fetchDocuments().catch(console.error);
  };

  return (
    <div>
      <CrudManager
        title={t('document')}
        icon={FolderOpen}
        idPrefix="doc"
        fetcher={fetchDocuments}
        toPayload={toDocumentPayload}
        onCreate={createDocument}
        onUpdate={onUpdateDocument}
        onDelete={deleteDocument}
        onPublish={publishDocument}
        onArchive={archiveDocument}
        createPermission="documents.upload"
        updatePermission="documents.edit"
        deletePermission="documents.delete"
        publishPermission="documents.edit"
        columns={[
          {
            key: 'nom',
            label: t('titre'),
            render: (item) => (
              previewData[item.id]?.nom ||
              previewData[item.id]?.titre ||
              item.nom ||
              item.titre
            ),
          },
          {
            key: 'categorieLabel',
            label: t('categorie'),
            render: (item) => {
              const code = item.categorie;
              const label = item.categorieLabel || item.categorie || '—';

              return (
                <Badge tone="cobalt">
                  {t(`enums.documentCategory.${code}`, { defaultValue: label })}
                </Badge>
              );
            },
          },
          {
            key: 'format',
            label: t('format'),
            render: (item) => (
              <span className="uppercase">
                {item.format || item.fileFormat || item.file_format || '—'}
              </span>
            ),
          },
          {
            key: 'taille',
            label: t('taille'),
            render: (item) => {
              const size = item.fileSize ?? item.file_size ?? item.taille;
              return <span>{typeof size === 'number' ? formatBytes(size) : size || '—'}</span>;
            },
          },
          {
            key: 'date',
            label: t('date'),
            render: (item) => (
              <span>{item.date || item.dateUpload || item.date_upload || '—'}</span>
            ),
          },
          {
            key: 'statut_publication',
            label: t('statut'),
            render: (item) => {
              const status = item.statutPublication || item.statut_publication || 'draft';
              return <Badge tone={publicationTone(status)}>{publicationLabel(status, t)}</Badge>;
            },
          },
          {
            key: 'fichier_url',
            label: t('fichier'),
            render: (item) => {
              const filePath = item.fichier_url || item.fichier || item.lien;

              if (!filePath) {
                return <span className="text-slate-400">Aucun fichier</span>;
              }

              const fileUrl = getFileUrl(filePath);
              const fileName = getFileName(filePath);

              return (
                <div className="flex items-center gap-3">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cobalt hover:text-blue-700 font-medium transition"
                    title="Voir le document"
                  >
                    <Eye size={16} />
                    <span>{t('voir')}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => downloadFile(filePath, fileName)}
                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition"
                    title="Télécharger le document"
                  >
                    <Download size={16} />
                    <span>{t('telecharger')}</span>
                  </button>
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
                title="Voir / modifier les traductions"
              >
                <Languages size={18} />
              </button>
            ),
          },
          {
            key: 'revisions',
            label: 'Historique',
            render: (item) => (
              <button
                type="button"
                onClick={() => openRevisions(item)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title="Voir l'historique des versions"
              >
                <History size={18} />
              </button>
            ),
          },
        ]}
        fields={[
          { name: 'titre', label: t('titre'), type: 'text', required: true },
          { name: 'description', label: t('description'), type: 'textarea' },
          {
            name: 'fichier_url',
            label: t('fichier'),
            type: 'file',
            required: true,
            accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
            onFile: async (file, setField) => {
              try {
                const uploaded = await uploadFile(file);

                setField('fichier_url', uploaded.fichier_url);
                setField('fileFormat', uploaded.file_format?.toUpperCase());
                setField('fileSize', uploaded.file_size);
              } catch (err) {
                console.error('Erreur upload:', err);
                alert(err.message || "Erreur lors de l'upload");
              }
            },
          },
          {
            name: 'changeNote',
            label: 'Note de changement',
            type: 'text',
            help: 'Optionnel — décrit ce qui a changé dans cette nouvelle version du fichier',
          },
          {
            name: 'categorieId',
            label: t('categorie'),
            type: 'select',
            required: true,
            options: categories.map((c) => ({ value: c.id, label: c.label })),
          },
          { name: 'langage', label: t('langage'), type: 'select', options: LANGUAGES },
          { name: 'version', label: t('version'), type: 'text' },
          {
            name: 'misEnAvant',
            label: t('misEnAvant'),
            type: 'select',
            options: [
              { value: 'true', label: t('yes') },
              { value: 'false', label: t('no') },
            ],
          },
          {
            name: 'dateExpiration',
            label: t('dateExpiration'),
            type: 'date',
            help: 'Format : JJ/MM/AAAA — Exemple : 31/12/2027',
          },
          {
            name: 'projectIds',
            label: 'Projets liés',
            type: 'multiselect',
            options: projects.map((p) => ({ value: p.id, label: p.titre })),
          },
          {
            name: 'callIds',
            label: 'Appels à projets liés',
            type: 'multiselect',
            options: calls.map((c) => ({ value: c.id, label: c.titre })),
          },
          {
            name: 'agreementIds',
            label: 'Conventions liées',
            type: 'multiselect',
            options: agreements.map((a) => ({ value: a.id, label: a.titre })),
          },
          {
            name: 'mobilityIds',
            label: 'Mobilités liées',
            type: 'multiselect',
            options: mobilities.map((m) => ({ value: m.id, label: m.title })),
          },
          {
            name: 'programmeIds',
            label: 'Programmes liés',
            type: 'multiselect',
            options: programmes.map((p) => ({ value: p.id, label: p.nom })),
          },
        ]}
      />

      {/* TRADUCTIONS MANUELLES (EN / AR) */}
      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                Traductions — {translationsItem.nom || translationsItem.titre}
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
                      rows={f.name === 'titre' ? 2 : 4}
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

      {/* HISTORIQUE DES VERSIONS */}
      {revisionsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                Historique — {revisionsItem.nom || revisionsItem.titre}
              </h3>
              <button type="button" onClick={closeRevisions} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
              {revisionsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : revisions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune version antérieure enregistrée.
                </p>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        Version {rev.version} — {formatBytes(rev.file_size)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(rev.created_at).toLocaleString('fr-FR')} · {rev.changed_by_name || 'Auteur inconnu'}
                      </p>
                      {rev.change_note && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
                          {rev.change_note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => downloadFile(rev.fichier_url, getFileName(rev.fichier_url))}
                        className="text-green-600 hover:text-green-700"
                        title="Télécharger cette version"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRestore(rev.id)}
                        disabled={restoringId === rev.id}
                        className="text-xs font-medium text-cobalt hover:text-blue-700 disabled:opacity-50"
                      >
                        {restoringId === rev.id ? '...' : 'Restaurer'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={closeRevisions}
                disabled={!!restoringId}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}