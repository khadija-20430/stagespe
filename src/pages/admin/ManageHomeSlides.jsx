import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import { GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen, GalleryHorizontal } from 'lucide-react';
import {
  getHomeSlidesAdmin,
  createHomeSlide,
  updateHomeSlide,
  deleteHomeSlide,
  updateHomeSlideStatus,
} from '../../services/api.js';

const LUCIDE_ICONS = ['GraduationCap', 'Megaphone', 'Globe', 'FlaskConical', 'Users', 'BookOpen'];
const ICON_COMPONENTS = { GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen };

// Liste fixe des badges (valeurs techniques stockées en BDD, jamais
// traduites via home_slides_translations — comme statut_publication).
// Le libellé, lui, est traduit statiquement via i18n
// (admin.homeSlides.badges.<VALEUR>).
const HOME_SLIDE_BADGES = ['PROJETS', 'DOCS', 'PARTENARIATS', 'MOBILITE'];

// Langue i18n -> id numérique attendu par getHomeSlidesAdmin(langId)
// (1 = FR, 2 = EN, 3 = AR, cf. toPayload().translations plus bas).
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

  // Refetch quand la langue de l'interface change, pour que `title`
  // reflète la traduction stockée en BDD au lieu du FR figé.
  const fetcher = useCallback(() => getHomeSlidesAdmin(langId), [langId]);

  const columns = [
    { key: 'display_order', label: t('admin.homeSlides.order') },
    {
      key: 'badge',
      label: t('admin.homeSlides.badge'),
      render: (item) => t(`admin.homeSlides.badges.${item.badge}`, item.badge),
    },
    // Clé racine partagée (comme statut_publication), pas
    // admin.homeSlides.title qui désigne le titre de la page.
    { key: 'title', label: t('titre') },
    {
      key: 'icon_value',
      label: t('admin.homeSlides.icon'),
      render: (item) => {
        const IconComponent = ICON_COMPONENTS[item.icon_value];
        return IconComponent ? <IconComponent size={20} /> : <span>-</span>;
      },
    },
    {
      key: 'statut_publication',
      label: t('admin.homeSlides.status'),
      render: (item) => (
        <span className={`px-3 py-1 rounded text-sm ${publicationTone(item.statut_publication)}`}>
          {publicationLabel(item.statut_publication, t)}
        </span>
      ),
    },
  ];

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
  ];

  const toPayload = (draft) => ({
    badge: draft.badge,
    iconType: 'lucide',
    iconValue: draft.icon_value,
    displayOrder: draft.display_order,
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