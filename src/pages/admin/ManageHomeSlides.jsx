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

export default function ManageHomeSlides() {
  const { t } = useTranslation();

  const fetcher = useCallback(() => getHomeSlidesAdmin(1), []);

  const columns = [
    { key: 'display_order', label: 'Ordre' },
    { key: 'badge', label: 'Badge' },
    { key: 'title', label: 'Titre (FR)' },
    {
      key: 'icon_value',
      label: 'Icône',
      render: (item) => {
        const IconComponent = ICON_COMPONENTS[item.icon_value];
        return IconComponent ? <IconComponent size={20} /> : <span>-</span>;
      }
    },
    {
      key: 'statut_publication',
      label: 'Statut',
      render: (item) => (
        <span className={`px-3 py-1 rounded text-sm ${item.statut_publication === 'published' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
          {item.statut_publication}
        </span>
      )
    }
  ];

  const fields = [
    { name: 'badge', label: 'Badge (ex: PROJETS)', type: 'text', required: true },
    { name: 'icon_value', label: 'Icône', type: 'select', options: LUCIDE_ICONS, required: true },
    { name: 'title', label: 'Titre (FR)', type: 'text', required: true },
    { name: 'description', label: 'Description (FR)', type: 'textarea', required: true },
    { name: 'title_en', label: 'Titre (EN)', type: 'text' },
    { name: 'description_en', label: 'Description (EN)', type: 'textarea' },
    { name: 'title_ar', label: 'Titre (AR)', type: 'text' },
    { name: 'description_ar', label: 'Description (AR)', type: 'textarea' },
    { name: 'display_order', label: 'Ordre', type: 'number' },
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
    }
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