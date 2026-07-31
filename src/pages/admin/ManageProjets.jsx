import CrudManager from './CrudManager.jsx';
import Badge, { statutTone } from '../../components/ui/Badge.jsx';
import { getProjets } from '../../services/api.js';

export default function ManageProjets() {
  return (
    <CrudManager
      title="Projets"
      idPrefix="proj"
      fetcher={getProjets}
      columns={[
        { key: 'titre', label: 'Titre' },
        { key: 'programme', label: 'Programme', render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'statut', label: 'Statut', render: (i) => <Badge tone={statutTone(i.statut)}>{i.statut}</Badge> },
        { key: 'budget', label: 'Budget' },
        { key: 'coordinateur', label: 'Coordinateur' },
      ]}
      fields={[
        { name: 'titre', label: 'Titre', type: 'text' },
        { name: 'programme', label: 'Programme', type: 'select', options: ['Horizon Europe', 'Erasmus+', 'Coopération bilatérale', 'Laboratoire commun'] },
        { name: 'statut', label: 'Statut', type: 'select', options: ['En cours', 'Terminé'] },
        { name: 'coordinateur', label: 'Coordinateur', type: 'text' },
        { name: 'budget', label: 'Budget', type: 'text' },
        { name: 'debut', label: 'Date de début', type: 'text' },
        { name: 'fin', label: 'Date de fin', type: 'text' },
        { name: 'pays', label: 'Pays', type: 'list' },
        { name: 'partenaires', label: 'Partenaires', type: 'list' },
        { name: 'resume', label: 'Résumé', type: 'textarea' },
      ]}
    />
  );
}
