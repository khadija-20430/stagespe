import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites } from '../services/api.js';
import { NEWS_TYPE } from '../lib/enums.js';

export default function Actualites() {
const { t, i18n } = useTranslation();
  const [actualites, setActualites] = useState(null);
  const [type, setType] = useState('tous');

   useEffect(() => {
     setActualites(null);
     getActualites(i18n.language).then(setActualites);
   }, [i18n.language]);

  const types = useMemo(
    () => ['tous', ...new Set((actualites ?? []).map((a) => a.type))],
    [actualites]
  );

  const filtres = useMemo(() => {
    if (!actualites) return [];
    return actualites.filter((a) => type === 'tous' || a.type === type);
  }, [actualites, type]);

  return (
    <div>
      <PageHeader
        eyebrow={t('actualites.eyebrow')}
        title={t('actualites.title')}
        description={t('actualites.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {types.map((code) => (
            <FilterChip key={code} active={type === code} onClick={() => setType(code)}>
              {code === 'tous' ? t('common.all') : t(`enums.newsType.${code}`)}
            </FilterChip>
          ))}
        </div>

        {actualites === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500 dark:text-slate-400">{t('actualites.empty')}</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtres.map((a) => (
              <Card key={a.id} hover className="flex flex-col overflow-hidden p-0">
                {a.imageUrl && <img src={a.imageUrl} alt="" className="h-44 w-full object-cover" />}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <Badge tone="cobalt">{t(`enums.newsType.${a.type}`)}</Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(a.eventDate)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy dark:text-white">{a.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{a.summary}</p>
                  <Link
                    to={`/actualites/${a.id}`}
                    className="mt-4 text-sm font-semibold text-cobalt hover:underline dark:text-blue-400"
                  >
                    {t('actualites.readMore')} →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}