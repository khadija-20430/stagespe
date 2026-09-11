import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, Paperclip } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getProgrammesPublic, getFileUrl } from '../services/api.js';

// Helpers documents
const getFileName = (path) => {
  if (!path) return 'document';
  try {
    const cleanPath = String(path).split('?')[0];
    return cleanPath.split('/').pop() || 'document';
  } catch {
    return 'document';
  }
};

const downloadFile = async (path, fallbackName = 'document') => {
  try {
    const url = getFileUrl(path);
    if (!url) throw new Error('Aucun fichier disponible');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Impossible de télécharger le fichier (${response.status})`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fallbackName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    alert(error.message || 'Erreur lors du téléchargement du fichier');
  }
};

export default function Programmes() {
  const { t, i18n } = useTranslation();
  const [programmes, setProgrammes] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setProgrammes(null);
    getProgrammesPublic(i18n.language)
      .then((data) => {
        const publishedOnly = data.filter((p) => p.statut_publication === 'published');
        setProgrammes(publishedOnly);
      })
      .catch((err) => {
        console.error('Erreur chargement programmes:', err);
        setProgrammes([]);
      });
  }, [i18n.language]);

  const filtered = useMemo(() => {
    if (!programmes) return [];
    if (!search.trim()) return programmes;
    const q = search.toLowerCase();
    return programmes.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.acronym?.toLowerCase().includes(q) ||
        p.organismeFinanceur?.toLowerCase().includes(q)
    );
  }, [programmes, search]);

  return (
    <div>
      <PageHeader
        eyebrow={t('programmesPage.eyebrow', { defaultValue: 'Formations' })}
  title={t('programmesPage.title', { defaultValue: 'Nos Programmes' })}
  description={t('programmesPage.description', { defaultValue: 'Découvrez nos programmes de formation' })}
  />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Barre de recherche */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('rechercher') || 'Rechercher un programme...'}
            className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition"
          />
        </div>

        {programmes === null ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-slate-500 dark:text-slate-400">
            {t('appels.empty') || 'Aucun programme trouvé.'}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const projectsCount = Number(p.projectsCount) || 0;
              return (
                <Card key={p.id} hover className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {p.acronym && (
                        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-cobalt/10 text-cobalt text-xs font-bold">
                          {p.acronym}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-navy dark:text-white leading-tight">
                        {p.name}
                      </h3>
                    </div>
                    {p.logo && (
                      <img
                        src={getFileUrl(p.logo)}
                        alt={p.name}
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    )}
                  </div>

                  {p.organismeFinanceur && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {p.organismeFinanceur}
                    </p>
                  )}

                  {p.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 flex-1 line-clamp-3">
                      {p.description}
                    </p>
                  )}

                  {/* 📎 DOCUMENTS */}
                  {Array.isArray(p.documents) && p.documents.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 inline-flex items-center gap-1.5">
                        <Paperclip size={14} className="text-cobalt" />
                        {t('documentsSection', { defaultValue: 'Documents' })}
                      </p>
                      <div className="space-y-2">
                        {p.documents.map((doc) => {
                          const filePath = doc.fichier_url;
                          if (!filePath) return null;
                          const fileUrl = getFileUrl(filePath);
                          const fileName = getFileName(filePath);

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                  {doc.titre || fileName}
                                </p>
                                {doc.file_format && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">
                                    {doc.file_format}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-3 shrink-0">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cobalt hover:text-blue-700 transition inline-flex items-center gap-1 text-xs font-medium"
                                  title="Voir"
                                >
                                  <Eye size={14} />
                                  <span>{t('voir', { defaultValue: 'Voir' })}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(filePath, fileName)}
                                  className="text-green-600 hover:text-green-700 transition inline-flex items-center gap-1 text-xs font-medium"
                                  title="Télécharger"
                                >
                                  <Download size={14} />
                                  <span>{t('telecharger', { defaultValue: 'Télécharger' })}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                    {projectsCount === 1
  ? t('projectsCount_one', { count: projectsCount, defaultValue: '1 projet' })
  : t('projectsCount_other', { count: projectsCount, defaultValue: `${projectsCount} projets` })
}
                    </span>

                    {p.siteWeb && (
                      <a
                        href={p.siteWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-cobalt hover:text-blue-700 transition ml-auto"
                      >
                        {t('lienOfficiel') || 'Site officiel'} →
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}