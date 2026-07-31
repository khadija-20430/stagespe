import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getPartenaires } from '../services/api.js';

const axes = [
  {
    titre: 'Recherche collaborative',
    texte:
      'Projets conjoints, co-encadrement de thèses et laboratoires communs avec nos partenaires académiques internationaux.',
    icone: '🔬',
  },
  {
    titre: 'Mobilité académique',
    texte:
      "Programmes d'échange pour étudiants, doctorants et enseignants-chercheurs, dans le cadre d'Erasmus+ et d'accords bilatéraux.",
    icone: '✈️',
  },
  {
    titre: 'Doubles diplômes',
    texte:
      'Cursus conjoints permettant l\u2019obtention de diplômes reconnus par plusieurs établissements partenaires.',
    icone: '🎓',
  },
  {
    titre: 'Réseaux & consortiums',
    texte:
      "Participation à des consortiums européens et internationaux autour des grands défis numériques.",
    icone: '🌐',
  },
];

export default function Cooperation() {
  const [partenaires, setPartenaires] = useState(null);

  useEffect(() => {
    getPartenaires().then(setPartenaires);
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="À propos"
        title="Coopération internationale"
        description="L'École Supérieure en Informatique développe une politique active de coopération avec des institutions de recherche et d'enseignement du monde entier."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Nos axes"
          title="Axes de coopération"
          description="Quatre grandes orientations structurent notre engagement international."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {axes.map((a) => (
            <Card key={a.titre} className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-2xl">
                {a.icone}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">{a.titre}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{a.texte}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Réseau"
            title="Établissements partenaires"
            description="Universités et instituts de recherche liés à l'école par des accords formels."
          />
          {partenaires === null ? (
            <Loader />
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partenaires.map((p) => (
                <Card key={p.id} hover className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.logo}</span>
                    <div>
                      <h3 className="font-bold text-navy">{p.nom}</h3>
                      <p className="text-sm text-slate-500">{p.ville}, {p.pays}</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">Type</dt>
                      <dd className="text-right font-medium text-slate-700">{p.type}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">Accord</dt>
                      <dd className="text-right font-medium text-slate-700">{p.accord}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">Depuis</dt>
                      <dd className="text-right font-medium text-slate-700">{p.depuis}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.domaines.map((d) => (
                      <span key={d} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {d}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
