import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getProjetsAdmin, createProjet, updateProjet, deleteProjet, getProgrammes,
  getPartenaires,
  publishProjet, archiveProjet,
} from '../../services/api.js';
import { toProjetPayload } from '../../services/mappers.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageProjets() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);
  const [partenaires, setPartenaires] = useState([]);

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getPartenaires().then(setPartenaires);
  }, []);

  // Lookup rapide id -> nom du partenaire, utilisé dans la colonne du tableau
  const partnerName = (id) => {
    if (!id) return '—';
    const partner = partenaires.find(
      (p) => String(p.id) === String(id)
    );
    return partner ? partner.nom : '—';
  };

  return (
    <CrudManager
      title={t('projects')}
      icon={FlaskConical}
      idPrefix="proj"
      fetcher={getProjetsAdmin}
      toPayload={toProjetPayload}
      onCreate={createProjet}
      onUpdate={updateProjet}
      onDelete={deleteProjet}
      onPublish={publishProjet}
      onArchive={archiveProjet}
      columns={[
        { key: 'titre', label: t('titre'), required: true },
        { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'statut', label: t('statut'),
          render: (i) => <Badge tone={projectStatusTone(i.statut)}>{t(`${i.statut}`)}</Badge> },
        { key: 'budget', label: t('budget'),
          render: (i) => i.budget != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget) : '—' },
{ key: 'coordinator_partner_id', label: t('coordinateur'), 
            render: (i) => partnerName(i.coordinator_partner_id) },
{ key: 'statut_publication', label: t('statutPublication'),          render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{t(`${i.statut_publication}`)}</Badge> },
      ]}
      fields={[
        { name: 'titre', label: t('titre'), type: 'text', required: true },
        { name: 'acronyme', label: t('acronyme'), type: 'text' },
        { name: 'codeReference', label: t('codeReference'), type: 'text' },
        { name: 'programmeId', label: t('programme'), type: 'select',
          options: programmes.map((p) => ({ value: p.id, label: p.name })) },
        { name: 'statut', label: t('statut'), type: 'select',
          options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
        { name: 'budget', label: t('budget'), type: 'number' },
        { name: 'debut', label: t('debut'), type: 'date' },
        { name: 'fin', label: t('fin'), type: 'date' },
        { name: 'coordinator_partner_id', label: t('coordinator_partner_id'), type: 'select',
  options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
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