// src/pages/AgreementsList.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { getAgreements, getFileUrl } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

const AgreementsList = () => {
  const { t } = useTranslation();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const data = await getAgreements();
      // Filtrer uniquement les accords publiés
      const published = data.filter((a) => a.statutPublication === 'published');
      setAgreements(published);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'en_cours': { label: t('enums.projectStatus.ongoing', 'En cours'), tone: 'cobalt' },
      'signe': { label: 'Signé', tone: 'success' },
      'expire': { label: 'Expiré', tone: 'danger' },
      'en_negociation': { label: 'En négociation', tone: 'warning' },
    };
    return statusMap[status] || { label: status, tone: 'neutral' };
  };

  const filteredAgreements = filter === 'all' 
    ? agreements 
    : agreements.filter(a => a.statut === filter);

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
        description={t('agreementsList.description', 'Conventions et accords signés avec nos partenaires internationaux.')}
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
        <Button
          variant={filter === 'en_cours' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('en_cours')}
        >
          {t('enums.projectStatus.ongoing', 'En cours')}
        </Button>
        <Button
          variant={filter === 'signe' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('signe')}
        >
          Signés
        </Button>
        <Button
          variant={filter === 'en_negociation' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('en_negociation')}
        >
          En négociation
        </Button>
        <Button
          variant={filter === 'expire' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('expire')}
        >
          Expirés
        </Button>
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
                  {agreement.partenaire && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('agreementsList.partner', 'Partenaire')} :</span> {agreement.partenaire}
                    </p>
                  )}
                  {agreement.pays && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.pays', 'Pays')} :</span> {agreement.pays}
                    </p>
                  )}
                  {agreement.dateDebut && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.debut', 'Début')} :</span> {formatDate(agreement.dateDebut)}
                    </p>
                  )}
                  {agreement.dateFin && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{t('common.fin', 'Fin')} :</span> {formatDate(agreement.dateFin)}
                    </p>
                  )}
                </div>

                {/* Documents attachés */}
                {(agreement.fichierPdf || (agreement.documents && agreement.documents.length > 0)) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('agreementsList.linkedDocuments', 'Documents liés')} :
                    </p>
                    <div className="space-y-2">
                      {agreement.fichierPdf && (
                        <a
                          href={getFileUrl(agreement.fichierPdf)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-cobalt hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('agreementsList.viewPdf', 'Consulter le PDF')}
                        </a>
                      )}
                      {agreement.documents && agreement.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={getFileUrl(doc.fichier_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-cobalt hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {doc.titre} {doc.fileFormat && `(${doc.fileFormat})`}
                        </a>
                      ))}
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