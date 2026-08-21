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

const publicationStatusTone = (s) =>
  s === 'published' ? 'green' :
  s === 'archived' ? 'slate' :
  'amber';

const NEWS_EVENT_TYPES = [
  'news',
  'event',
  'workshop',
  'meeting',
  'testimonial',
];

export default function ManageNewsEvents() {
  const { t } = useTranslation();

  const [projects, setProjects] = useState([]);

  useEffect(() => {
  getProjets().then(setProjects);
}, []);

  return (
    <CrudManager
      title={t('newsEvents')}
      idPrefix="news-event"

      fetcher={getActualitesAdmin}
onCreate={createActualite}
onUpdate={updateActualite}
onDelete={deleteActualite}
onPublish={publishActualite}
onArchive={archiveActualite}

      columns={[
        {
          key: 'title',
          label: t('title'),
        },

        {
          key: 'type',
          label: t('type'),
          render: (i) => (
            <Badge tone="cobalt">
              {t(`${i.type}`)}
            </Badge>
          ),
        },

        {
          key: 'eventDate',
          label: t('eventDate'),
        },

        {
          key: 'location',
          label: t('location'),
        },

        {
          key: 'isFeatured',
          label: t('featured'),
          render: (i) => (
            <Badge tone={i.isFeatured ? 'green' : 'slate'}>
              {i.isFeatured ? t('yes') : t('no')}
            </Badge>
          ),
        },

        {
          key: 'statut',
          label: t('status'),
          render: (i) => (
            <Badge tone={publicationStatusTone(i.statut)}>
              {i.statut}
            </Badge>
          ),
        },
      ]}

      fields={[
        {
          name: 'title',
          label: t('title'),
          type: 'text',
        },

        {
          name: 'type',
          label: t('type'),
          type: 'select',
          options: NEWS_EVENT_TYPES.map((type) => ({
            value: type,
            label: t(`${type}`),
          })),
        },

       {
  name: 'resume',
  label: t('summary'),
  type: 'textarea',
},
{
  name: 'contenu',
  label: t('description'),
  type: 'textarea',
},

        {
          name: 'projectId',
          label: t('project'),
          type: 'select',
          options: projects.map((p) => ({
            value: p.id,
            label: p.name || p.title,
          })),
        },

        {
          name: 'eventDate',
          label: t('eventDate'),
          type: 'text',
        },

        {
          name: 'endDate',
          label: t('endDate'),
          type: 'text',
        },

        {
          name: 'location',
          label: t('location'),
          type: 'text',
        },

        {
          name: 'imageUrl',
          label: t('imageUrl'),
          type: 'text',
        },

        {
          name: 'isFeatured',
          label: t('featured'),
          type: 'checkbox',
        },

        {
          name: 'authorName',
          label: t('authorName'),
          type: 'text',
        },

        {
          name: 'authorRole',
          label: t('authorRole'),
          type: 'text',
        },

        {
          name: 'authorPhotoUrl',
          label: t('authorPhotoUrl'),
          type: 'text',
        },

        {
          name: 'quoteText',
          label: t('quoteText'),
          type: 'textarea',
        },

        
      ]}
    />
  );
}