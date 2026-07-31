import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import {
  getAppels,
  getDocuments,
  getMobilites,
  getPartenaires,
  getProjets,
} from '../../services/api.js';

const config = [
  { key: 'partenaires', label: 'Partenaires', fetch: getPartenaires, icon: '🤝' },
  { key: 'projets', label: 'Projets', fetch: getProjets, icon: '🔬' },
  { key: 'appels', label: 'Appels à projets', fetch: getAppels, icon: '📢' },
  { key: 'mobilites', label: 'Mobilités', fetch: getMobilites, icon: '✈️' },
  { key: 'documents', label: 'Documents', fetch: getDocuments, icon: '📄' },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    config.forEach((c) => {
      c.fetch().then((d) => setCounts((prev) => ({ ...prev, [c.key]: d.length })));
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Tableau de bord</h1>
      <p className="mt-1 text-slate-600">
        Vue d'ensemble et gestion des contenus du portail (données mockées).
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {config.map((c) => (
          <Card key={c.key} className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl">
              {c.icon}
            </div>
            <div>
              <div className="text-3xl font-extrabold text-navy" translate="no">
                {counts[c.key] ?? '—'}
              </div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-bold text-navy">À propos de cette interface</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Cette interface d'administration simule les opérations CRUD (créer,
          lire, modifier, supprimer) en mémoire. Les modifications ne sont pas
          persistées : elles disparaissent au rechargement de la page. La couche
          de services (<code className="rounded bg-slate-100 px-1 py-0.5">/src/services</code>)
          est prête à être connectée à une API REST externe.
        </p>
      </Card>
    </div>
  );
}
