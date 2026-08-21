import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getDocuments, createDocument, updateDocument, deleteDocument,
  getDocumentCategories, getToken,
} from '../../services/api.js';
import { toDocumentPayload } from '../../services/mappers.js';

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];
const VISIBILITY = ['public', 'staff', 'admin'];
const visibilityTone = (v) => (v === 'public' ? 'green' : v === 'staff' ? 'amber' : 'slate');

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

const API = import.meta.env.VITE_API_URL;

// Upload physique du fichier — renvoie fichier_url, file_size, file_format
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Échec de l\'upload du fichier');
  return res.json();
};

export default function ManageDocuments() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getDocumentCategories().then(setCategories);
  }, []);

  return (
    <CrudManager
      title={t('document')}
      idPrefix="doc"
      fetcher={getDocuments}
      toPayload={toDocumentPayload}
      onCreate={createDocument}
      onUpdate={updateDocument}
      onDelete={deleteDocument}
      columns={[
        { key: 'nom', label: t('titre') },
        { key: 'categorieLabel', label: t('categorie'),
          render: (i) => <Badge tone="cobalt">{i.categorieLabel}</Badge> },
        { key: 'format', label: t('format') },
        { key: 'taille', label: t('taille') },
        { key: 'date', label: t('date') },
      ]}
      fields={[
        { name: 'titre', label: t('titre'), type: 'text' },
        { name: 'description', label: t('description'), type: 'textarea' },
        {
          name: 'fichier_url',
          label: t('fichier'),
          type: 'file',
          onFile: async (file, setField) => {
            try {
              const uploaded = await uploadFile(file);
              setField('fichier_url', uploaded.fichier_url);
              setField('fileFormat', uploaded.file_format?.toUpperCase());
              setField('fileSize', uploaded.file_size);
            } catch (err) {
              alert(err.message);
            }
          },
        },
        { name: 'categorieId', label: t('categorie'), type: 'select',
          options: categories.map((c) => ({ value: c.id, label: c.label })) },
        { name: 'langage', label: t('langage'), type: 'select', options: LANGUAGES },
        { name: 'version', label: t('version'), type: 'text' },
        { name: 'visibilite', label: t('visibilite'), type: 'select',
          options: VISIBILITY.map((code) => ({ value: code, label: t(`enums.documentVisibility.${code}`) })) },
        { name: 'misEnAvant', label: t('misEnAvant'), type: 'select',
          options: [{ value: 'true', label: t('yes') }, { value: 'false', label: t('no') }] },
        { name: 'dateExpiration', label: t('dateExpiration'), type: 'text' },
      ]}
    />
  );
}