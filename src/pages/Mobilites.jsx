import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getMobilites } from '../services/api.js';

export default function Mobilites() {
  const [mobilites, setMobilites] = useState(null);
  const [type, setType] = useState('Tous');

  useEffect(() => {
    getMobilites().then(setMobilites);
  }, []);

  const types = useMemo(
    () => ['Tous', ...new Set((mobilites ?? []).map((m) => m.type))],
    [mobilites]
  );

  const filtres = useMemo(() => {
    if (!mobilites) return [];
    return mobilites.filter((m) => type === 'Tous' || m.type === type);
  }, [mobilites, type]);

  return (
    <div>
      <PageHeader
        eyebrow="Mobilité"
        title="Opportunités de mobilité"
        description="Échanges étudiants, séjours doctoraux et missions d'enseignement chez nos partenaires internationaux."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Type de mobilité</p>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                {t}
              </FilterChip>
            ))}
          </div>
        </div>

        {mobilites === null ? (
          <Loader />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtres.map((m) => (
              <Card key={m.id} hover className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <Badge tone="navy">{m.type}</Badge>
                  <span className="text-sm font-semibold text-cobalt">{m.places} places</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">{m.destination}</h3>
                <p className="text-sm text-slate-500">{m.pays}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{m.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <dt className="text-slate-400">Durée</dt>
                  <dd className="text-right font-medium text-slate-700">{m.duree}</dd>
                  <dt className="text-slate-400">Niveau</dt>
                  <dd className="text-right font-medium text-slate-700">{m.niveau}</dd>
                  <dt className="text-slate-400">Programme</dt>
                  <dd className="text-right font-medium text-slate-700">{m.programme}</dd>
                </dl>
                <Button className="mt-5" size="sm">Candidater</Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
