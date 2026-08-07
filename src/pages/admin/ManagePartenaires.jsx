import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getPartenaires } from '../../services/api.js';

// Ces listes reprennent les valeurs seedées dans bdd.sql (table countries)
// et les CHECK constraints de la table partners. À terme, `pays` devrait
// venir d'un getCountries() plutôt que d'être codé en dur ici.
const COUNTRIES = [
  'Algérie', 'France', 'Allemagne', 'Espagne', 'Italie', 'Tunisie',
  'Maroc', 'Égypte', 'Turquie', 'Royaume-Uni', 'Canada', 'États-Unis',
];

// partnership_status (CHECK constraint sur partners)
const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];
const partnershipStatusTone = (s) => (s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'slate');

// statut_publication (workflow éditorial, commun à plusieurs tables)
const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManagePartenaires() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.partners')}
      idPrefix="part"
      fetcher={getPartenaires}
      columns={[
        { key: 'nom', label: t('admin.partenaires.columns.nom') },
        { key: 'pays', label: t('admin.partenaires.columns.pays') },
        { key: 'ville', label: t('admin.partenaires.columns.ville') },
        {
          key: 'statutPartenariat',
          label: t('admin.partenaires.columns.statutPartenariat'),
          render: (i) => <Badge tone={partnershipStatusTone(i.statutPartenariat)}>{t(`enums.partnershipStatus.${i.statutPartenariat}`)}</Badge>,
        },
        {
          key: 'statutPublication',
          label: t('admin.partenaires.columns.statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{t(`enums.publicationStatus.${i.statutPublication}`)}</Badge>,
        },
      ]}
      fields={[
        { name: 'nom', label: t('admin.partenaires.fields.nom'), type: 'text' },
        { name: 'nomOfficiel', label: t('admin.partenaires.fields.nomOfficiel'), type: 'text' },
        { name: 'pays', label: t('admin.partenaires.fields.pays'), type: 'select', options: COUNTRIES },
        { name: 'ville', label: t('admin.partenaires.fields.ville'), type: 'text' },
        {
          name: 'typeEtablissement',
          label: t('admin.partenaires.fields.typeEtablissement'),
          type: 'select',
          options: ['Université', 'Institut de recherche', 'Entreprise', 'Organisme public'],
        },
        {
          name: 'typePartenariat',
          label: t('admin.partenaires.fields.typePartenariat'),
          type: 'select',
          options: ['Convention cadre', 'Échange académique', 'Recherche conjointe', 'Co-diplomation'],
        },
        {
          name: 'statutPartenariat',
          label: t('admin.partenaires.fields.statutPartenariat'),
          type: 'select',
          options: PARTNERSHIP_STATUS.map((code) => ({ value: code, label: t(`enums.partnershipStatus.${code}`) })),
        },
        { name: 'siteWeb', label: t('admin.partenaires.fields.siteWeb'), type: 'text' },
        { name: 'domaines', label: t('admin.partenaires.fields.domaines'), type: 'list' },
        { name: 'description', label: t('admin.partenaires.fields.description'), type: 'textarea' },
        {
          name: 'logo',
          label: t('admin.partenaires.fields.logo'),
          type: 'file',
          accept: 'image/*',
          onFile: (file, setField) => setField('logo', file.name),
        },
        {
          name: 'statutPublication',
          label: t('admin.partenaires.fields.statutPublication'),
          type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })),
        },
      ]}
    />
  );
}