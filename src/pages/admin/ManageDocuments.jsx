import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getDocuments } from '../../services/api.js';
import { DOCUMENT_CATEGORIES } from '../../lib/enums.js';

export default function ManageDocuments() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.documents')}
      idPrefix="doc"
      fetcher={getDocuments}
      columns={[
        { key: 'nom', label: t('admin.documents.columns.nom') },
        {
          key: 'categorie',
          label: t('admin.documents.columns.categorie'),
          render: (i) => <Badge>{t(`enums.documentCategory.${i.categorie}`)}</Badge>,
        },
        { key: 'format', label: t('admin.documents.columns.format') },
        { key: 'taille', label: t('admin.documents.columns.taille') },
        { key: 'date', label: t('admin.documents.columns.date') },
      ]}
      fields={[
        { name: 'nom', label: t('admin.documents.fields.nom'), type: 'text' },
        {
          name: 'categorie',
          label: t('admin.documents.fields.categorie'),
          type: 'select',
          options: DOCUMENT_CATEGORIES.map((code) => ({ value: code, label: t(`enums.documentCategory.${code}`) })),
        },
        {
          name: 'format',
          label: t('admin.documents.fields.format'),
          type: 'file',
          accept: '.pdf,.doc,.docx,.xls,.xlsx',
          // Depuis le PC de l'admin : déduit le format depuis l'extension
          // et génère l'URL locale temporaire pour le champ 'lien'.
          onFile: (file, setField) => {
            const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
            setField('format', ext);
            setField('lien', URL.createObjectURL(file));
          },
        },
        { name: 'taille', label: t('admin.documents.fields.taille'), type: 'text' },
        { name: 'date', label: t('admin.documents.fields.date'), type: 'text' },
        { name: 'lien', label: t('admin.documents.fields.lien'), type: 'text' },
      ]}
    />
  );
}