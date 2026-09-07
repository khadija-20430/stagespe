import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites, getAppels, getMobilites, getPartenaires, getStats, getFileUrl, getProgrammes } from '../services/api.js';
import { callStatusTone } from '../lib/enums.js';
import esiLogo from '../assets/logo-esi.png';
import { Megaphone, Globe, GraduationCap } from 'lucide-react'; 



function Hero() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = t('home.hero.slides', { returnObjects: true });

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-slate-800 to-navy">
      {/* Décoration de fond animée */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cobalt/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* Logo et titre */}
        <div className="mb-12 flex flex-col items-center text-center">
          <img
            src={esiLogo}
            alt="ESI"
            className="h-24 w-auto mb-4 animate-pulse-scale"
          />
          <h2 className="text-4xl font-bold text-white">
            {t('home.hero.brandTitle')}
          </h2>
        </div>

        {/* CADRE ANIMÉ - CENTRÉ */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="rounded-2xl border border-slate-400/20 bg-gradient-to-br from-slate-500/15 via-slate-400/10 to-slate-500/15 backdrop-blur-xl p-10 shadow-2xl transition-all duration-500">

            {/* Badge avec animation */}
            <div className="mb-6 inline-block">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/30 bg-slate-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 animate-fade-in">
                {currentSlideData.eyebrow}
              </p>
            </div>

            {/* Titre avec animation */}
            <div className="mb-6 min-h-[100px] overflow-hidden">
              <h1 className="text-3xl font-extrabold leading-tight text-white animate-slide-up">
                {currentSlideData.title}
              </h1>
            </div>

            {/* Description avec animation */}
            <div className="min-h-[90px] overflow-hidden">
              <p className="text-base leading-relaxed text-slate-200 animate-slide-up delay-100 font-light">
                {currentSlideData.description}
              </p>
            </div>

            {/* Indicateurs */}
            <div className="mt-10 flex justify-start gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
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

          <div className="absolute -inset-4 bg-gradient-to-r from-slate-400/10 via-slate-300/10 to-transparent rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>

        {/* BOUTONS */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">

<Button
  as={Link}
  to="/programmes"
  size="lg"
  className="bg-gradient-to-r from-cobalt to-blue-600 hover:from-cobalt hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2"
>
  <GraduationCap size={20} /> {t('home.hero.ctaProgrammes')}
</Button>

<Button
  as={Link}
  to="/appels"
  size="lg"
  className="border-2 border-white/30 bg-white/5 backdrop-blur text-white font-semibold py-4 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all inline-flex items-center justify-center gap-2"
>
  <Megaphone size={20} /> {t('home.hero.ctaCalls')}
</Button>

          </div>
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  const { t } = useTranslation();
  const [actualites, setActualites] = useState([]);
  const [appels, setAppels] = useState([]);
  const [mobilites, setMobilites] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [programmes, setProgrammes] = useState([]); // Ajout des programmes
  const [stats, setStats] = useState([
    { key: 'partners', value: '—' },
    { key: 'projects', value: '—' },
    { key: 'programmes', value: '—' }, // Ajout des programmes dans les stats
    { key: 'mobility', value: '—' },
    { key: 'countries', value: '—' },
  ]);

  useEffect(() => {
    getActualites().then((d) => setActualites(d.slice(0, 3)));
    getAppels().then((d) => setAppels(d.filter((a) => a.status === 'open').slice(0, 3)));
    getMobilites().then((d) => setMobilites(d.slice(0, 3)));
    getPartenaires().then(setPartenaires);
    getProgrammes().then((d) => setProgrammes(d.slice(0, 3))); // Récupération des programmes
    getStats().then((s) =>
      setStats([
        { key: 'partners', value: String(s.partners) },
        { key: 'projects', value: String(s.projects) },
        { key: 'programmes', value: String(s.programmes || 0) }, // Ajout des programmes dans les stats
        { key: 'mobility', value: String(s.openMobility) },
        { key: 'countries', value: String(s.countries) },
      ])
    );
  }, []);

  return (
    <div>
      <Hero />

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

      {/* SECTION PROGRAMMES - AJOUTÉE */}
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
                  <Badge tone="cobalt">{p.niveau}</Badge>
                  <Badge tone="navy">{p.duree}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy dark:text-white">{p.titre}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-cobalt dark:text-blue-400">
                    {p.credits} {t('programmes.credits')}
                  </span>
                  <Link 
                    to={`/programmes/${p.id}`} 
                    className="text-sm font-semibold text-cobalt hover:underline dark:text-blue-400"
                  >
                    {t('programmes.learnMore')} →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

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