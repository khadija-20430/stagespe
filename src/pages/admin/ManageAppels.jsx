import CrudManager from './CrudManager.jsx';
import Badge, { statutTone } from '../../components/ui/Badge.jsx';
import { getAppels } from '../../services/api.js';

export default function ManageAppels() {
  return (
    <CrudManager
      title="Appels à projets"
      idPrefix="app"
      fetcher={getAppels}
      columns={[
        { key: 'titre', label: 'Titre' },
        { key: 'programme', label: 'Programme', render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
        { key: 'pays', label: 'Pays' },
        { key: 'statut', label: 'Statut', render: (i) => <Badge tone={statutTone(i.statut)}>{i.statut}</Badge> },
        { key: 'dateLimite', label: 'Échéance' },
      ]}
      fields={[
        { name: 'titre', label: 'Titre', type: 'text' },
        { name: 'programme', label: 'Programme', type: 'select', options: ['Horizon Europe', 'Erasmus+', 'Coopération bilatérale', 'Échange étudiant'] },
        { name: 'pays', label: 'Pays / zone', type: 'text' },
        { name: 'statut', label: 'Statut', type: 'select', options: ['Ouvert', 'Bientôt', 'Fermé'] },
        { name: 'dateLimite', label: 'Date limite', type: 'text' },
        { name: 'budget', label: 'Dotation', type: 'text' },
        { name: 'resume', label: 'Résumé', type: 'textarea' },
      ]}
    />
  );
}
