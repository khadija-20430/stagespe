import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getPartenaires } from '../../services/api.js';

export default function ManagePartenaires() {
  return (
    <CrudManager
      title="Partenaires"
      idPrefix="part"
      fetcher={getPartenaires}
      columns={[
        { key: 'nom', label: 'Nom' },
        { key: 'pays', label: 'Pays' },
        { key: 'type', label: 'Type' },
        { key: 'accord', label: 'Accord', render: (i) => <Badge tone="cobalt">{i.accord}</Badge> },
        { key: 'depuis', label: 'Depuis' },
      ]}
      fields={[
        { name: 'nom', label: 'Nom', type: 'text' },
        { name: 'pays', label: 'Pays', type: 'text' },
        { name: 'ville', label: 'Ville', type: 'text' },
        { name: 'type', label: 'Type', type: 'select', options: ['Université', 'Institut de recherche', 'Entreprise'] },
        { name: 'accord', label: 'Type d\u2019accord', type: 'text' },
        { name: 'depuis', label: 'Partenaire depuis', type: 'text' },
        { name: 'domaines', label: 'Domaines', type: 'list' },
        { name: 'logo', label: 'Emoji / logo', type: 'text' },
      ]}
    />
  );
}
