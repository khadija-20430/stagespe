import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getProjets } from '../../services/api.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

export default function ManageProjets() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.projects')}
      idPrefix="proj"
      fetcher={getProjets}
      columns={[
        { key: 'titre', label: t('admin.projets.columns.titre') },
        { key: 'programme', label: t('admin.projets.columns.programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        {
          key: 'statut',
          label: t('admin.projets.columns.statut'),
          render: (i) => <Badge tone={projectStatusTone(i.statut)}>{t(`enums.projectStatus.${i.statut}`)}</Badge>,
        },
        {
          key: 'budget',
          label: t('admin.projets.columns.budget'),
          render: (i) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget),
        },
        { key: 'coordinateur', label: t('admin.projets.columns.coordinateur') },
      ]}
      fields={[
        { name: 'titre', label: t('admin.projets.fields.titre'), type: 'text' },
        {
          name: 'programme',
          label: t('admin.projets.fields.programme'),
          type: 'select',
          options: ['Horizon Europe', 'Erasmus+', 'Coopération bilatérale', 'Laboratoire commun'],
        },
        {
          name: 'statut',
          label: t('admin.projets.fields.statut'),
          type: 'select',
          options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`enums.projectStatus.${code}`) })),
        },
        { name: 'coordinateur', label: t('admin.projets.fields.coordinateur'), type: 'text' },
        { name: 'budget', label: t('admin.projets.fields.budget'), type: 'number' },
        { name: 'debut', label: t('admin.projets.fields.debut'), type: 'text' },
        { name: 'fin', label: t('admin.projets.fields.fin'), type: 'text' },
        { name: 'pays', label: t('admin.projets.fields.pays'), type: 'list' },
        { name: 'partenaires', label: t('admin.projets.fields.partenaires'), type: 'list' },
        { name: 'resume', label: t('admin.projets.fields.resume'), type: 'textarea' },
      ]}
    />
  );
}