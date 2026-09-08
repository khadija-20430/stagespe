import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites, getAppels, getMobilites, getPartenaires, getFileUrl, getProgrammesPublic, getHomeSlides, getProjets } from '../services/api.js';
import { callStatusTone, projectStatusTone } from '../lib/enums.js';
import esiLogo from '../assets/logo-esi.png';
import { Megaphone, Globe, GraduationCap, FlaskConical, Users, BookOpen } from 'lucide-react';

// Map string -> composant icône Lucide
const ICON_MAP = { GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen };

// FR=1, EN=2, AR=3 (correspond à la table `languages`)
const LANG_ID_MAP = { fr: 1, en: 2, ar: 3 };

// Locale pour le formatage de la monnaie
const NUMBER_LOCALE = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

function Hero({ slides, loading }) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides]);

  useEffect(() => {
    if (!slides.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-slate-800 to-navy">
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-12 flex flex-col items-center text-center">
            <img src={esiLogo} alt="ESI" className="h-24 w-auto mb-4 animate-pulse-scale" />
            <h2 className="text-4xl font-bold text-white">{t('home.hero.brandTitle')}</h2>
          </div>
          <div className="max-w-2xl mx-auto mb-8">
            <div className="rounded-2xl border border-slate-400/20 bg-gradient-to-br from-slate-500/15 via-slate-400/10 to-slate-500/15 backdrop-blur-xl p-10 shadow-2xl animate-pulse">
              <div className="h-6 w-32 rounded-full bg-slate-400/20 mb-6" />
              <div className="h-8 w-3/4 rounded bg-slate-400/20 mb-4" />
              <div className="h-4 w-full rounded bg-slate-400/10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!slides.length) return null;

  const currentSlideData = slides[currentSlide];
  const IconComponent = ICON_MAP[currentSlideData.icon_value] || GraduationCap;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-slate-800 to-navy">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cobalt/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-12 flex flex-col items-center text-center">
          <img src={esiLogo} alt="ESI" className="h-24 w-auto mb-4 animate-pulse-scale" />
          <h2 className="text-4xl font-bold text-white">{t('home.hero.brandTitle')}</h2>
        </div>

        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="rounded-2xl border border-slate-400/20 bg-gradient-to-br from-slate-500/15 via-slate-400/10 to-slate-500/15 backdrop-blur-xl p-10 shadow-2xl transition-all duration-500">
            <div className="mb-6 inline-block">
              <p key={`badge-${currentSlideData.id}`} className="inline-flex items-center gap-2 rounded-full border border-slate-300/30 bg-slate-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 animate-fade-in">
                <IconComponent size={14} />
                {currentSlideData.badge}
              </p>
            </div>

            <div className="mb-6 min-h-[100px] overflow-hidden">
              <h1 key={`title-${currentSlideData.id}`} className="text-3xl font-extrabold leading-tight text-white animate-slide-up">
                {currentSlideData.title}
              </h1>
            </div>

            <div className="min-h-[90px] overflow-hidden">
              <p key={`desc-${currentSlideData.id}`} className="text-base leading-relaxed text-slate-200 animate-slide-up delay-100 font-light">
                {currentSlideData.description}
              </p>
            </div>

            <div className="mt-10 flex justify-start gap-2">
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentSlide
                      ? 'bg-cobalt w-10 shadow-lg shadow-cobalt/50'
                      : 'bg-slate-400/30 w-2.5 hover:bg-slate-400/60'
                  }`}
                  aria-label={t('home.hero.slideAria', { number: index + 1 })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <Button as={Link} to="/programmes" size="lg" className="bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2">
              <GraduationCap size={20} /> {t('home.hero.ctaProgrammes')}
            </Button>
            <Button as={Link} to="/appels" size="lg" className="border-2 border-white/30 bg-white/5 backdrop-blur text-white font-semibold py-4 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all inline-flex items-center justify-center gap-2">
              <Megaphone size={20} /> {t('home.hero.ctaCalls')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();

  const [actualites, setActualites] = useState([]);
  const [appels, setAppels] = useState([]);
  const [mobilites, setMobilites] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [slides, setSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(true);

  // AU DÉPART : les stats sont vides avec '—'
  const [stats, setStats] = useState([
    { key: 'partners', value: '—' },
    { key: 'projects', value: '—' },
    { key: 'programmes', value: '—' },
    { key: 'mobility', value: '—' },
    { key: 'countries', value: '—' },
  ]);

  const currencyLocale = NUMBER_LOCALE[i18n.language] || 'fr-FR';

  // Slides du hero — rechargées à chaque changement de langue
  useEffect(() => {
    const langId = LANG_ID_MAP[i18n.language] || 1;
    setSlidesLoading(true);

    getHomeSlides(langId)
      .then((data) => setSlides(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch slides:', err);
        setSlides([]);
      })
      .finally(() => setSlidesLoading(false));
  }, [i18n.language]);

  // ⬇️ CORRECTION : On passe la langue à toutes les fonctions
  useEffect(() => {
    const lang = i18n.language;
    
    // Programmes
    getProgrammesPublic(lang)
      .then((d) => {
        const published = d.filter((p) => p.statut_publication === 'published');
        setProgrammes(published.slice(0, 3));
        setStats((prev) => prev.map(s => s.key === 'programmes' ? { ...s, value: String(published.length) } : s));
      })
      .catch((err) => console.error('Failed to fetch programmes:', err));

    // Partenaires - ✅ AJOUT DE LA LANGUE
    getPartenaires(lang)
      .then((d) => {
        const published = d.filter((p) => p.statut_publication === 'published');
        setPartenaires(published);
        setStats((prev) => prev.map(s => s.key === 'partners' ? { ...s, value: String(published.length) } : s));
        
        const uniqueCountries = new Set(published.map(p => p.pays)).size;
        setStats((prev) => prev.map(s => s.key === 'countries' ? { ...s, value: String(uniqueCountries) } : s));
      })
      .catch((err) => console.error('Failed to fetch partenaires:', err));

    // Mobilités ouvertes - ✅ AJOUT DE LA LANGUE
    getMobilites(lang)
      .then((d) => {
        const open = d.filter((m) => m.status === 'open');
        setMobilites(open.slice(0, 3));
        setStats((prev) => prev.map(s => s.key === 'mobility' ? { ...s, value: String(open.length) } : s));
      })
      .catch((err) => console.error('Failed to fetch mobilites:', err));

    // Projets - ✅ AJOUT DE LA LANGUE
    getProjets(lang)
      .then((d) => {
        const active = d.filter((p) => p.statut_publication === 'published');
        setProjets(active.slice(0, 3));
        setStats((prev) => prev.map(s => s.key === 'projects' ? { ...s, value: String(active.length) } : s));
      })
      .catch((err) => console.error('Failed to fetch projets:', err));

    // Appels - ✅ AJOUT DE LA LANGUE
    getAppels(lang)
      .then((d) => {
        const open = d.filter((a) => a.status === 'open');
        setAppels(open.slice(0, 3));
      })
      .catch((err) => console.error('Failed to fetch appels:', err));

    // Actualités - ✅ AJOUT DE LA LANGUE
    getActualites(lang)
      .then((d) => setActualites(d.slice(0, 3)))
      .catch(() => {});
    
  }, [i18n.language]);

  return (
    <div>
      <Hero slides={slides} loading={slidesLoading} />

      <section className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.key} className="text-center md:text-left">
              <div className="text-3xl font-extrabold text-navy dark:text-white">{s.value}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(`home.stats.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION PROGRAMMES */}
      <section className="bg-surface dark:bg-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={t('home.programmes.eyebrow')}
              title={t('home.programmes.title')}
              description={t('home.programmes.description')}
            />
            <Button as={Link} to="/programmes" variant="secondary" size="sm">
              {t('home.programmes.seeAll')}
            </Button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {programmes.map((p) => (
              <Card key={p.id} hover className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <Badge tone="cobalt">{p.acronym}</Badge>
                  {p.logo && <img src={p.logo} alt={p.name} className="h-8 w-8 object-contain" />}
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-cobalt dark:text-blue-400">
                    {p.projectsCount || 0} {t('programmesPage.credits')}
                  </span>
                 </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION PROJETS */}
      {projets.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow={t('projets.eyebrow')}
                title={t('projets.title')}
                description={t('projets.description')}
              />
              <Button as={Link} to="/projets" variant="secondary" size="sm">
                {t('projets.seeAll') || 'Voir tous les projets'}
              </Button>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {projets.map((proj) => (
                <Card key={proj.id} hover className="flex flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cobalt">{proj.programme}</Badge>
                    <Badge tone={projectStatusTone(proj.statut)}>{t(`enums.projectStatus.${proj.status}`)}</Badge>
                    {proj.isFeatured ? <Badge tone="amber">{t('projets.featured')}</Badge> : null}
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-navy dark:text-white">{proj.titre}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{proj.resume}</p>
                  
                  <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                    {proj.coordinateurPartenaire && (
                      <>
                        <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.coordinator')}</dt>
                        <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{proj.coordinateurPartenaire}</dd>
                      </>
                    )}
                    <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.budget')}</dt>
                    <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
                      {proj.budget != null
                        ? new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(proj.budget)
                        : '—'}
                    </dd>
                    <dt className="text-slate-400 dark:text-slate-500">{t('projets.fields.period')}</dt>
                    <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(proj.debut)} — {formatDate(proj.fin)}
                    </dd>
                  </dl>

                  {Array.isArray(proj.pays) && proj.pays.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {proj.pays.map((c) => (
                        <span key={c} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {proj.programme}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION APPELS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow={t('home.calls.eyebrow')}
            title={t('home.calls.title')}
            description={t('home.calls.description')}
          />
          <Button as={Link} to="/appels" variant="secondary" size="sm">
            {t('home.calls.seeAll')}
          </Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {appels.map((a) => (
            <Card key={a.id} hover className="flex flex-col p-6">
              <div className="flex items-center justify-between">
                <Badge tone="cobalt">{a.programme}</Badge>
                <Badge tone={callStatusTone(a.status)}>{t(`enums.callStatus.${a.status}`)}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">{a.titre}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{a.resume}</p>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('appels.deadline')} : {formatDate(a.dateLimite)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION MOBILITE */}
      <section className="bg-surface dark:bg-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={t('home.mobility.eyebrow')}
              title={t('home.mobility.title')}
              description={t('home.mobility.description')}
            />
            <Button as={Link} to="/mobilites" variant="secondary" size="sm">
              {t('home.mobility.seeAll')}
            </Button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {mobilites.map((m) => (
              <Card key={m.id} hover className="flex flex-col p-6">
                <Badge tone="navy">{t(`enums.mobilityType.${m.type}`)}</Badge>
                <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">{m.institutionAccueil}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{m.paysDestination} · {m.villeAccueil}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
                <p className="mt-4 text-sm font-semibold text-cobalt dark:text-blue-400">
                  {t('home.mobility.spots', { count: m.places })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION ACTUALITES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow={t('home.news.eyebrow')}
            title={t('home.news.title')}
            description={t('home.news.description')}
          />
          <Button as={Link} to="/actualites" variant="secondary" size="sm">
            {t('home.news.seeAll')}
          </Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {actualites.map((n) => (
            <Card key={n.id} hover className="flex flex-col overflow-hidden">
              {n.imageUrl && <img src={n.imageUrl} alt="" className="h-44 w-full object-cover" />}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between text-xs">
                  <Badge tone="cobalt">{t(`enums.newsType.${n.type}`)}</Badge>
                  <span className="text-slate-400 dark:text-slate-500">{formatDate(n.eventDate)}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-navy dark:text-white">{n.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{n.summary}</p>
                <Link to={`/actualites/${n.id}`} className="mt-4 text-sm font-semibold text-cobalt hover:underline dark:text-blue-400">
                  {t('actualites.readMore')} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION PARTENAIRES */}
      <section className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            center
            eyebrow={t('home.partners.eyebrow')}
            title={t('home.partners.title')}
            description={t('home.partners.description')}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {partenaires.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center rounded-card border border-slate-200 bg-surface p-4 text-center dark:border-slate-700 dark:bg-slate-800"
              >
                {p.logo ? (
                  <img
                    src={getFileUrl(p.logo)}
                    alt={p.nom}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <span className="text-2xl">🏫</span>
                )}
                <span className="mt-2 text-xs font-semibold text-navy dark:text-white">{p.nom}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{p.pays}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION ACCORDS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <SectionHeading
            center
            eyebrow={t('home.agreements.eyebrow')}
            title={t('home.agreements.title')}
            description={t('home.agreements.description')}
          />
          <div className="mt-8">
            <Button as={Link} to="/agreements" size="lg" variant="primary">
              {t('home.agreements.cta')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}