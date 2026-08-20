import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getProjets, createProjet, updateProjet, deleteProjet, getProgrammes,
} from '../../services/api.js';
import { toProjetPayload } from '../../services/mappers.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageProjets() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);

  useEffect(() => {
    getProgrammes().then(setProgrammes);
  }, []);

  return (
    <CrudManager
      title={t('admin.nav.projects')}
      idPrefix="proj"
      fetcher={getProjets}
      toPayload={toProjetPayload}
      onCreate={createProjet}
      onUpdate={updateProjet}
      onDelete={deleteProjet}
      columns={[
        { key: 'titre', label: t('admin.projets.columns.titre') },
        { key: 'programme', label: t('admin.projets.columns.programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'statut', label: t('admin.projets.columns.statut'),
          render: (i) => <Badge tone={projectStatusTone(i.statut)}>{t(`enums.projectStatus.${i.statut}`)}</Badge> },
        { key: 'budget', label: t('admin.projets.columns.budget'),
          render: (i) => i.budget != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget) : '—' },
        { key: 'coordinateur', label: t('admin.projets.columns.coordinateur') },
        { key: 'statutPublication', label: t('admin.projets.columns.statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{t(`enums.publicationStatus.${i.statutPublication}`)}</Badge> },
      ]}
      fields={[
        { name: 'titre', label: t('admin.projets.fields.titre'), type: 'text' },
        { name: 'acronyme', label: t('admin.projets.fields.acronyme'), type: 'text' },
        { name: 'codeReference', label: t('admin.projets.fields.codeReference'), type: 'text' },
        { name: 'programmeId', label: t('admin.projets.fields.programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'statut', label: t('admin.projets.fields.statut'), type: 'select',
          options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`enums.projectStatus.${code}`) })) },
        { name: 'budget', label: t('admin.projets.fields.budget'), type: 'number' },
        { name: 'debut', label: t('admin.projets.fields.debut'), type: 'text' },
        { name: 'fin', label: t('admin.projets.fields.fin'), type: 'text' },
        { name: 'siteWeb', label: t('admin.projets.fields.siteWeb'), type: 'text' },
        { name: 'resume', label: t('admin.projets.fields.resume'), type: 'textarea' },
        { name: 'objectifs', label: t('admin.projets.fields.objectifs'), type: 'textarea' },
        { name: 'groupesCibles', label: t('admin.projets.fields.groupesCibles'), type: 'textarea' },
        { name: 'resultats', label: t('admin.projets.fields.resultats'), type: 'list' },
        { name: 'livrables', label: t('admin.projets.fields.livrables'), type: 'list' },
        { name: 'misEnAvant', label: t('admin.projets.fields.misEnAvant'), type: 'select',
          options: [{ value: 'true', label: t('admin.common.yes') }, { value: 'false', label: t('admin.common.no') }] },
        { name: 'statutPublication', label: t('admin.projets.fields.statutPublication'), type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })) },
      ]}
    />
  );
}