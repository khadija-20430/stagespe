import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Eye, Loader2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getDocuments, getFileUrl, getProgrammesPublic } from '../services/api.js';

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


const getLangue = (d) => d.langue || d.langage || d.lang || null;
const getProgramme = (d) => d.programme || d.programmeNom || d.programme_nom || null;

const LANGUE_LABELS = { fr: 'Français', en: 'English', ar: 'العربية' };

export default function Documents() {
const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState(null);
  const [categorie, setCategorie] = useState('toutes');
  const [langue, setLangue] = useState('toutes');
  const [programme, setProgramme] = useState('tous');
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDocuments(i18n.language)
      .then(setDocuments)
      .catch((err) => {
        console.error('Erreur chargement:', err);
        setError(t('documents.errors.loadFailed'));
      });
  }, [t, i18n.language]);

  const categories = useMemo(
    () => ['toutes', ...new Set((documents ?? []).map((d) => d.categorie).filter(Boolean))],
    [documents]
  );

  const langues = useMemo(
    () => ['toutes', ...new Set((documents ?? []).map(getLangue).filter(Boolean))],
    [documents]
  );

  const programmes = useMemo(
    () => ['tous', ...new Set((documents ?? []).map(getProgramme).filter(Boolean))],
    [documents]
  );

  const filtres = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => {
      const matchCategorie = categorie === 'toutes' || d.categorie === categorie;
      const matchLangue = langue === 'toutes' || getLangue(d) === langue;
      const matchProgramme = programme === 'tous' || getProgramme(d) === programme;
      return matchCategorie && matchLangue && matchProgramme;
    });
  }, [documents, categorie, langue, programme]);

 
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

        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('documents.filters.category', { defaultValue: 'Catégorie' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <FilterChip key={`cat-${c}`} active={categorie === c} onClick={() => setCategorie(c)}>
                  {c === 'toutes'
                    ? t('common.allFem', { defaultValue: 'Toutes' })
                    : t(`enums.documentCategory.${c}`, { defaultValue: c })}
                </FilterChip>
              ))}
            </div>
          </div>

          {langues.length > 2 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('documents.filters.language', { defaultValue: 'Langue' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {langues.map((l) => (
                  <FilterChip key={`lang-${l}`} active={langue === l} onClick={() => setLangue(l)}>
                    {l === 'toutes'
                      ? t('common.allFem', { defaultValue: 'Toutes' })
                      : LANGUE_LABELS[l] || l.toUpperCase()}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}

          {programmes.length > 2 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('documents.filters.programme', { defaultValue: 'Programme' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {programmes.map((p) => (
                  <FilterChip key={`prog-${p}`} active={programme === p} onClick={() => setProgramme(p)}>
                    {p === 'tous' ? t('common.allMasc', { defaultValue: 'Tous' }) : p}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
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
                    <th className="hidden px-6 py-4 font-semibold lg:table-cell">
                      {t('documents.table.language', { defaultValue: 'Langue' })}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">{t('documents.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-slate-400">
                        {t('documents.noResults')}
                      </td>
                    </tr>
                  ) : (
                    filtres.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 font-medium text-navy dark:text-white">{d.titre || d.nom}</td>
                        <td className="px-6 py-4">
                          <Badge>{t(`enums.documentCategory.${d.categorie}`, { defaultValue: d.categorie })}</Badge>
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
                        <td className="hidden px-6 py-4 text-slate-600 dark:text-slate-400 lg:table-cell">
                          {LANGUE_LABELS[getLangue(d)] || getLangue(d) || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => handleDownload(d)}
                              size="sm"
                              variant="secondary"
                              disabled={downloading === d.id}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {downloading === d.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Download size={16} />
                                )}
                                {downloading === d.id ? t('documents.downloading') : t('documents.download')}
                              </span>
                            </Button>
                            <Button onClick={() => handleOpen(d)} size="sm" variant="outline">
                              <span className="inline-flex items-center gap-1.5">
                                <Eye size={16} />
                                {t('documents.open')}
                              </span>
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