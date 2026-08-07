import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getPartenaires } from '../../services/api.js';

// L'admin travaille sur des champs plats ; on déplie/replie l'objet `accord`
// (résumé de la table `agreements`) uniquement pour cette page.
const fetchPartenairesFlat = () =>
  getPartenaires().then((list) =>
    list.map((p) => ({
      ...p,
      accordTitre: p.accord?.titre ?? '',
      accordDepuis: p.accord?.depuis ?? '',
    }))
  );

export default function ManagePartenaires() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.partners')}
      idPrefix="part"
      fetcher={fetchPartenairesFlat}
      columns={[
        { key: 'nom', label: t('admin.partenaires.columns.nom') },
        { key: 'pays', label: t('admin.partenaires.columns.pays') },
        { key: 'type', label: t('admin.partenaires.columns.type') },
        { key: 'accordTitre', label: t('admin.partenaires.columns.accord'), render: (i) => <Badge tone="cobalt">{i.accordTitre}</Badge> },
        { key: 'accordDepuis', label: t('admin.partenaires.columns.depuis') },
      ]}
      fields={[
        { name: 'nom', label: t('admin.partenaires.fields.nom'), type: 'text' },
        { name: 'pays', label: t('admin.partenaires.fields.pays'), type: 'text' },
        { name: 'ville', label: t('admin.partenaires.fields.ville'), type: 'text' },
        { name: 'type', label: t('admin.partenaires.fields.type'), type: 'select', options: ['Université', 'Institut de recherche', 'Entreprise'] },
        { name: 'accordTitre', label: t('admin.partenaires.fields.accord'), type: 'text' },
        { name: 'accordDepuis', label: t('admin.partenaires.fields.depuis'), type: 'number' },
        { name: 'domaines', label: t('admin.partenaires.fields.domaines'), type: 'list' },
        { name: 'logo', label: t('admin.partenaires.fields.logo'), type: 'text' },
      ]}
    />
  );
}