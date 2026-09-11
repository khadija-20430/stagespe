import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import { toISODateOrNull } from '../../services/mappers.js';

import { GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen, GalleryHorizontal } from 'lucide-react';
import {
  getHomeSlidesAdmin,
  createHomeSlide,
  updateHomeSlide,
  deleteHomeSlide,
  updateHomeSlideStatus,
} from '../../services/api.js';
import { formatScheduledDate } from '../../lib/utils.js'; // 🆕

const LUCIDE_ICONS = ['GraduationCap', 'Megaphone', 'Globe', 'FlaskConical', 'Users', 'BookOpen'];
const ICON_COMPONENTS = { GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen };

// Liste fixe des badges
const HOME_SLIDE_BADGES = ['PROJETS', 'DOCS', 'PARTENARIATS', 'MOBILITE'];

// Langue i18n -> id numérique
const LANG_ID_BY_CODE = { fr: 1, en: 2, ar: 3 };
const getLangId = (code) => LANG_ID_BY_CODE[String(code || '').slice(0, 2)] || 1;

const publicationTone = (status) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published') return 'bg-green-200 text-green-800';
  if (value === 'archived') return 'bg-slate-200 text-slate-800';
  return 'bg-amber-200 text-amber-800';
};

const publicationLabel = (status, t) => {
  const value = String(status || 'draft').toLowerCase().trim();
  if (value === 'published') return t('published');
  if (value === 'archived') return t('archived');
  return t('draft');
};

export default function ManageHomeSlides() {
  const { t, i18n } = useTranslation();
  const langId = getLangId(i18n.language);

  const fetcher = useCallback(() => getHomeSlidesAdmin(langId), [langId]);

  // ============================================================
  // COLONNES
  // ============================================================
  const columns = [
    { key: 'display_order', label: t('admin.homeSlides.order') },
    {
      key: 'badge',
      label: t('admin.homeSlides.badge'),
      render: (item) => t(`admin.homeSlides.badges.${item.badge}`, item.badge),
    },
    { key: 'title', label: t('titre') },
    {
      key: 'icon_value',
      label: t('admin.homeSlides.icon'),
      render: (item) => {
        const IconComponent = ICON_COMPONENTS[item.icon_value];
        return IconComponent ? <IconComponent size={20} /> : <span>-</span>;
      },
    },
    // ✅ Colonne statut AVEC indicateur "Programmé"
    {
      key: 'statut_publication',
      label: t('admin.homeSlides.status'),
      render: (item) => {
        const status = item.statut_publication || 'draft';
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`px-3 py-1 rounded text-sm ${publicationTone(status)}`}>
              {publicationLabel(status, t)}
            </span>
            {status === 'draft' && item.scheduled_publish_at && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {t('programme', { defaultValue: 'Programmé' })} :{' '}
                {formatScheduledDate(item.scheduled_publish_at)}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // ============================================================
  // CHAMPS DU FORMULAIRE
  // ============================================================
  const fields = [
    {
      name: 'badge',
      label: t('admin.homeSlides.badge'),
      type: 'select',
      options: HOME_SLIDE_BADGES.map((value) => ({
        value,
        label: t(`admin.homeSlides.badges.${value}`, value),
      })),
      required: true,
    },
    {
      name: 'icon_value',
      label: t('admin.homeSlides.icon'),
      type: 'select',
      options: LUCIDE_ICONS,
      required: true,
    },
    { name: 'title', label: t('titre'), type: 'text', required: true },
    { name: 'description', label: t('description'), type: 'textarea', required: true },
    { name: 'title_en', label: t('admin.homeSlides.titleEn'), type: 'text' },
    { name: 'description_en', label: t('admin.homeSlides.descriptionEn'), type: 'textarea' },
    { name: 'title_ar', label: t('admin.homeSlides.titleAr'), type: 'text' },
    { name: 'description_ar', label: t('admin.homeSlides.descriptionAr'), type: 'textarea' },
    { name: 'display_order', label: t('admin.homeSlides.order'), type: 'number' },

    // ✅ Champ programmation de publication
    {
      name: 'scheduledPublishAt',
      label: t('programmerPublication', { defaultValue: 'Programmer la publication' }),
      type: 'datetime-local',
  help: t('programmerPublicationHelp', { defaultValue: 'Laisser vide pour publier manuellement.' }),
    },
  ];

  // ============================================================
  // PAYLOAD
  // ============================================================
  const toPayload = (draft) => ({
  badge: draft.badge,
  iconType: 'lucide',
  iconValue: draft.icon_value,
  displayOrder: draft.display_order,
  scheduledPublishAt: toISODateOrNull(draft.scheduledPublishAt),  
  translations: {
    1: { title: draft.title, description: draft.description },
    2: { title: draft.title_en || '', description: draft.description_en || '' },
    3: { title: draft.title_ar || '', description: draft.description_ar || '' },
  },
});

  return (
    <div className="p-6">
      <CrudManager
        title={t('admin.homeSlides.title')}
        icon={GalleryHorizontal}
        fetcher={fetcher}
        columns={columns}
        fields={fields}
        toPayload={toPayload}
        onCreate={createHomeSlide}
        onUpdate={updateHomeSlide}
        onDelete={deleteHomeSlide}
        onPublish={(id) => updateHomeSlideStatus(id, 'published')}
        onArchive={(id) => updateHomeSlideStatus(id, 'archived')}
      />
    </div>
  );
}