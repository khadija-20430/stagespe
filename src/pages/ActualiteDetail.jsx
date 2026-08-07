import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualiteById } from '../services/api.js';

export default function ActualiteDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [actualite, setActualite] = useState(undefined);

  useEffect(() => {
    getActualiteById(id).then(setActualite);
  }, [id]);

  if (actualite === undefined) return <Loader />;

  if (actualite === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-navy">{t('actualiteDetail.notFoundTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('actualiteDetail.notFoundText')}</p>
        <Button as={Link} to="/actualites" className="mt-6">{t('actualiteDetail.backToList')}</Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/actualites" className="text-sm font-semibold text-cobalt hover:underline">
        ← {t('actualiteDetail.backToList')}
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Badge tone="cobalt">{t(`enums.newsType.${actualite.type}`)}</Badge>
        <span className="text-sm text-slate-400">{formatDate(actualite.date)}</span>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-navy">{actualite.titre}</h1>
      <img src={actualite.image} alt="" className="mt-8 h-72 w-full rounded-card object-cover" />
      <p className="mt-8 text-lg font-medium text-slate-700">{actualite.extrait}</p>
      <p className="mt-4 leading-relaxed text-slate-600">{actualite.contenu}</p>
    </article>
  );
}