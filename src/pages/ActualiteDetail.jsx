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
        <h1 className="text-2xl font-bold text-navy dark:text-white">{t('actualiteDetail.notFoundTitle')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t('actualiteDetail.notFoundText')}</p>
        <Button as={Link} to="/actualites" className="mt-6">{t('actualiteDetail.backToList')}</Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/actualites" className="text-sm font-semibold text-cobalt hover:underline dark:text-blue-400">
        ← {t('actualiteDetail.backToList')}
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Badge tone="cobalt">{t(`enums.newsType.${actualite.type}`)}</Badge>
        {/* mapActualite() renvoie "eventDate", pas "date" */}
        <span className="text-sm text-slate-400 dark:text-slate-500">{formatDate(actualite.eventDate)}</span>
      </div>
      {/* mapActualite() renvoie "title", pas "titre" */}
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-navy dark:text-white">{actualite.title}</h1>
      {/* mapActualite() renvoie "imageUrl", pas "image" */}
      {actualite.imageUrl && (
        <img src={actualite.imageUrl} alt="" className="mt-8 h-72 w-full rounded-card object-cover" />
      )}
      {/* mapActualite() renvoie "summary" (résumé court) et "description" (contenu complet),
          pas "extrait"/"contenu" */}
      {actualite.summary && (
        <p className="mt-8 text-lg font-medium text-slate-700 dark:text-slate-300">{actualite.summary}</p>
      )}
      <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">{actualite.description}</p>

      {/* Champs spécifiques au type "testimonial" (author_name/quote_text...) exposés par le
          mapper mais absents de la version précédente : affichés seulement s'ils existent. */}
      {actualite.quoteText && (
        <blockquote className="mt-8 border-l-4 border-cobalt pl-4 italic text-slate-700 dark:border-blue-400 dark:text-slate-300">
          “{actualite.quoteText}”
          {actualite.authorName && (
            <footer className="mt-2 text-sm not-italic text-slate-500 dark:text-slate-400">
              — {actualite.authorName}
              {actualite.authorRole ? `, ${actualite.authorRole}` : ''}
            </footer>
          )}
        </blockquote>
      )}
    </article>
  );
}