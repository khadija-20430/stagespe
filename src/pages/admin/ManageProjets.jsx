import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getProjets } from '../../services/api.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';

// Correspond aux lignes seedées dans la table programmes (bdd.sql).
// À terme : remplacer par un getProgrammes() réel.
const PROGRAMMES = ['Erasmus+', 'Horizon Europe', 'PRIMA', 'MSCA', 'National'];

const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

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
        { key: 'coordinateurPartenaire', label: t('admin.projets.columns.coordinateur') },
        {
          key: 'statutPublication',
          label: t('admin.projets.columns.statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{t(`enums.publicationStatus.${i.statutPublication}`)}</Badge>,
        },
      ]}
      fields={[
        { name: 'titre', label: t('admin.projets.fields.titre'), type: 'text' },
        { name: 'acronyme', label: t('admin.projets.fields.acronyme'), type: 'text' },
        { name: 'codeReference', label: t('admin.projets.fields.codeReference'), type: 'text' },
        { name: 'programme', label: t('admin.projets.fields.programme'), type: 'select', options: PROGRAMMES },
        {
          name: 'statut',
          label: t('admin.projets.fields.statut'),
          type: 'select',
          options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`enums.projectStatus.${code}`) })),
        },
        // coordinator_partner_id : institution coordinatrice du projet.
        // (coordinator_user_id existe aussi côté BDD pour le référent interne,
        // à ajouter séparément si tu veux le gérer ici)
        { name: 'coordinateurPartenaire', label: t('admin.projets.fields.coordinateur'), type: 'text' },
        { name: 'budget', label: t('admin.projets.fields.budget'), type: 'number' },
        { name: 'debut', label: t('admin.projets.fields.debut'), type: 'text' },
        { name: 'fin', label: t('admin.projets.fields.fin'), type: 'text' },
        { name: 'siteWeb', label: t('admin.projets.fields.siteWeb'), type: 'text' },
        // partenaires : reflète project_partners (relation N-N avec rôle).
        // Simplifié ici en liste de noms ; une vraie gestion des rôles
        // mériterait un sous-écran dédié.
        { name: 'partenaires', label: t('admin.projets.fields.partenaires'), type: 'list' },
        { name: 'resume', label: t('admin.projets.fields.resume'), type: 'textarea' },
        { name: 'objectifs', label: t('admin.projets.fields.objectifs'), type: 'textarea' },
        { name: 'groupesCibles', label: t('admin.projets.fields.groupesCibles'), type: 'textarea' },
        { name: 'resultats', label: t('admin.projets.fields.resultats'), type: 'textarea' },
        { name: 'livrables', label: t('admin.projets.fields.livrables'), type: 'textarea' },
        {
          name: 'misEnAvant',
          label: t('admin.projets.fields.misEnAvant'),
          type: 'select',
          options: [{ value: 'true', label: t('admin.common.yes') }, { value: 'false', label: t('admin.common.no') }],
        },
        {
          name: 'statutPublication',
          label: t('admin.projets.fields.statutPublication'),
          type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })),
        },
      ]}
    />
  );
}