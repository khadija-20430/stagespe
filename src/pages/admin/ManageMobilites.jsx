import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getMobilites } from '../../services/api.js';

export default function ManageMobilites() {
  return (
    <CrudManager
      title="Mobilités"
      idPrefix="mob"
      fetcher={getMobilites}
      columns={[
        { key: 'destination', label: 'Destination' },
        { key: 'pays', label: 'Pays' },
        { key: 'type', label: 'Type', render: (i) => <Badge tone="navy">{i.type}</Badge> },
        { key: 'niveau', label: 'Niveau' },
        { key: 'places', label: 'Places' },
      ]}
      fields={[
        { name: 'destination', label: 'Destination', type: 'text' },
        { name: 'pays', label: 'Pays', type: 'text' },
        { name: 'type', label: 'Type', type: 'select', options: ['Étudiante', 'Doctorale', 'Enseignante'] },
        { name: 'niveau', label: 'Niveau', type: 'select', options: ['Master', 'Doctorat', 'Enseignant-chercheur'] },
        { name: 'duree', label: 'Durée', type: 'text' },
        { name: 'places', label: 'Places', type: 'text' },
        { name: 'programme', label: 'Programme', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  );
}
