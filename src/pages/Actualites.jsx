import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getActualites } from '../services/api.js';

export default function Actualites() {
  const [actualites, setActualites] = useState(null);
  const [categorie, setCategorie] = useState('Toutes');

  useEffect(() => {
    getActualites().then(setActualites);
  }, []);

  const categories = useMemo(
    () => ['Toutes', ...new Set((actualites ?? []).map((a) => a.categorie))],
    [actualites]
  );

  const filtres = useMemo(() => {
    if (!actualites) return [];
    return actualites.filter((a) => categorie === 'Toutes' || a.categorie === categorie);
  }, [actualites, categorie]);

  return (
    <div>
      <PageHeader
        eyebrow="Actualités"
        title="Actualités & événements"
        description="Suivez l'actualité de la coopération internationale : partenariats, projets, événements et opportunités."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip key={c} active={categorie === c} onClick={() => setCategorie(c)}>
              {c}
            </FilterChip>
          ))}
        </div>

        {actualites === null ? (
          <Loader />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtres.map((n) => (
              <Card key={n.id} hover className="flex flex-col overflow-hidden">
                <img src={n.image} alt="" className="h-48 w-full object-cover" />
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
        )}
      </section>
    </div>
  );
}
