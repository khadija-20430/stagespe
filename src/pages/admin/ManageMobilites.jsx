import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getMobilitesAdmin, createMobilite, updateMobilite, deleteMobilite,
  publishMobilite, archiveMobilite,
  getProgrammes, getCountries, getPartenaires,
} from '../../services/api.js';
import { toMobilitePayload } from '../../services/mappers.js';
import { MOBILITY_TYPE } from '../../lib/enums.js';

const MOBILITY_STATUS = ['open', 'closed', 'upcoming'];
const mobilityStatusTone = (s) => (s === 'open' ? 'green' : s === 'upcoming' ? 'amber' : 'slate');
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageMobilites() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [partenaires, setPartenaires] = useState([]);

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getCountries().then(setCountries);
    getPartenaires().then(setPartenaires);
  }, []);

  return (
    <CrudManager
      title={t('mobility')}
      idPrefix="mob"
      fetcher={getMobilitesAdmin}
      toPayload={toMobilitePayload}
      onCreate={createMobilite}
      onUpdate={updateMobilite}
      onDelete={deleteMobilite}
      onPublish={publishMobilite}
      onArchive={archiveMobilite}
      columns={[
        { key: 'title', label: t('title') },
        { key: 'paysDestination', label: t('pays') },
        { key: 'type', label: t('type'),
          render: (i) => <Badge tone="navy">{t(`${i.type}`)}</Badge> },
        { key: 'status', label: t('status'),
          render: (i) => <Badge tone={mobilityStatusTone(i.status)}>{t(`${i.status}`)}</Badge> },
        { key: 'places', label: t('places') },
{ key: 'statut_publication', label: t('statutPublication'),
            render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{t(`${i.statut_publication}`)}</Badge> },
      ]}
      fields={[
        { name: 'title', label: t('title'), type: 'text',required: true, },
        { name: 'type', label: t('type'),required: true, type: 'select',
          options: MOBILITY_TYPE.map((code) => ({ value: code, label: t(`${code}`) })) },
        { name: 'programmeId', label: t('programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'paysDestinationId', label: t('pays'), type: 'select',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'institutionAccueilId', label: t('institutionAccueil'), type: 'select',
          options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
        { name: 'duree', label: t('duree'), type: 'text' },
        { name: 'periode', label: t('periode'), type: 'text' },
        { name: 'places', label: t('places'), type: 'number' },
        { name: 'dateLimite', label: t('dateLimite'), type: 'date' },
        { name: 'status', label: t('status'), type: 'select',
          options: MOBILITY_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
        { name: 'publicCible', label: t('publicCible'), type: 'textarea' },
        { name: 'conditions', label: t('conditions'), type: 'textarea' },
        { name: 'financement', label: t('financement'), type: 'textarea' },
        { name: 'lienCandidature', label: t('lienCandidature'), type: 'text' },
        { name: 'personneContact', label: t('personneContact'), type: 'text' },
        { name: 'emailContact', label: t('emailContact'), type: 'text' },
        { name: 'description', label: t('description'), type: 'textarea' },
      ]}
    />
  );
}