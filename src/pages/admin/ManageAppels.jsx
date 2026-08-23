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
        { key: 'titre', label: t('admin.appels.columns.titre') },
        { key: 'programme', label: t('admin.appels.columns.programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'paysEligibles', label: t('admin.appels.columns.pays'), render: (i) => Array.isArray(i.paysEligibles) ? i.paysEligibles.join(', ') : i.paysEligibles },
        { key: 'statut', label: t('admin.appels.columns.statut'),
          render: (i) => <Badge tone={callStatusTone(i.statut)}>{t(`enums.callStatus.${i.statut}`)}</Badge> },
        { key: 'dateLimite', label: t('admin.appels.columns.dateLimite') },
        { key: 'statutPublication', label: 'Publication',
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{i.statutPublication}</Badge> },
      ]}
      fields={[
        { name: 'titre', label: t('admin.appels.fields.titre'), type: 'text' },
        { name: 'programmeId', label: t('admin.appels.fields.programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'organismeFinanceur', label: t('admin.appels.fields.organismeFinanceur'), type: 'text' },
        { name: 'paysEligiblesIds', label: t('admin.appels.fields.pays'), type: 'list',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'typeActionId', label: t('admin.appels.fields.typeAction'), type: 'select',
          options: actionTypes.map((a) => ({ value: a.id, label: a.label })) },
        { name: 'statut', label: t('admin.appels.fields.statut'), type: 'select',
          options: CALL_STATUS.map((code) => ({ value: code, label: t(`enums.callStatus.${code}`) })) },
        { name: 'datePublication', label: t('admin.appels.fields.datePublication'), type: 'text' },
        { name: 'dateLimite', label: t('admin.appels.fields.dateLimite'), type: 'text' },
        { name: 'budgetDisponible', label: t('admin.appels.fields.budget'), type: 'number' },
        { name: 'tauxFinancement', label: t('admin.appels.fields.tauxFinancement'), type: 'number' },
        { name: 'publicCible', label: t('admin.appels.fields.publicCible'), type: 'text' },
        { name: 'lienOfficiel', label: t('admin.appels.fields.lienOfficiel'), type: 'text' },
        { name: 'personneContact', label: t('admin.appels.fields.personneContact'), type: 'text' },
        { name: 'resume', label: t('admin.appels.fields.resume'), type: 'textarea' },
        // ⚠️ statutPublication RETIRÉ du formulaire — géré par les boutons Publier/Archiver
      ]}
    />
  );
}