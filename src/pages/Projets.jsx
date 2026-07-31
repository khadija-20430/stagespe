import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge, { statutTone } from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getProjets } from '../services/api.js';

export default function Projets() {
  const [projets, setProjets] = useState(null);
  const [programme, setProgramme] = useState('Tous');
  const [statut, setStatut] = useState('Tous');

  useEffect(() => {
    getProjets().then(setProjets);
  }, []);

  const programmes = useMemo(
    () => ['Tous', ...new Set((projets ?? []).map((p) => p.programme))],
    [projets]
  );
  const statuts = ['Tous', 'En cours', 'Terminé'];

  const filtres = useMemo(() => {
    if (!projets) return [];
    return projets.filter(
      (p) =>
        (programme === 'Tous' || p.programme === programme) &&
        (statut === 'Tous' || p.statut === statut)
    );
  }, [projets, programme, statut]);

  return (
    <div>
      <PageHeader
        eyebrow="Recherche"
        title="Projets de recherche"
        description="Découvrez les projets de recherche internationaux portés ou co-portés par l'école."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Programme</p>
            <div className="flex flex-wrap gap-2">
              {programmes.map((p) => (
                <FilterChip key={p} active={programme === p} onClick={() => setProgramme(p)}>
                  {p}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Statut</p>
            <div className="flex flex-wrap gap-2">
              {statuts.map((s) => (
                <FilterChip key={s} active={statut === s} onClick={() => setStatut(s)}>
                  {s}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {projets === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Aucun projet ne correspond aux filtres.</p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {filtres.map((p) => (
              <Card key={p.id} hover className="flex flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cobalt">{p.programme}</Badge>
                  <Badge tone={statutTone(p.statut)}>{p.statut}</Badge>
                </div>
                <h3 className="mt-4 text-xl font-bold text-navy">{p.titre}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600">{p.resume}</p>
                <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <dt className="text-slate-400">Coordinateur</dt>
                  <dd className="text-right font-medium text-slate-700">{p.coordinateur}</dd>
                  <dt className="text-slate-400">Budget</dt>
                  <dd className="text-right font-medium text-slate-700">{p.budget}</dd>
                  <dt className="text-slate-400">Période</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {formatDate(p.debut)} — {formatDate(p.fin)}
                  </dd>
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.pays.map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
