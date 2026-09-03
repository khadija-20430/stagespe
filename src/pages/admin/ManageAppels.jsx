import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getAppelsAdmin, createAppel, updateAppel, deleteAppel,
  publishAppel, archiveAppel,
  getProgrammes, getActionTypes, getCountries,
} from '../../services/api.js';
import { toAppelPayload } from '../../services/mappers.js';
import { CALL_STATUS, callStatusTone } from '../../lib/enums.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageAppels() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getActionTypes().then(setActionTypes);
    getCountries().then(setCountries);
  }, []);

  return (
    <CrudManager
      title={t('admin.nav.calls')}
      idPrefix="app"
      fetcher={getAppelsAdmin}
      toPayload={toAppelPayload}
      onCreate={createAppel}
      onUpdate={updateAppel}
      onDelete={deleteAppel}
      onPublish={publishAppel}
      onArchive={archiveAppel}
      columns={[
        { key: 'titre', label: t('titre') , required: true},
        { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'eligibility', label: t('pays'), render: (i) => Array.isArray(i.paysEligibles) ? i.paysEligibles.join(', ') : i.paysEligibles },
        { key: 'status', label: t('status'),
          render: (i) => <Badge tone={callStatusTone(i.status)}>{t(`${i.status}`)}</Badge> },
{ key: 'dateLimite', label: t('dateLimite'),
  render: (i) => i.dateLimite ? new Date(i.dateLimite).toLocaleDateString('fr-FR') : '—' },     
     { key: 'statut_publication', label: t('publication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{i.statut_publication}</Badge> },
      ]}
      fields={[
        { name: 'titre', label: t('titre'), type: 'text',required: true },
        { name: 'programmeId', label: t('programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'organismeFinanceur', label: t('organismeFinanceur'), type: 'text' },
        { name: 'paysEligiblesIds', label: t('pays'), type: 'list',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'typeActionId', label: t('typeAction'), type: 'select',
          options: actionTypes.map((a) => ({ value: a.id, label: a.label })) },
        { name: 'status', label: t('status'), type: 'select',
          options: CALL_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
        { name: 'datePublication', label: t('datePublication'), type: 'text' },
        { name: 'dateLimite', label: t('dateLimite'), type: 'date' },
        { name: 'budgetDisponible', label: t('budget'), type: 'number' },
        { name: 'tauxFinancement', label: t('tauxFinancement'), type: 'number' },
        { name: 'publicCible', label: t('publicCible'), type: 'text' },
        { name: 'lienOfficiel', label: t('lienOfficiel'), type: 'text' },
        { name: 'personneContact', label: t('personneContact'), type: 'text' },
        { name: 'resume', label: t('resume'), type: 'textarea' },
      ]}
    />
  );
}