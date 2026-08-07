import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getMobilites } from '../../services/api.js';
import { MOBILITY_TYPE } from '../../lib/enums.js';

const PROGRAMMES = ['Erasmus+', 'Horizon Europe', 'PRIMA', 'MSCA', 'National'];
const COUNTRIES = [
  'Algérie', 'France', 'Allemagne', 'Espagne', 'Italie', 'Tunisie',
  'Maroc', 'Égypte', 'Turquie', 'Royaume-Uni', 'Canada', 'États-Unis',
];

// status (CHECK constraint sur mobility) — distinct de statut_publication
const MOBILITY_STATUS = ['open', 'closed', 'upcoming'];
const mobilityStatusTone = (s) => (s === 'open' ? 'green' : s === 'upcoming' ? 'amber' : 'slate');

const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManageMobilites() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.mobility')}
      idPrefix="mob"
      fetcher={getMobilites}
      columns={[
        { key: 'titre', label: t('admin.mobilites.columns.titre') },
        { key: 'paysDestination', label: t('admin.mobilites.columns.pays') },
        {
          key: 'type',
          label: t('admin.mobilites.columns.type'),
          render: (i) => <Badge tone="navy">{t(`enums.mobilityType.${i.type}`)}</Badge>,
        },
        {
          key: 'statut',
          label: t('admin.mobilites.columns.statut'),
          render: (i) => <Badge tone={mobilityStatusTone(i.statut)}>{t(`enums.mobilityStatus.${i.statut}`)}</Badge>,
        },
        { key: 'places', label: t('admin.mobilites.columns.places') },
      ]}
      fields={[
        { name: 'titre', label: t('admin.mobilites.fields.titre'), type: 'text' },
        {
          name: 'type',
          label: t('admin.mobilites.fields.type'),
          type: 'select',
          options: MOBILITY_TYPE.map((code) => ({ value: code, label: t(`enums.mobilityType.${code}`) })),
        },
        { name: 'programme', label: t('admin.mobilites.fields.programme'), type: 'select', options: PROGRAMMES },
        { name: 'paysDestination', label: t('admin.mobilites.fields.pays'), type: 'select', options: COUNTRIES },
        // destination_partner_id (FK partenaire) et host_institution (texte libre,
        // pour les cas où l'institution d'accueil n'est pas encore un partenaire)
        // coexistent en BDD : on garde les deux.
        { name: 'institutionAccueil', label: t('admin.mobilites.fields.institutionAccueil'), type: 'text' },
        { name: 'villeAccueil', label: t('admin.mobilites.fields.villeAccueil'), type: 'text' },
        { name: 'duree', label: t('admin.mobilites.fields.duree'), type: 'text' },
        { name: 'periode', label: t('admin.mobilites.fields.periode'), type: 'text' },
        { name: 'places', label: t('admin.mobilites.fields.places'), type: 'number' },
        { name: 'dateLimite', label: t('admin.mobilites.fields.dateLimite'), type: 'text' },
        {
          name: 'statut',
          label: t('admin.mobilites.fields.statut'),
          type: 'select',
          options: MOBILITY_STATUS.map((code) => ({ value: code, label: t(`enums.mobilityStatus.${code}`) })),
        },
        // "niveau" (Master / Doctorat / Enseignant-chercheur) n'existe pas
        // comme colonne dédiée en BDD : à décrire dans public_cible.
        { name: 'publicCible', label: t('admin.mobilites.fields.publicCible'), type: 'textarea' },
        { name: 'conditions', label: t('admin.mobilites.fields.conditions'), type: 'textarea' },
        { name: 'exigencesLinguistiques', label: t('admin.mobilites.fields.exigencesLinguistiques'), type: 'text' },
        { name: 'financement', label: t('admin.mobilites.fields.financement'), type: 'textarea' },
        { name: 'lienCandidature', label: t('admin.mobilites.fields.lienCandidature'), type: 'text' },
        { name: 'personneContact', label: t('admin.mobilites.fields.personneContact'), type: 'text' },
        { name: 'emailContact', label: t('admin.mobilites.fields.emailContact'), type: 'text' },
        { name: 'description', label: t('admin.mobilites.fields.description'), type: 'textarea' },
        {
          name: 'statutPublication',
          label: t('admin.mobilites.fields.statutPublication'),
          type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })),
        },
      ]}
    />
  );
}