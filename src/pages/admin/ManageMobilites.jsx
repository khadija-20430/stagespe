import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getMobilites, createMobilite, updateMobilite, deleteMobilite,
  getProgrammes, getCountries, getPartenaires,
} from '../../services/api.js';
import { toMobilitePayload } from '../../services/mappers.js';
import { MOBILITY_TYPE } from '../../lib/enums.js';

const MOBILITY_STATUS = ['open', 'closed', 'upcoming'];
const mobilityStatusTone = (s) => (s === 'open' ? 'green' : s === 'upcoming' ? 'amber' : 'slate');
const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
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
      title={t('admin.nav.mobility')}
      idPrefix="mob"
      fetcher={getMobilites}
      toPayload={toMobilitePayload}
      onCreate={createMobilite}
      onUpdate={updateMobilite}
      onDelete={deleteMobilite}
      columns={[
        { key: 'titre', label: t('admin.mobilites.columns.titre') },
        { key: 'paysDestination', label: t('admin.mobilites.columns.pays') },
        { key: 'type', label: t('admin.mobilites.columns.type'),
          render: (i) => <Badge tone="navy">{t(`enums.mobilityType.${i.type}`)}</Badge> },
        { key: 'statut', label: t('admin.mobilites.columns.statut'),
          render: (i) => <Badge tone={mobilityStatusTone(i.statut)}>{t(`enums.mobilityStatus.${i.statut}`)}</Badge> },
        { key: 'places', label: t('admin.mobilites.columns.places') },
      ]}
      fields={[
        { name: 'titre', label: t('admin.mobilites.fields.titre'), type: 'text' },
        { name: 'type', label: t('admin.mobilites.fields.type'), type: 'select',
          options: MOBILITY_TYPE.map((code) => ({ value: code, label: t(`enums.mobilityType.${code}`) })) },
        { name: 'programmeId', label: t('admin.mobilites.fields.programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'paysDestinationId', label: t('admin.mobilites.fields.pays'), type: 'select',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'institutionAccueilId', label: t('admin.mobilites.fields.institutionAccueil'), type: 'select',
          options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
        { name: 'duree', label: t('admin.mobilites.fields.duree'), type: 'text' },
        { name: 'periode', label: t('admin.mobilites.fields.periode'), type: 'text' },
        { name: 'places', label: t('admin.mobilites.fields.places'), type: 'number' },
        { name: 'dateLimite', label: t('admin.mobilites.fields.dateLimite'), type: 'text' },
        { name: 'statut', label: t('admin.mobilites.fields.statut'), type: 'select',
          options: MOBILITY_STATUS.map((code) => ({ value: code, label: t(`enums.mobilityStatus.${code}`) })) },
        { name: 'publicCible', label: t('admin.mobilites.fields.publicCible'), type: 'textarea' },
        { name: 'conditions', label: t('admin.mobilites.fields.conditions'), type: 'textarea' },
        { name: 'financement', label: t('admin.mobilites.fields.financement'), type: 'textarea' },
        { name: 'lienCandidature', label: t('admin.mobilites.fields.lienCandidature'), type: 'text' },
        { name: 'personneContact', label: t('admin.mobilites.fields.personneContact'), type: 'text' },
        { name: 'emailContact', label: t('admin.mobilites.fields.emailContact'), type: 'text' },
        { name: 'description', label: t('admin.mobilites.fields.description'), type: 'textarea' },
        { name: 'statutPublication', label: t('admin.mobilites.fields.statutPublication'), type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })) },
      ]}
    />
  );
}