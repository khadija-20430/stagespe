import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getMobilites } from '../../services/api.js';
import { MOBILITY_TYPE } from '../../lib/enums.js';

export default function ManageMobilites() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.mobility')}
      idPrefix="mob"
      fetcher={getMobilites}
      columns={[
        { key: 'destination', label: t('admin.mobilites.columns.destination') },
        { key: 'pays', label: t('admin.mobilites.columns.pays') },
        {
          key: 'type',
          label: t('admin.mobilites.columns.type'),
          render: (i) => <Badge tone="navy">{t(`enums.mobilityType.${i.type}`)}</Badge>,
        },
        { key: 'niveau', label: t('admin.mobilites.columns.niveau') },
        { key: 'places', label: t('admin.mobilites.columns.places') },
      ]}
      fields={[
        { name: 'destination', label: t('admin.mobilites.fields.destination'), type: 'text' },
        { name: 'pays', label: t('admin.mobilites.fields.pays'), type: 'text' },
        {
          name: 'type',
          label: t('admin.mobilites.fields.type'),
          type: 'select',
          options: MOBILITY_TYPE.map((code) => ({ value: code, label: t(`enums.mobilityType.${code}`) })),
        },
        { name: 'niveau', label: t('admin.mobilites.fields.niveau'), type: 'select', options: ['Master', 'Doctorat', 'Enseignant-chercheur'] },
        { name: 'duree', label: t('admin.mobilites.fields.duree'), type: 'text' },
        { name: 'places', label: t('admin.mobilites.fields.places'), type: 'number' },
        { name: 'programme', label: t('admin.mobilites.fields.programme'), type: 'text' },
        { name: 'description', label: t('admin.mobilites.fields.description'), type: 'textarea' },
      ]}
    />
  );
}