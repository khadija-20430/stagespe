import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getProjets } from '../services/api.js';
import { PROJECT_STATUS, projectStatusTone } from '../lib/enums.js';

const NUMBER_LOCALE = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

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
        (statut === 'tous' || p.statut === statut)
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
                  <Badge tone={projectStatusTone(p.statut)}>{t(`enums.projectStatus.${p.status}`)}</Badge>
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

                {/* LIVRABLES */}
                {Array.isArray(p.livrables) && p.livrables.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                      {t('projets.fields.deliverables')}
                    </p>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {p.livrables.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-cobalt">•</span>
                          <span>{typeof item === 'string' ? item : item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* RÉSULTATS */}
                {Array.isArray(p.resultats) && p.resultats.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                      {t('projets.fields.results')}
                    </p>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {p.resultats.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-cobalt">•</span>
                          <span>{typeof item === 'string' ? item : item.description}</span>
                        </li>
                      ))}
                    </ul>
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