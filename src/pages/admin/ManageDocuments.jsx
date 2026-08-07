import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getDocuments } from '../../services/api.js';

// Correspond aux lignes seedées dans document_categories (bdd.sql).
// À terme : remplacer par un getDocumentCategories().
const DOCUMENT_CATEGORIES = [
  { value: 'institutionnel', label: 'Institutionnel et coopération' },
  { value: 'template_projet', label: 'Template de proposition de projet' },
  { value: 'formulaire_financier', label: 'Formulaire financier et administratif' },
  { value: 'erasmus_mobilite', label: 'Document mobilité Erasmus+' },
  { value: 'horizon_msca', label: 'Template Horizon Europe / MSCA' },
  { value: 'national', label: 'Programme national' },
  { value: 'guide_faq', label: 'Guide, procédure, FAQ' },
  { value: 'rapport', label: 'Rapport de projet' },
  { value: 'brochure', label: 'Brochure institutionnelle' },
  { value: 'convention', label: 'Convention signée' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

// visibilite (CHECK constraint sur documents)
const VISIBILITY = ['public', 'staff', 'admin'];
const visibilityTone = (v) => (v === 'public' ? 'green' : v === 'staff' ? 'amber' : 'slate');

const categoryLabel = (code) => DOCUMENT_CATEGORIES.find((c) => c.value === code)?.label ?? code;

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

export default function ManageDocuments() {
  const { t } = useTranslation();
  return (
    <CrudManager
      title={t('admin.nav.documents')}
      idPrefix="doc"
      fetcher={getDocuments}
      columns={[
        { key: 'titre', label: t('admin.documents.columns.titre') },
        {
          key: 'categorie',
          label: t('admin.documents.columns.categorie'),
          render: (i) => <Badge tone="cobalt">{categoryLabel(i.categorie)}</Badge>,
        },
        { key: 'fileFormat', label: t('admin.documents.columns.format') },
        // file_size est stocké en octets (BIGINT) ; on ne l'affiche jamais
        // brut, toujours formaté en Ko/Mo pour l'admin.
        { key: 'fileSize', label: t('admin.documents.columns.taille'), render: (i) => formatBytes(i.fileSize) },
        { key: 'dateUpload', label: t('admin.documents.columns.date') },
        {
          key: 'visibilite',
          label: t('admin.documents.columns.visibilite'),
          render: (i) => <Badge tone={visibilityTone(i.visibilite)}>{t(`enums.documentVisibility.${i.visibilite}`)}</Badge>,
        },
      ]}
      fields={[
        { name: 'titre', label: t('admin.documents.fields.titre'), type: 'text' },
        { name: 'description', label: t('admin.documents.fields.description'), type: 'textarea' },
        {
          name: 'fichier',
          label: t('admin.documents.fields.fichier'),
          type: 'file',
          // format et taille ne se saisissent jamais à la main : ils sont
          // déduits automatiquement du fichier réellement uploadé.
          onFile: (file, setField) => {
            setField('fichier', file.name);
            setField('fileFormat', (file.name.split('.').pop() || '').toUpperCase());
            setField('fileSize', file.size);
          },
        },
        { name: 'categorie', label: t('admin.documents.fields.categorie'), type: 'select', options: DOCUMENT_CATEGORIES },
        { name: 'langage', label: t('admin.documents.fields.langage'), type: 'select', options: LANGUAGES },
        { name: 'version', label: t('admin.documents.fields.version'), type: 'text' },
        {
          name: 'visibilite',
          label: t('admin.documents.fields.visibilite'),
          type: 'select',
          options: VISIBILITY.map((code) => ({ value: code, label: t(`enums.documentVisibility.${code}`) })),
        },
        {
          name: 'misEnAvant',
          label: t('admin.documents.fields.misEnAvant'),
          type: 'select',
          options: [{ value: 'true', label: t('admin.common.yes') }, { value: 'false', label: t('admin.common.no') }],
        },
        { name: 'dateExpiration', label: t('admin.documents.fields.dateExpiration'), type: 'text' },
        // fileFormat / fileSize restent modifiables ici en secours (import de
        // données de démo) mais ne devraient plus l'être une fois branché
        // sur un vrai upload de fichier.
        { name: 'fileFormat', label: t('admin.documents.fields.format'), type: 'text' },
        { name: 'fileSize', label: t('admin.documents.fields.taille'), type: 'number' },
      ]}
    />
  );
}