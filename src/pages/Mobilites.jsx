import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ExternalLink, Globe2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getMobilites, getMobiliteById } from '../services/api.js';

export default function Mobilites() {
  const { t, i18n } = useTranslation();
  const [mobilites, setMobilites] = useState(null);
  const [type, setType] = useState('tous');
  const [programme, setProgramme] = useState('tous');
  const [pays, setPays] = useState('tous');

  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(null);

  useEffect(() => {
    setMobilites(null);
    setExpandedId(null);
    setDetails({});
    getMobilites(i18n.language).then(setMobilites);
  }, [i18n.language]);

  const types = useMemo(
    () => ['tous', ...new Set((mobilites ?? []).map((m) => m.type))],
    [mobilites]
  );

  const programmes = useMemo(
    () => ['tous', ...new Set((mobilites ?? []).map((m) => m.programme).filter(Boolean))],
    [mobilites]
  );

  const paysListe = useMemo(
    () => ['tous', ...new Set((mobilites ?? []).map((m) => m.paysDestination).filter(Boolean))],
    [mobilites]
  );

  const filtres = useMemo(() => {
    if (!mobilites) return [];
    return mobilites.filter((m) =>
      (type === 'tous' || m.type === type) &&
      (programme === 'tous' || m.programme === programme) &&
      (pays === 'tous' || m.paysDestination === pays)
    );
  }, [mobilites, type, programme, pays]);

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!details[id]) {
      setDetailsLoading(id);
      try {
        const full = await getMobiliteById(id, i18n.language);
        setDetails((prev) => ({ ...prev, [id]: full }));
      } finally {
        setDetailsLoading(null);
      }
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('mobilites.eyebrow')}
        title={t('mobilites.title')}
        description={t('mobilites.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('mobilites.filters.type')}
            </p>
            <div className="flex flex-wrap gap-2">
              {types.map((code) => (
                <FilterChip key={code} active={type === code} onClick={() => setType(code)}>
                  {code === 'tous' ? t('common.all') : t(`enums.mobilityType.${code}`)}
                </FilterChip>
              ))}
            </div>
          </div>

          {programmes.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('mobilites.filters.programme')}
              </p>
              <div className="flex flex-wrap gap-2">
                {programmes.map((p) => (
                  <FilterChip key={p} active={programme === p} onClick={() => setProgramme(p)}>
                    {p === 'tous' ? t('common.all') : p}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}

          {paysListe.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('mobilites.filters.pays')}
              </p>
              <div className="flex flex-wrap gap-2">
                {paysListe.map((p) => (
                  <FilterChip key={p} active={pays === p} onClick={() => setPays(p)}>
                    {p === 'tous' ? t('common.all') : p}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
        </div>

        {mobilites === null ? (
          <Loader />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtres.map((m) => {
              const isOpen = expandedId === m.id;
              const full = details[m.id];
              const isLoading = detailsLoading === m.id;

              return (
                <Card key={m.id} hover className={`flex flex-col p-6 ${isOpen ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                  <div className="flex items-center justify-between">
                    <Badge tone="navy">{t(`enums.mobilityType.${m.type}`)}</Badge>
                    <span className="text-sm font-semibold text-cobalt dark:text-blue-400">
                      {t('mobilites.spots', { count: m.places })}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">{m.institutionAccueil}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {m.paysDestination} · {m.villeAccueil}
                  </p>
                  <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                    <dt className="text-slate-400 dark:text-slate-500">{t('mobilites.fields.duration')}</dt>
                    <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{m.duree}</dd>
                    <dt className="text-slate-400 dark:text-slate-500">{t('mobilites.fields.audience')}</dt>
                    <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{m.publicCible}</dd>
                    <dt className="text-slate-400 dark:text-slate-500">{t('mobilites.fields.programme')}</dt>
                    <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{m.programme}</dd>
                  </dl>

                  <button
                    type="button"
                    onClick={() => toggleExpand(m.id)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-sm font-medium text-cobalt hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    {isOpen ? (
                      <>{t('common.showLess')} <ChevronUp size={16} /></>
                    ) : (
                      <>{t('common.showMore')} <ChevronDown size={16} /></>
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                      {isLoading || !full ? (
                        <Loader />
                      ) : (
                        <>
                          {full.languageRequirements?.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 mb-2">
                                <Globe2 size={14} /> {t('mobilites.fields.languages')}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {full.languageRequirements.map((r) => (
                                  <Badge key={r.languageId} tone="slate">
                                    {r.languageName}{r.minLevel ? ` — ${r.minLevel}` : ''}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {full.conditions && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">{t('conditions')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{full.conditions}</p>
                            </div>
                          )}

                          {full.financement && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">{t('financement')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{full.financement}</p>
                            </div>
                          )}

                          {full.procedure && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">{t('mobilites.fields.procedure')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{full.procedure}</p>
                            </div>
                          )}

                          {full.criteres && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">{t('mobilites.fields.criteria')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{full.criteres}</p>
                            </div>
                          )}

                          {(full.contact || full.emailContact) && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">{t('personneContact')}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {full.contact} {full.emailContact && `— ${full.emailContact}`}
                              </p>
                            </div>
                          )}

                          {full.lien && (
                            <a
                              href={full.lien}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-cobalt hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                            >
                              {t('mobilites.apply')} <ExternalLink size={15} />
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}