import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, Paperclip } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { getAgreements, getFileUrl } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

const AGREEMENT_STATUS = ['active', 'expired', 'pending', 'negotiation'];

const AGREEMENT_STATUS_TONE = {
  active: 'green',
  expired: 'red',
  pending: 'amber',
  negotiation: 'cobalt',
};

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

const AgreementsList = () => {
  const { t, i18n } = useTranslation();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAgreements();
  }, [i18n.language]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const data = await getAgreements(i18n.language);
      const published = data.filter((a) => a.statutPublication === 'published');
      setAgreements(published);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => ({
    label: t(`enums.agreementStatus.${status}`, status),
    tone: AGREEMENT_STATUS_TONE[status] || 'default',
  });

  const filteredAgreements =
    filter === 'all' ? agreements : agreements.filter((a) => a.statut === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow={t('agreementsList.eyebrow', 'Partenariats')}
        title={t('agreementsList.title', 'Nos accords de partenariat')}
        description={t(
          'agreementsList.description',
          'Conventions et accords signés avec nos partenaires internationaux.'
        )}
      />

      {/* Filtres */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {t('common.all', 'Tous')}
        </Button>
        {AGREEMENT_STATUS.map((code) => (
          <Button
            key={code}
            variant={filter === code ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(code)}
          >
            {t(`enums.agreementStatus.${code}`)}
          </Button>
        ))}
      </div>

      {/* Nombre d'accords */}
      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {filteredAgreements.length} {t('agreementsList.itemsCount', 'accords')}
      </div>

      {/* Liste des accords */}
      {filteredAgreements.length === 0 ? (
        <div className="mt-12 text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            {t('agreementsList.empty', 'Aucun accord disponible pour le moment.')}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgreements.map((agreement) => {
            const status = getStatusBadge(agreement.statut);
            return (
              <Card key={agreement.id} hover className="flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {agreement.type && (
                    <Badge tone="navy" className="text-xs">
                      {agreement.type}
                    </Badge>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">
                  {agreement.titre}
                </h3>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {agreement.description}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  {agreement.partnerName && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('agreementsList.partner', 'Partenaire')} :</span>{' '}
                      {agreement.partnerName}
                    </p>
                  )}
                  {agreement.partnerCountry && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.pays', 'Pays')} :</span> {agreement.partnerCountry}
                    </p>
                  )}
                  {agreement.dateDebut && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.debut', 'Début')} :</span>{' '}
                      {formatDate(agreement.dateDebut)}
                    </p>
                  )}
                  {agreement.dateFin && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.fin', 'Fin')} :</span> {formatDate(agreement.dateFin)}
                    </p>
                  )}
                </div>

                {(agreement.fichierPdf || (Array.isArray(agreement.documents) && agreement.documents.length > 0)) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 inline-flex items-center gap-1.5">
                      <Paperclip size={14} className="text-cobalt" />
                      {t('documentsSection', { defaultValue: 'Documents' })}
                    </p>
                    <div className="space-y-2">
                      {agreement.fichierPdf && (
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {t('agreementsList.viewPdf', 'Consulter le PDF')}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">
                              PDF
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-3 shrink-0">
                            <a
                              href={getFileUrl(agreement.fichierPdf)}
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
                              onClick={() => downloadFile(agreement.fichierPdf, `${agreement.titre || 'accord'}.pdf`)}
                              className="text-green-600 hover:text-green-700 transition inline-flex items-center gap-1 text-xs font-medium"
                              title="Télécharger"
                            >
                              <Download size={14} />
                              <span>{t('telecharger', { defaultValue: 'Télécharger' })}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {Array.isArray(agreement.documents) && agreement.documents.map((doc) => {
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgreementsList;