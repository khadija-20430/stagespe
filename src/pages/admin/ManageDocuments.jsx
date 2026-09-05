
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Eye, Download } from 'lucide-react';
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
} from '../../services/api.js';

import { toDocumentPayload } from '../../services/mappers.js';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

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

const publicationLabel = (status) => {
  const value = String(status || 'draft')
    .toLowerCase()
    .trim();

  if (
    value === 'published' ||
    value === 'publié'
  ) {
    return 'Publié';
  }

  if (value === 'archived') {
    return 'Archivé';
  }

  return 'Brouillon';
};

/* ============================================================
   COMPOSANT
============================================================ */

export default function ManageDocuments() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);

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

  return (
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
        },

        /* ----------------------------------------------------
           CATEGORIE
        ----------------------------------------------------- */

        {
          key: 'categorieLabel',
          label: t('categorie'),

          render: (item) => (
            <Badge tone="cobalt">
              {item.categorieLabel ||
                item.categorie_label ||
                item.categorie ||
                '—'}
            </Badge>
          ),
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
          label: 'Statut',

        render: (item) => {
  const status =
    item.statutPublication ||
    item.statut_publication ||
    'draft';

  return (
    <Badge
      tone={publicationTone(status)}
    >
      {publicationLabel(status)}
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
                  <span>Voir</span>
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
                  <span>Télécharger</span>
                </button>

              </div>
            );
          },
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
  );
}

