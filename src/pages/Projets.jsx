import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, Paperclip } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getProjets, getFileUrl } from '../services/api.js';
import { PROJECT_STATUS, projectStatusTone } from '../lib/enums.js';

const NUMBER_LOCALE = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

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

export default function Projets() {
  const { t, i18n } = useTranslation();
  const [projets, setProjets] = useState(null);
  const [programme, setProgramme] = useState('Tous');
  const [statut, setStatut] = useState('tous');

  useEffect(() => {
    setProjets(null);
    getProjets(i18n.language).then(setProjets);
  }, [i18n.language]);

  const programmes = useMemo(
    () => ['Tous', ...new Set((projets ?? []).map((p) => p.programme))],
    [projets]
  );

  const filtres = useMemo(() => {
    if (!projets) return [];
    return projets.filter(
      (p) =>
        (programme === 'Tous' || p.programme === programme) &&
        (statut === 'tous' || p.status === statut)
    );
  }, [projets, programme, statut]);

  const currencyLocale = NUMBER_LOCALE[i18n.language] || 'fr-FR';

  return (
    <div>
      <PageHeader
        eyebrow={t('projets.eyebrow')}
        title={t('projets.title')}
        description={t('projets.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('projets.filters.programme')}</p>
            <div className="flex flex-wrap gap-2">
              {programmes.map((p) => (
                <FilterChip key={p} active={programme === p} onClick={() => setProgramme(p)}>
                  {p === 'Tous' ? t('common.all') : p}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('projets.filters.status')}</p>
            <div className="flex flex-wrap gap-2">
              {['tous', ...PROJECT_STATUS].map((code) => (
                <FilterChip key={code} active={statut === code} onClick={() => setStatut(code)}>
                  {code === 'tous' ? t('common.all') : t(`enums.projectStatus.${code}`)}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {projets === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500 dark:text-slate-400">{t('projets.empty')}</p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {filtres.map((p) => (
              <Card key={p.id} hover className="flex flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cobalt">{p.programme}</Badge>
                  <Badge tone={projectStatusTone(p.status)}>{t(`enums.projectStatus.${p.status}`)}</Badge>
                  {p.isFeatured ? <Badge tone="amber">{t('projets.featured')}</Badge> : null}
                </div>
                <h3 className="mt-4 text-xl font-bold text-navy dark:text-white">{p.titre}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.resume}</p>

                <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                  {p.coordinateurPartenaire && (
                    <>
                      <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.coordinator')}</dt>
                      <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{p.coordinateurPartenaire}</dd>
                    </>
                  )}
                  <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.budget')}</dt>
                  <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
                    {p.budget != null
                      ? new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.budget)
                      : '—'}
                  </dd>
                  <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.period')}</dt>
                  <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
                    {formatDate(p.debut)} — {formatDate(p.fin)}
                  </dd>
                </dl>

                {Array.isArray(p.pays) && p.pays.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.pays.map((c) => (
                      <span key={c} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* 📎 DOCUMENTS */}
                {Array.isArray(p.documents) && p.documents.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 inline-flex items-center gap-1.5">
                      <Paperclip size={14} className="text-cobalt" />
                      {t('documentsSection', { defaultValue: 'Documents' })}                    </p>
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
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}