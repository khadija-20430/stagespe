import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FileText, Star, Lightbulb, Handshake } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Loader from '../components/ui/Loader.jsx';
import esiLogo from '../assets/logo-esi.png';
import { getSchoolPresentationByLanguage, getFileUrl } from '../services/api.js';

export default function School() {
  const { t, i18n } = useTranslation();

  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPresentation = async () => {
      try {
        // On tente d'abord la langue courante
        let data = await getSchoolPresentationByLanguage(i18n.language);
        if (!cancelled) {
          setPresentation(data);
        }
      } catch (err) {
        console.warn(`Pas de traduction en ${i18n.language}, fallback sur fr`, err);
        try {
          // Fallback sur français
          const fallbackData = await getSchoolPresentationByLanguage('fr');
          if (!cancelled) {
            setPresentation(fallbackData);
          }
        } catch (fallbackErr) {
          console.error('Erreur chargement présentation (fallback):', fallbackErr);
          if (!cancelled) {
            setError(fallbackErr.message || 'unknown');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPresentation();

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  // ============================================================
  // RENDU
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        {/* La clé "school.error.loading" existe déjà en fr/en/ar : i18next renvoie
            la clé elle-même si elle est absente, jamais une chaîne vide/falsy,
            donc le "|| fallback" précédent n'avait aucun effet. Supprimé. */}
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold text-navy dark:text-white">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          {t('school.error.loading')}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{error}</p>
      </section>
    );
  }

  return (
    <div>
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden bg-navy">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 80% 0, #2563EB 0, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <img src={esiLogo} alt="ESI" className="mb-6 h-16 w-auto" />

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {presentation?.titre || t('school.defaultTitle')}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            {presentation?.description || t('school.defaultDescription')}
          </p>

          {presentation?.fichierUrl && (
            <a
              href={getFileUrl(presentation.fichierUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cobalt px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
              {t('school.download')}
              {presentation.fileFormat ? ` (${presentation.fileFormat.toUpperCase()})` : ''}
            </a>
          )}
        </div>
      </section>

      {/* =========================================================
          ABOUT SECTION
      ========================================================= */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          title={t('school.about.title')}
          description={t('school.about.description')}
        />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold text-navy dark:text-white">{t('school.about.mission.title')}</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">{t('school.about.mission.text')}</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy dark:text-white">{t('school.about.values.title')}</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-400">{t('school.about.values.text')}</p>
          </div>
        </div>

        {/* Valeurs additionnelles */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {['excellence', 'innovation', 'collaboration'].map((value) => {
            const ValueIcon =
              value === 'excellence' ? Star : value === 'innovation' ? Lightbulb : Handshake;
            return (
              <div key={value} className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
                <ValueIcon className="mx-auto h-9 w-9 text-cobalt" aria-hidden="true" />
                <h4 className="mt-3 font-bold text-navy dark:text-white">{t(`school.values.${value}.title`)}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t(`school.values.${value}.text`)}</p>
              </div>
            );
          })}
        </div>

        {!presentation && (
          <p className="mt-8 text-sm text-slate-400 dark:text-slate-500">
            {t('school.noContent')}
          </p>
        )}
      </section>
    </div>
  );
}