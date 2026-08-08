import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites, getAppels, getMobilites, getPartenaires, getStats } from '../services/api.js';
import { callStatusTone } from '../lib/enums.js';

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 80% 0, #2563EB 0, transparent 40%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {t('home.hero.title')}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          {t('home.hero.description')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button as={Link} to="/appels" size="lg">
            {t('home.hero.ctaCalls')}
          </Button>
          <Button as={Link} to="/mobilites" size="lg" variant="secondary"
            className="border-white/25 bg-transparent text-blue-200 hover:border-cobalt hover:text-blue-200">
            {t('home.hero.ctaMobility')}
          </Button>
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

  useEffect(() => {
  getActualites().then((d) => setActualites(d.slice(0, 3)));
  getAppels().then((d) => setAppels(d.filter((a) => a.statut === 'open').slice(0, 3)));
  getMobilites().then((d) => setMobilites(d.slice(0, 3)));
  getPartenaires().then(setPartenaires);
  getStats().then((s) =>
    setStats([
      { key: 'partners', value: String(s.partners) },
      { key: 'projects', value: String(s.projects) },
      { key: 'mobility', value: String(s.openMobility) },
      { key: 'countries', value: String(s.countries) },
    ])
  );
}, []);

  const [stats, setStats] = useState([
  { key: 'partners', value: '—' },
  { key: 'projects', value: '—' },
  { key: 'mobility', value: '—' },
  { key: 'countries', value: '—' },
]);

  return (
    <div>
      <Hero />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="text-center md:text-left">
              <div className="text-3xl font-extrabold text-navy">{s.value}</div>
              <div className="mt-1 text-sm text-slate-500">{t(`home.stats.${s.key}`)}</div>
            </div>
          ))}
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
                <Badge tone={callStatusTone(a.statut)}>{t(`enums.callStatus.${a.statut}`)}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">{a.titre}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{a.resume}</p>
              <p className="mt-4 text-sm font-medium text-slate-500">
                {t('appels.deadline')} : {formatDate(a.dateLimite)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface">
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
                {/* destination_partner / host_institution + host_city, remplace l'ancien champ libre "destination" */}
                <h3 className="mt-4 text-lg font-bold text-navy">{m.institutionAccueil}</h3>
                <p className="text-sm text-slate-500">{m.paysDestination} · {m.villeAccueil}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{m.description}</p>
                <p className="mt-4 text-sm font-semibold text-cobalt">
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
          {/* news_events : titre/type/résumé/date_évènement/image_url (pas de colonne "catégorie" ni "extrait") */}
          {actualites.map((n) => (
            <Card key={n.id} hover className="flex flex-col overflow-hidden">
              <img src={n.imageUrl} alt="" className="h-44 w-full object-cover" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between text-xs">
                  <Badge tone="cobalt">{t(`enums.newsType.${n.type}`)}</Badge>
                  <span className="text-slate-400">{formatDate(n.eventDate)}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-navy">{n.titre}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600">{n.resume}</p>
                <Link to={`/actualites/${n.id}`} className="mt-4 text-sm font-semibold text-cobalt hover:underline">
                  {t('actualites.readMore')} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            center
            eyebrow={t('home.partners.eyebrow')}
            title={t('home.partners.title')}
            description={t('home.partners.description')}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {partenaires.map((p) => (
              <div key={p.id} className="flex flex-col items-center rounded-card border border-slate-200 bg-surface p-4 text-center">
                <span className="text-2xl">{p.logo}</span>
                <span className="mt-2 text-xs font-semibold text-navy">{p.nom}</span>
                <span className="text-[11px] text-slate-400">{p.pays}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}