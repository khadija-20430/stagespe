import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getAppels } from '../../services/api.js';
import { CALL_STATUS, callStatusTone } from '../../lib/enums.js';

export default function ManageAppels() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.calls')}
      idPrefix="app"
      fetcher={getAppels}
      columns={[
        { key: 'titre', label: t('admin.appels.columns.titre') },
        { key: 'programme', label: t('admin.appels.columns.programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'pays', label: t('admin.appels.columns.pays') },
        {
          key: 'statut',
          label: t('admin.appels.columns.statut'),
          render: (i) => <Badge tone={callStatusTone(i.statut)}>{t(`enums.callStatus.${i.statut}`)}</Badge>,
        },
        { key: 'dateLimite', label: t('admin.appels.columns.dateLimite') },
      ]}
      fields={[
        { name: 'titre', label: t('admin.appels.fields.titre'), type: 'text' },
        {
          name: 'programme',
          label: t('admin.appels.fields.programme'),
          type: 'select',
          options: ['Horizon Europe', 'Erasmus+', 'Coopération bilatérale', 'Échange étudiant'],
        },
        { name: 'pays', label: t('admin.appels.fields.pays'), type: 'text' },
        {
          name: 'statut',
          label: t('admin.appels.fields.statut'),
          type: 'select',
          options: CALL_STATUS.map((code) => ({ value: code, label: t(`enums.callStatus.${code}`) })),
        },
        { name: 'dateLimite', label: t('admin.appels.fields.dateLimite'), type: 'text' },
        { name: 'budgetLabel', label: t('admin.appels.fields.budget'), type: 'text' },
        { name: 'resume', label: t('admin.appels.fields.resume'), type: 'textarea' },
      ]}
    />
  );
}