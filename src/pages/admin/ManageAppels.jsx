import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getAppels } from '../../services/api.js';
import { CALL_STATUS, callStatusTone } from '../../lib/enums.js';

// Correspond aux lignes seedées dans la table programmes (bdd.sql).
const PROGRAMMES = ['Erasmus+', 'Horizon Europe', 'PRIMA', 'MSCA', 'National'];

const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

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
        { key: 'paysEligibles', label: t('admin.appels.columns.pays') },
        {
          key: 'statut',
          label: t('admin.appels.columns.statut'),
          render: (i) => <Badge tone={callStatusTone(i.statut)}>{t(`enums.callStatus.${i.statut}`)}</Badge>,
        },
        { key: 'dateLimite', label: t('admin.appels.columns.dateLimite') },
      ]}
      fields={[
        { name: 'titre', label: t('admin.appels.fields.titre'), type: 'text' },
        { name: 'programme', label: t('admin.appels.fields.programme'), type: 'select', options: PROGRAMMES },
        { name: 'organismeFinanceur', label: t('admin.appels.fields.organismeFinanceur'), type: 'text' },
        { name: 'paysEligibles', label: t('admin.appels.fields.pays'), type: 'list' },
        { name: 'typeAction', label: t('admin.appels.fields.typeAction'), type: 'text' },
        {
          name: 'statut',
          label: t('admin.appels.fields.statut'),
          type: 'select',
          options: CALL_STATUS.map((code) => ({ value: code, label: t(`enums.callStatus.${code}`) })),
        },
        { name: 'datePublication', label: t('admin.appels.fields.datePublication'), type: 'text' },
        { name: 'dateLimite', label: t('admin.appels.fields.dateLimite'), type: 'text' },
        // budget_available (DECIMAL en BDD) : nombre, pas un libellé libre.
        { name: 'budgetDisponible', label: t('admin.appels.fields.budget'), type: 'number' },
        { name: 'tauxFinancement', label: t('admin.appels.fields.tauxFinancement'), type: 'number' },
        { name: 'publicCible', label: t('admin.appels.fields.publicCible'), type: 'text' },
        { name: 'lienOfficiel', label: t('admin.appels.fields.lienOfficiel'), type: 'text' },
        { name: 'personneContact', label: t('admin.appels.fields.personneContact'), type: 'text' },
        { name: 'resume', label: t('admin.appels.fields.resume'), type: 'textarea' },
        {
          name: 'statutPublication',
          label: t('admin.appels.fields.statutPublication'),
          type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })),
        },
      ]}
    />
  );
}