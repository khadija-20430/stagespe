import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge, { statutTone } from '../components/ui/Badge.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites, getAppels, getMobilites, getPartenaires } from '../services/api.js';

const stats = [
  { label: 'Partenaires internationaux', value: '32' },
  { label: 'Projets de recherche actifs', value: '18' },
  { label: 'Mobilités par an', value: '120+' },
  { label: 'Pays partenaires', value: '14' },
];

function Hero() {
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
          École Supérieure en Informatique
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Portail de la coopération internationale
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          Centralisez et découvrez l'ensemble des activités internationales de
          l'école : projets de recherche, appels à projets, opportunités de
          mobilité et partenariats académiques à travers le monde.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button as={Link} to="/appels" size="lg">
            Voir les appels à projets
          </Button>
          <Button as={Link} to="/mobilites" size="lg" variant="secondary"
            className="border-white/25 bg-transparent text-white hover:border-cobalt hover:text-blue-200">
            Explorer les mobilités
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [actualites, setActualites] = useState([]);
  const [appels, setAppels] = useState([]);
  const [mobilites, setMobilites] = useState([]);
  const [partenaires, setPartenaires] = useState([]);

  useEffect(() => {
    getActualites().then((d) => setActualites(d.slice(0, 3)));
    getAppels().then((d) => setAppels(d.filter((a) => a.statut === 'Ouvert').slice(0, 3)));
    getMobilites().then((d) => setMobilites(d.slice(0, 3)));
    getPartenaires().then(setPartenaires);
  }, []);

  return (
    <div>
      <Hero />

      {/* Statistiques */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <div className="text-3xl font-extrabold text-navy">{s.value}</div>
              <div className="mt-1 text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Appels à projets récents */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Opportunités"
            title="Appels à projets ouverts"
            description="Financements et programmes actuellement accessibles aux chercheurs et étudiants."
          />
          <Button as={Link} to="/appels" variant="secondary" size="sm">
            Tous les appels
          </Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {appels.map((a) => (
            <Card key={a.id} hover className="flex flex-col p-6">
              <div className="flex items-center justify-between">
                <Badge tone="cobalt">{a.programme}</Badge>
                <Badge tone={statutTone(a.statut)}>{a.statut}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">{a.titre}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{a.resume}</p>
              <p className="mt-4 text-sm font-medium text-slate-500">
                Échéance : {formatDate(a.dateLimite)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Mobilités */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Mobilité"
              title="Opportunités de mobilité"
              description="Échanges étudiants, séjours doctoraux et missions d'enseignement à l'international."
            />
            <Button as={Link} to="/mobilites" variant="secondary" size="sm">
              Toutes les mobilités
            </Button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {mobilites.map((m) => (
              <Card key={m.id} hover className="flex flex-col p-6">
                <Badge tone="navy">{m.type}</Badge>
                <h3 className="mt-4 text-lg font-bold text-navy">{m.destination}</h3>
                <p className="text-sm text-slate-500">{m.pays} · {m.duree}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{m.description}</p>
                <p className="mt-4 text-sm font-semibold text-cobalt">
                  {m.places} places disponibles
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Actualités */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="En ce moment"
            title="Actualités & événements"
            description="Les dernières nouvelles de la coopération internationale de l'école."
          />
          <Button as={Link} to="/actualites" variant="secondary" size="sm">
            Toutes les actualités
          </Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {actualites.map((n) => (
            <Card key={n.id} hover className="flex flex-col overflow-hidden">
              <img src={n.image} alt="" className="h-44 w-full object-cover" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between text-xs">
                  <Badge tone="cobalt">{n.categorie}</Badge>
                  <span className="text-slate-400">{formatDate(n.date)}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-navy">{n.titre}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600">{n.extrait}</p>
                <Link
                  to={`/actualites/${n.id}`}
                  className="mt-4 text-sm font-semibold text-cobalt hover:underline"
                >
                  Lire la suite →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Partenaires */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            center
            eyebrow="Réseau"
            title="Nos partenaires internationaux"
            description="Un réseau d'universités et d'instituts de recherche de premier plan."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {partenaires.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center rounded-card border border-slate-200 bg-surface p-4 text-center"
              >
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
