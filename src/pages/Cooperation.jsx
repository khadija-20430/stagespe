import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getPartenaires } from '../services/api.js';

export default function Cooperation() {
  const { t } = useTranslation();
  const [partenaires, setPartenaires] = useState(null);

  useEffect(() => {
    getPartenaires().then(setPartenaires);
  }, []);

  const axes = ['research', 'mobility', 'degrees', 'networks'].map((key) => ({
    key,
    titre: t(`cooperation.axes.${key}.title`),
    texte: t(`cooperation.axes.${key}.text`),
    icone: { research: '🔬', mobility: '✈️', degrees: '🎓', networks: '🌐' }[key],
  }));

  return (
    <div>
      <PageHeader
        eyebrow={t('cooperation.eyebrow')}
        title={t('cooperation.title')}
        description={t('cooperation.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow={t('cooperation.axesSection.eyebrow')}
          title={t('cooperation.axesSection.title')}
          description={t('cooperation.axesSection.description')}
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {axes.map((a) => (
            <Card key={a.key} className="flex gap-4 p-6">
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
            eyebrow={t('cooperation.partnersSection.eyebrow')}
            title={t('cooperation.partnersSection.title')}
            description={t('cooperation.partnersSection.description')}
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
                      <dt className="text-slate-400">{t('cooperation.partnerFields.type')}</dt>
                      <dd className="text-right font-medium text-slate-700">{p.type}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{t('cooperation.partnerFields.agreement')}</dt>
                      <dd className="text-right font-medium text-slate-700">{p.accord.titre}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{t('cooperation.partnerFields.since')}</dt>
                      <dd className="text-right font-medium text-slate-700">{p.accord.depuis}</dd>
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