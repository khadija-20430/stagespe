import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getDocuments, getFileUrl } from '../services/api.js';

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
      .catch((err) => {
        console.error('Erreur chargement:', err);
        setError(t('documents.errors.loadFailed'));
      });
  }, [t]);

  const categories = useMemo(
    () => ['toutes', ...new Set((documents ?? []).map((d) => d.categorie))],
    [documents]
  );

  const filtres = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => categorie === 'toutes' || d.categorie === categorie);
  }, [documents, categorie]);

  // ✅ Téléchargement réel du document.
  // Important : le lien <a download> ne force PAS le téléchargement pour une URL
  // cross-origin (frontend sur un port, backend sur un autre) — le navigateur
  // l'ignore et ouvre juste le fichier. On récupère donc le fichier en mémoire
  // (blob) puis on crée une URL locale blob:, que le navigateur télécharge toujours.
  const handleDownload = async (doc) => {
    setError(null);
    const url = getFileUrl(doc.fichier || doc.lien || doc.fichier_url);

    if (!url) {
      setError(t('documents.errors.noUrl'));
      return;
    }

    setDownloading(doc.id);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Nom de fichier : titre du document + extension d'origine (si trouvable dans l'URL)
      const extMatch = url.match(/\.[a-zA-Z0-9]+$/);
      const ext = extMatch ? extMatch[0] : '';
      const baseName = (doc.titre || doc.nom || 'document').replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName : `${baseName}${ext}`;

      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('❌ Erreur téléchargement:', err);
      setError(t('documents.errors.generic', { message: err.message }));
    } finally {
      setDownloading(null);
    }
  };

  // ✅ Ouvrir le document dans un nouvel onglet
  const handleOpen = (doc) => {
    setError(null);
    const url = getFileUrl(doc.fichier || doc.lien || doc.fichier_url);

    if (!url) {
      setError(t('documents.errors.noUrl'));
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
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
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
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
                      <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-slate-400">
                        {t('documents.noResults')}
                      </td>
                    </tr>
                  ) : (
                    filtres.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 font-medium text-navy dark:text-white">{d.titre || d.nom}</td>
                        <td className="px-6 py-4">
                          <Badge>{t(`enums.documentCategory.${d.categorie}`)}</Badge>
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 dark:text-slate-400 sm:table-cell">
                          {d.fileFormat || d.format || 'PDF'}
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 dark:text-slate-400 sm:table-cell">
                          {formatBytes(d.fileSize || d.taille)}
                        </td>
                        <td className="hidden px-6 py-4 text-slate-600 dark:text-slate-400 md:table-cell">
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
                              {downloading === d.id ? `⏳ ${t('documents.downloading')}` : `📥 ${t('documents.download')}`}
                            </Button>
                            <Button onClick={() => handleOpen(d)} size="sm" variant="outline">
                              👁️ {t('documents.open')}
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