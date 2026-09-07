import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Eye, Download, Languages, X, Save, Loader2 } from 'lucide-react';
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
} from '../../services/api.js';

import { toDocumentPayload } from '../../services/mappers.js';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

const PREVIEW_LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
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

/* ============================================================
   FORMAT TAILLE
============================================================ */

const formatBytes = (bytes) => {
  if (!bytes) return '—';

  const units = ['o', 'Ko', 'Mo', 'Go'];

  let i = 0;
  let n = Number(bytes);

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }

  return `${n
    .toFixed(i === 0 ? 0 : 1)
    .replace('.', ',')} ${units[i]}`;
};

/* ============================================================
   NOM FICHIER
============================================================ */

const getFileName = (path) => {
  if (!path) return 'document';

  try {
    const cleanPath = String(path).split('?')[0];

    return (
      cleanPath.split('/').pop() ||
      'document'
    );
  } catch {
    return 'document';
  }
};

/* ============================================================
   TÉLÉCHARGEMENT RÉEL
============================================================ */

const downloadFile = async (
  path,
  fallbackName = 'document'
) => {
  try {
    const url = getFileUrl(path);

    if (!url) {
      throw new Error('Aucun fichier disponible');
    }

    console.log('Téléchargement :', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Impossible de télécharger le fichier (${response.status})`
      );
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
    console.error(
      'Erreur téléchargement fichier:',
      error
    );

    alert(
      error.message ||
      'Erreur lors du téléchargement du fichier'
    );
  }
};

/* ============================================================
   STATUT PUBLICATION
   IMPORTANT :
   statut_publication = published | draft | archived
============================================================ */

const publicationTone = (status) => {
  const value = String(status || 'draft')
    .toLowerCase()
    .trim();

  if (
    value === 'published' ||
    value === 'publié'
  ) {
    return 'green';
  }

  if (value === 'archived') {
    return 'slate';
  }

  return 'amber';
};

// APRÈS — utilise les clés i18n racine comme ManageAppels
const publicationLabel = (status, t) => {
  const value = String(status || 'draft').toLowerCase().trim();

  if (value === 'published' || value === 'publié') return t('published');
  if (value === 'archived') return t('archived');
  return t('draft');
};

/* ============================================================
   COMPOSANT
============================================================ */

export default function ManageDocuments() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);

  // ===== APERÇU DE TRADUCTION (lecture seule) =====
  const [previewLang, setPreviewLang] = useState('fr');
  const [previewData, setPreviewData] = useState({});

  // ===== MODALE DE TRADUCTION MANUELLE =====
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  /* ==========================================================
     CATEGORIES
  ========================================================== */

  useEffect(() => {
    getDocumentCategories()
      .then(setCategories)
      .catch((err) => {
        console.error(
          'Erreur récupération catégories:',
          err
        );
      });
  }, []);

  // ===== APERÇU DE TRADUCTION =====
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

  // ===== MODALE DE TRADUCTION MANUELLE =====
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
      title={t('document')}
      icon={FolderOpen}
      idPrefix="doc"

      /* ======================================================
         CRUD
      ====================================================== */

      fetcher={getDocumentsAdmin}

      toPayload={toDocumentPayload}

      onCreate={createDocument}

      onUpdate={updateDocument}

      onDelete={deleteDocument}

      /* ======================================================
         PUBLICATION
      ====================================================== */

      onPublish={publishDocument}

      onArchive={archiveDocument}
  createPermission="documents.upload"
  updatePermission="documents.edit"
  deletePermission="documents.delete"
  publishPermission="documents.edit"
      /* ======================================================
         COLONNES
      ====================================================== */

      columns={[
        /* ----------------------------------------------------
           TITRE
        ----------------------------------------------------- */

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

        /* ----------------------------------------------------
           CATEGORIE
        ----------------------------------------------------- */

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
        /* ----------------------------------------------------
           FORMAT
        ----------------------------------------------------- */

        {
          key: 'format',
          label: t('format'),

          render: (item) => (
            <span className="uppercase">
              {item.format ||
                item.fileFormat ||
                item.file_format ||
                '—'}
            </span>
          ),
        },

        /* ----------------------------------------------------
           TAILLE
        ----------------------------------------------------- */

        {
          key: 'taille',
          label: t('taille'),

          render: (item) => {
            const size =
              item.fileSize ??
              item.file_size ??
              item.taille;

            return (
              <span>
                {typeof size === 'number'
                  ? formatBytes(size)
                  : size || '—'}
              </span>
            );
          },
        },

        /* ----------------------------------------------------
           DATE UPLOAD
        ----------------------------------------------------- */

        {
          key: 'date',
          label: t('date'),

          render: (item) => (
            <span>
              {item.date ||
                item.dateUpload ||
                item.date_upload ||
                '—'}
            </span>
          ),
        },

        /* ----------------------------------------------------
           STATUT PUBLICATION
           IMPORTANT : statut_publication
        ----------------------------------------------------- */

        {
          key: 'statut_publication',
          label: t('statut'),

        render: (item) => {
  const status =
    item.statutPublication ||
    item.statut_publication ||
    'draft';

  return (
    <Badge
      tone={publicationTone(status)}
    >
      {publicationLabel(status, t)}
    </Badge>
  );
},
        },

        /* ----------------------------------------------------
           FICHIER
        ----------------------------------------------------- */

        {
          key: 'fichier_url',
          label: t('fichier'),

          render: (item) => {
            const filePath =
              item.fichier_url ||
              item.fichier ||
              item.lien;

            if (!filePath) {
              return (
                <span className="text-slate-400">
                  Aucun fichier
                </span>
              );
            }

            const fileUrl =
              getFileUrl(filePath);

            const fileName =
              getFileName(filePath);

            return (
              <div className="flex items-center gap-3">

                {/* VOIR */}

                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex
                    items-center
                    gap-1
                    text-cobalt
                    hover:text-blue-700
                    font-medium
                    transition
                  "
                  title="Voir le document"
                >
                  <Eye size={16} />
                  <span>{t('voir')}</span>
                </a>

                {/* TÉLÉCHARGER */}

                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      filePath,
                      fileName
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-1
                    text-green-600
                    hover:text-green-700
                    font-medium
                    transition
                  "
                  title="Télécharger le document"
                >
                  <Download size={16} />
                  <span>{t('telecharger')}</span>
                </button>

              </div>
            );
          },
        },

        /* ----------------------------------------------------
           TRADUCTIONS
        ----------------------------------------------------- */

        {
          key: 'translations',
          label: 'Traductions',
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
      ]}

      /* ======================================================
         FORMULAIRE
         
         PAS DE statut_publication ICI.
         Le statut est géré par publier/archiver.
      ====================================================== */

      fields={[
        /* ---------------------------------------------------
           TITRE
        --------------------------------------------------- */

        {
          name: 'titre',
          label: t('titre'),
          type: 'text',
          required: true,
        },

        /* ---------------------------------------------------
           DESCRIPTION
        --------------------------------------------------- */

        {
          name: 'description',
          label: t('description'),
          type: 'textarea',
        },

        /* ---------------------------------------------------
           FICHIER
        --------------------------------------------------- */

        {
          name: 'fichier_url',
          label: t('fichier'),
          type: 'file',
          required: true,

          accept:
            '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',

          onFile: async (
            file,
            setField
          ) => {
            try {
              console.log(
                'Upload fichier:',
                file.name
              );

              const uploaded =
                await uploadFile(file);

              console.log(
                'Fichier uploadé:',
                uploaded
              );

              setField(
                'fichier_url',
                uploaded.fichier_url
              );

              setField(
                'fileFormat',
                uploaded.file_format
                  ?.toUpperCase()
              );

              setField(
                'fileSize',
                uploaded.file_size
              );
            } catch (err) {
              console.error(
                'Erreur upload:',
                err
              );

              alert(
                err.message ||
                "Erreur lors de l'upload"
              );
            }
          },
        },

        /* ---------------------------------------------------
           CATEGORIE
        --------------------------------------------------- */

        {
          name: 'categorieId',
          label: t('categorie'),
          type: 'select',
          required: true,

          options: categories.map((c) => ({
            value: c.id,
            label: c.label,
          })),
        },

        /* ---------------------------------------------------
           LANGUE
        --------------------------------------------------- */

        {
          name: 'langage',
          label: t('langage'),
          type: 'select',
          options: LANGUAGES,
        },

        /* ---------------------------------------------------
           VERSION
        --------------------------------------------------- */

        {
          name: 'version',
          label: t('version'),
          type: 'text',
        },

        /* ---------------------------------------------------
           MIS EN AVANT
        --------------------------------------------------- */

        {
          name: 'misEnAvant',
          label: t('misEnAvant'),
          type: 'select',

          options: [
            {
              value: 'true',
              label: t('yes'),
            },
            {
              value: 'false',
              label: t('no'),
            },
          ],
        },

        /* ---------------------------------------------------
           DATE EXPIRATION
        --------------------------------------------------- */

        {
          name: 'dateExpiration',
          label: t('dateExpiration'),
          type: 'date',

          help:
            'Format : JJ/MM/AAAA — Exemple : 31/12/2027',
        },
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
    </div>
  );
}