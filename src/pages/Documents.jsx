import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getDocuments } from '../services/api.js';
import { DOCUMENT_CATEGORIES } from '../lib/enums.js';

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

export default function Documents() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState(null);
  const [categorie, setCategorie] = useState('toutes');
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .catch(err => {
        console.error('Erreur chargement:', err);
        setError('Impossible de charger les documents');
      });
  }, []);

  const categories = useMemo(
    () => ['toutes', ...new Set((documents ?? []).map((d) => d.categorie))],
    [documents]
  );

  const filtres = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => categorie === 'toutes' || d.categorie === categorie);
  }, [documents, categorie]);

  // ✅ Fonction de téléchargement améliorée
  const handleDownload = async (document) => {
    setDownloading(document.id);
    setError(null);
    
    try {
      // Récupérer l'URL du fichier
      let fileUrl = document.fichier || document.lien || document.fichier_url;
      
      if (!fileUrl) {
        throw new Error('URL du document non disponible');
      }
      
      // Vérifier si c'est une URL complète ou relative
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:13000/api';
      
      // Si l'URL est relative, construire l'URL complète
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        // Si l'URL commence par /, ne pas ajouter de slash supplémentaire
        fileUrl = fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : `${baseUrl}/${fileUrl}`;
      }
      
      console.log('📥 Téléchargement depuis:', fileUrl);
      
      // Récupérer le token pour l'authentification
      const token = localStorage.getItem('esi_admin_token');
      
      // Faire la requête
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      // Récupérer le nom du fichier
      let fileName = document.nom || document.titre || 'document';
      
      // Essayer d'extraire le nom du fichier depuis l'URL
      const urlParts = fileUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        fileName = lastPart;
      }
      
      // Télécharger le fichier
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Téléchargement réussi:', fileName);
      
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setError(`Erreur: ${error.message}`);
      
      // ✅ Si le téléchargement direct échoue, essayer d'ouvrir dans un nouvel onglet
      try {
        const fileUrl = document.fichier || document.lien || document.fichier_url;
        if (fileUrl) {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:13000/api';
          const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
          window.open(fullUrl, '_blank');
        }
      } catch (e) {
        alert('Impossible de télécharger le document. Veuillez contacter l\'administrateur.');
      }
    } finally {
      setDownloading(null);
    }
  };

  // ✅ Téléchargement direct (ouvrir dans un nouvel onglet)
  const handleOpen = (document) => {
    let fileUrl = document.fichier || document.lien || document.fichier_url;
    if (!fileUrl) {
      alert('URL du document non disponible');
      return;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:13000/api';
    if (!fileUrl.startsWith('http')) {
      fileUrl = fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : `${baseUrl}/${fileUrl}`;
    }
    
    window.open(fileUrl, '_blank');
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('documents.eyebrow')}
        title={t('documents.title')}
        description={t('documents.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip key={c} active={categorie === c} onClick={() => setCategorie(c)}>
              {c === 'toutes' ? t('common.allFem') : t(`enums.documentCategory.${c}`)}
            </FilterChip>
          ))}
        </div>

        {documents === null ? (
          <Loader />
        ) : (
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4 font-semibold">{t('documents.table.name')}</th>
                    <th className="px-6 py-4 font-semibold">{t('documents.table.category')}</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">{t('documents.table.format')}</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">{t('documents.table.size')}</th>
                    <th className="hidden px-6 py-4 font-semibold md:table-cell">{t('documents.table.updated')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('documents.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        Aucun document trouvé
                      </td>
                    </tr>
                  ) : (
                    filtres.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-navy">{d.titre || d.nom}</td>
                        <td className="px-6 py-4">
                          <Badge>{t(`enums.documentCategory.${d.categorie}`)}</Badge>
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">
                          {d.fileFormat || d.format || 'PDF'}
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">
                          {formatBytes(d.fileSize || d.taille)}
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 md:table-cell">
                          {formatDate(d.dateUpload || d.date)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => handleDownload(d)}
                              size="sm"
                              variant="secondary"
                              disabled={downloading === d.id}
                            >
                              {downloading === d.id ? (
                                '⏳ Téléchargement...'
                              ) : (
                                '📥 Télécharger'
                              )}
                            </Button>
                            <Button
                              onClick={() => handleOpen(d)}
                              size="sm"
                              variant="outline"
                            >
                              👁️ Ouvrir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}