import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getProjetsAdmin, createProjet, updateProjet, deleteProjet, getProgrammes,
  publishProjet, archiveProjet,
} from '../../services/api.js';
import { toProjetPayload } from '../../services/mappers.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageProjets() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);

  useEffect(() => {
    getProgrammes().then(setProgrammes);
  }, []);

  return (
    <CrudManager
      title={t('projects')}
      idPrefix="proj"
      fetcher={getProjetsAdmin}
      toPayload={toProjetPayload}
      onCreate={createProjet}
      onUpdate={updateProjet}
      onDelete={deleteProjet}
      onPublish={publishProjet}
      onArchive={archiveProjet}
      columns={[
        { key: 'titre', label: t('titre') },
        { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'statut', label: t('statut'),
          render: (i) => <Badge tone={projectStatusTone(i.statut)}>{t(`projectStatus${i.statut}`)}</Badge> },
        { key: 'budget', label: t('budget'),
          render: (i) => i.budget != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget) : '—' },
        { key: 'coordinateur', label: t('coordinateur') },
        { key: 'statutPublication', label: t('statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{i.statutPublication}</Badge> },
      ]}
      fields={[
        { name: 'titre', label: t('titre'), type: 'text' },
        { name: 'acronyme', label: t('acronyme'), type: 'text' },
        { name: 'codeReference', label: t('codeReference'), type: 'text' },
        { name: 'programmeId', label: t('programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'statut', label: t('statut'), type: 'select',
          options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
        { name: 'budget', label: t('budget'), type: 'number' },
        { name: 'debut', label: t('debut'), type: 'text' },
        { name: 'fin', label: t('fin'), type: 'text' },
        { name: 'siteWeb', label: t('siteWeb'), type: 'text' },
        { name: 'resume', label: t('resume'), type: 'textarea' },
        { name: 'objectifs', label: t('objectifs'), type: 'textarea' },
        { name: 'groupesCibles', label: t('groupesCibles'), type: 'textarea' },
        { name: 'resultats', label: t('resultats'), type: 'list' },
        { name: 'livrables', label: t('livrables'), type: 'list' },
        { name: 'misEnAvant', label: t('misEnAvant'), type: 'select',
          options: [{ value: 'true', label: t('yes') }, { value: 'false', label: t('no') }] },
        // ⚠️ statutPublication RETIRÉ du formulaire — géré par les boutons Publier/Archiver
      ]}
    />
  );
}