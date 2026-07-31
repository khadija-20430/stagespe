import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge, { statutTone } from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getAppels } from '../services/api.js';

export default function Appels() {
  const [appels, setAppels] = useState(null);
  const [programme, setProgramme] = useState('Tous');
  const [pays, setPays] = useState('Tous');
  const [statut, setStatut] = useState('Tous');

  useEffect(() => {
    getAppels().then(setAppels);
  }, []);

  const programmes = useMemo(
    () => ['Tous', ...new Set((appels ?? []).map((a) => a.programme))],
    [appels]
  );
  const listePays = useMemo(
    () => ['Tous', ...new Set((appels ?? []).map((a) => a.pays))],
    [appels]
  );
  const statuts = ['Tous', 'Ouvert', 'Bientôt', 'Fermé'];

  const filtres = useMemo(() => {
    if (!appels) return [];
    return appels.filter(
      (a) =>
        (programme === 'Tous' || a.programme === programme) &&
        (pays === 'Tous' || a.pays === pays) &&
        (statut === 'Tous' || a.statut === statut)
    );
  }, [appels, programme, pays, statut]);

  const Groupe = ({ label, options, value, onChange }) => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <FilterChip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </FilterChip>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Financements"
        title="Appels à projets"
        description="Filtrez les appels à projets par programme, pays et statut pour trouver les opportunités adaptées."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Groupe label="Programme" options={programmes} value={programme} onChange={setProgramme} />
          <Groupe label="Pays / zone" options={listePays} value={pays} onChange={setPays} />
          <Groupe label="Statut" options={statuts} value={statut} onChange={setStatut} />
        </div>

        {appels === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Aucun appel ne correspond aux filtres.</p>
        ) : (
          <div className="mt-10 space-y-4">
            {filtres.map((a) => (
              <Card key={a.id} hover className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cobalt">{a.programme}</Badge>
                    <Badge tone={statutTone(a.statut)}>{a.statut}</Badge>
                    <span className="text-xs text-slate-400">{a.pays}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy">{a.titre}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{a.resume}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">Échéance :</span> {formatDate(a.dateLimite)}
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-medium text-slate-700">Dotation :</span> {a.budget}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    as="a"
                    href={a.lien}
                    disabled={a.statut !== 'Ouvert'}
                    className={a.statut !== 'Ouvert' ? 'pointer-events-none opacity-50' : ''}
                  >
                    Postuler
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
