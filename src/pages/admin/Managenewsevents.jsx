
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';

import {
  getActualitesAdmin,
  createActualite,
  updateActualite,
  deleteActualite,
  publishActualite,
  archiveActualite,
  getProjets,
} from '../../services/api.js';

import {
  toActualitePayload,
} from '../../services/mappers.js';

/* ============================================================
   TYPES
============================================================ */

const NEWS_EVENT_TYPES = [
  'news',
  'event',
  'workshop',
  'meeting',
  'testimonial',
];

/* ============================================================
   STATUT PUBLICATION
   IMPORTANT :
   statut_publication = published | draft | archived
============================================================ */

const publicationStatusTone = (status) => {
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

const publicationStatusLabel = (status) => {
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

export default function ManageNewsEvents() {
  const { t } = useTranslation();

  const [projects, setProjects] = useState([]);

  /* ==========================================================
     PROJETS
  ========================================================== */

  useEffect(() => {
    getProjets()
      .then(setProjects)
      .catch((err) => {
        console.error(
          'Erreur récupération projets:',
          err
        );
      });
  }, []);

  return (
    <CrudManager
      title={t('newsEvents')}
      icon="📰"
      idPrefix="news-event"

      /* ======================================================
         CRUD
      ====================================================== */

      fetcher={getActualitesAdmin}

      toPayload={toActualitePayload}

      onCreate={createActualite}

      onUpdate={updateActualite}

      onDelete={deleteActualite}

      /* ======================================================
         PUBLICATION
      ====================================================== */

      onPublish={publishActualite}

      onArchive={archiveActualite}

      /* ======================================================
         COLONNES
      ====================================================== */

      columns={[
        /* ----------------------------------------------------
           TITRE
        ----------------------------------------------------- */

        {
          key: 'title',
          label: t('title'),
        },

        /* ----------------------------------------------------
           TYPE
        ----------------------------------------------------- */

        {
          key: 'type',
          label: t('type'),

          render: (item) => (
            <Badge tone="cobalt">
              {t(item.type)}
            </Badge>
          ),
        },

        /* ----------------------------------------------------
           DATE ÉVÉNEMENT
        ----------------------------------------------------- */

        {
          key: 'eventDate',
          label: t('eventDate'),

          render: (item) =>
            item.eventDate ||
            item.event_date ||
            '—',
        },

        /* ----------------------------------------------------
           LIEU
        ----------------------------------------------------- */

        {
          key: 'location',
          label: t('location'),

          render: (item) =>
            item.location || '—',
        },

        /* ----------------------------------------------------
           MIS EN AVANT
        ----------------------------------------------------- */

        {
          key: 'isFeatured',
          label: t('featured'),

          render: (item) => {
            const featured =
              item.isFeatured ??
              item.is_featured ??
              false;

            return (
              <Badge
                tone={
                  featured
                    ? 'green'
                    : 'slate'
                }
              >
                {featured
                  ? t('yes')
                  : t('no')}
              </Badge>
            );
          },
        },

        /* ----------------------------------------------------
           STATUT PUBLICATION
           
           IMPORTANT :
           on utilise statut_publication
           et PAS statut
        ----------------------------------------------------- */

        {
          key: 'statut_publication',
          label: t('status'),
          render: (item) => {
            const status =
              item.statut_publication ||
              'draft';
            return (
              <Badge
                tone={
                  publicationStatusTone(
                    status
                  )
                }
              >
                {publicationStatusLabel(
                  status
                )}
              </Badge>
            );
          },
        },
      ]}

      /* ======================================================
         FORMULAIRE
         
         PAS DE statut_publication.
         Le statut est géré par le menu Publier/Archiver.
      ====================================================== */

      fields={[
        /* ---------------------------------------------------
           TITRE
        --------------------------------------------------- */

        {
          name: 'title',
          label: t('title'),
          type: 'text',
          required: true,

          help:
            "Titre de l'actualité ou événement",
        },

        /* ---------------------------------------------------
           TYPE
        --------------------------------------------------- */

        {
          name: 'type',
          label: t('type'),
          type: 'select',
          required: true,

          options:
            NEWS_EVENT_TYPES.map(
              (type) => ({
                value: type,
                label: t(type),
              })
            ),

          help:
            'Type de contenu',
        },

        /* ---------------------------------------------------
           RÉSUMÉ
        --------------------------------------------------- */

        {
          name: 'summary',
          label: t('summary'),
          type: 'textarea',

          help:
            "Résumé court de l'actualité",
        },

        /* ---------------------------------------------------
           DESCRIPTION
        --------------------------------------------------- */

        {
          name: 'description',
          label: t('description'),
          type: 'textarea',

          help:
            'Description complète',
        },

        /* ---------------------------------------------------
           PROJET
        --------------------------------------------------- */

        {
          name: 'projectId',
          label: t('project'),
          type: 'select',

          options: [
            {
              value: '',
              label: 'Aucun projet',
            },

            ...projects.map(
              (project) => ({
                value: project.id,
                label:
                  project.titre ||
                  project.title,
              })
            ),
          ],

          help:
            'Projet associé',
        },

        /* ---------------------------------------------------
           DATE DÉBUT
        --------------------------------------------------- */

        {
          name: 'eventDate',
          label: t('eventDate'),
          type: 'date',

          help:
            'Format : YYYY-MM-DD — Exemple : 2026-05-19',
        },

        /* ---------------------------------------------------
           DATE FIN
        --------------------------------------------------- */

        {
          name: 'endDate',
          label: t('endDate'),
          type: 'date',

          help:
            'Format : YYYY-MM-DD — Exemple : 2026-05-20',
        },

        /* ---------------------------------------------------
           LIEU
        --------------------------------------------------- */

        {
          name: 'location',
          label: t('location'),
          type: 'text',

          help:
            "Lieu de l'événement",
        },

        /* ---------------------------------------------------
           IMAGE
        --------------------------------------------------- */

        {
          name: 'imageUrl',
          label: t('imageUrl'),
          type: 'text',

          help:
            "URL de l'image",
        },

        /* ---------------------------------------------------
           MIS EN AVANT
        --------------------------------------------------- */

        {
          name: 'isFeatured',
          label: t('featured'),
          type: 'select',

          options: [
            {
              value: 'false',
              label: t('no'),
            },
            {
              value: 'true',
              label: t('yes'),
            },
          ],

          help:
            "Mettre en avant sur la page d'accueil",
        },

        /* ---------------------------------------------------
           AUTEUR
        --------------------------------------------------- */

        {
          name: 'authorName',
          label: t('authorName'),
          type: 'text',
          required: (values) => values.type === 'testimonial',
 
          help:
            "Nom de l'auteur",
        },

        {
          name: 'authorRole',
          label: t('authorRole'),
          type: 'text',
            required: (values) => values.type === 'testimonial',

          help:
            "Rôle/position de l'auteur",
        },

        {
          name: 'authorPhotoUrl',
          label: t('authorPhotoUrl'),
          type: 'text',

          help:
            "URL de la photo de l'auteur",
        },

        /* ---------------------------------------------------
           CITATION
        --------------------------------------------------- */

        {
          name: 'quoteText',
          label: t('quoteText'),
          type: 'textarea',

          help:
            'Citation ou témoignage',
        },
      ]}
    />
  );
}

