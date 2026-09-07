import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getProgrammesPublic } from '../services/api.js';

export default function Programmes() {
  const { t, i18n } = useTranslation();
  const [programmes, setProgrammes] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setProgrammes(null);
    getProgrammesPublic(i18n.language).then(setProgrammes);
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
        eyebrow={t('programmes') || 'Programmes'}
        title={t('programmes') || 'Programmes de financement'}
        description={t('programmesDescription') || 
          'Découvrez les programmes de financement disponibles pour vos projets de coopération internationale.'}
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
            {filtered.map((p) => (
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
                    <img src={p.logo} alt={p.name}
                      className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
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

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {p.documentsCount > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {p.documentsCount} document{p.documentsCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {p.siteWeb && (
                    <a href={p.siteWeb} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-cobalt hover:text-blue-700 transition ml-auto">
                      {t('lienOfficiel') || 'Site officiel'} →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}