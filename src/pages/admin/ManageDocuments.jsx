import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getDocuments } from '../../services/api.js';

export default function ManageDocuments() {
  return (
    <CrudManager
      title="Documents"
      idPrefix="doc"
      fetcher={getDocuments}
      columns={[
        { key: 'nom', label: 'Nom' },
        { key: 'categorie', label: 'Catégorie', render: (i) => <Badge>{i.categorie}</Badge> },
        { key: 'format', label: 'Format' },
        { key: 'taille', label: 'Taille' },
        { key: 'date', label: 'Date' },
      ]}
      fields={[
        { name: 'nom', label: 'Nom du document', type: 'text' },
        { name: 'categorie', label: 'Catégorie', type: 'select', options: ['Guide', 'Formulaire', 'Modèle', 'Rapport'] },
        { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'DOCX', 'XLSX'] },
        { name: 'taille', label: 'Taille', type: 'text' },
        { name: 'date', label: 'Date', type: 'text' },
        { name: 'lien', label: 'Lien', type: 'text' },
      ]}
    />
  );
}
