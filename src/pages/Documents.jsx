import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getDocuments } from '../services/api.js';

export default function Documents() {
  const [documents, setDocuments] = useState(null);
  const [categorie, setCategorie] = useState('Toutes');

  useEffect(() => {
    getDocuments().then(setDocuments);
  }, []);

  const categories = useMemo(
    () => ['Toutes', ...new Set((documents ?? []).map((d) => d.categorie))],
    [documents]
  );

  const filtres = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => categorie === 'Toutes' || d.categorie === categorie);
  }, [documents, categorie]);

  return (
    <div>
      <PageHeader
        eyebrow="Ressources"
        title="Bibliothèque de documents"
        description="Guides, formulaires, conventions et rapports liés à la coopération internationale."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip key={c} active={categorie === c} onClick={() => setCategorie(c)}>
              {c}
            </FilterChip>
          ))}
        </div>

        {documents === null ? (
          <Loader />
        ) : (
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4 font-semibold">Document</th>
                    <th className="px-6 py-4 font-semibold">Catégorie</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">Format</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">Taille</th>
                    <th className="hidden px-6 py-4 font-semibold md:table-cell">Mis à jour</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-navy">{d.nom}</td>
                      <td className="px-6 py-4"><Badge>{d.categorie}</Badge></td>
                      <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">{d.format}</td>
                      <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">{d.taille}</td>
                      <td className="hidden px-6 py-4 text-slate-600 md:table-cell">{formatDate(d.date)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button as="a" href={d.lien} size="sm" variant="secondary">Télécharger</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
