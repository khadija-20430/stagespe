import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Plane, GraduationCap, Globe2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Loader from '../components/ui/Loader.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import { getPartenaires, getFileUrl, getPartenairesMap } from '../services/api.js';
import PartnersMap from '../components/PartnersMap.jsx';

export default function Cooperation() {
  const { t, i18n } = useTranslation();
  const [partenaires, setPartenaires] = useState(null);
  const [partenairesMap, setPartenairesMap] = useState(null);

  // --- Filtres ---
  const [pays, setPays] = useState('Tous');
  const [typeEtab, setTypeEtab] = useState('Tous');
  const [domaine, setDomaine] = useState('Tous');
  const [statut, setStatut] = useState('Tous');

  useEffect(() => {
    setPartenaires(null);
    getPartenaires(i18n.language).then(setPartenaires);
  }, [i18n.language]);

  useEffect(() => {
    getPartenairesMap().then(setPartenairesMap);
  }, []);

  const axes = ['research', 'mobility', 'degrees', 'networks'].map((key) => ({
    key,
    titre: t(`cooperation.axes.${key}.title`),
    texte: t(`cooperation.axes.${key}.text`),
    Icone: { research: FlaskConical, mobility: Plane, degrees: GraduationCap, networks: Globe2 }[key],
    couleur: {
      research: 'text-blue-600 bg-blue-50 dark:bg-cobalt/20',
      mobility: 'text-sky-600 bg-sky-50 dark:bg-cobalt/20',
      degrees: 'text-indigo-600 bg-indigo-50 dark:bg-cobalt/20',
      networks: 'text-emerald-600 bg-emerald-50 dark:bg-cobalt/20',
    }[key],
  }));

  // --- Animation d'apparition au scroll ---
  const axesRef = useRef(null);
  const [axesVisible, setAxesVisible] = useState(false);

  useEffect(() => {
    const el = axesRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAxesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Options de filtres construites depuis les données réelles ---
  const listePays = useMemo(
    () => ['Tous', ...new Set((partenaires ?? []).map((p) => p.pays).filter(Boolean))],
    [partenaires]
  );
  const listeTypesEtab = useMemo(
    () => ['Tous', ...new Set((partenaires ?? []).map((p) => p.typeEtablissement).filter(Boolean))],
    [partenaires]
  );
  const listeDomaines = useMemo(
    () => ['Tous', ...new Set((partenaires ?? []).flatMap((p) => p.domaines ?? []))],
    [partenaires]
  );
  // mapPartner() renvoie "partnershipStatus" : 'active' | 'pending' | 'ended'
  // (voir partners_partnership_status_check). Clés déjà présentes à la racine
  // des fichiers de langue (t('active'), t('pending'), t('ended')).
  const listeStatuts = useMemo(
    () => ['Tous', ...new Set((partenaires ?? []).map((p) => p.partnershipStatus).filter(Boolean))],
    [partenaires]
  );

  const partenairesFiltres = useMemo(() => {
    if (!partenaires) return [];
    return partenaires.filter(
      (p) =>
        (pays === 'Tous' || p.pays === pays) &&
        (typeEtab === 'Tous' || p.typeEtablissement === typeEtab) &&
        (domaine === 'Tous' || (p.domaines ?? []).includes(domaine)) &&
        (statut === 'Tous' || p.partnershipStatus === statut)
    );
  }, [partenaires, pays, typeEtab, domaine, statut]);

  const Groupe = ({ label, options, value, onChange, getLabel = (o) => o }) => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <FilterChip key={o} active={value === o} onClick={() => onChange(o)}>
            {o === 'Tous' ? t('common.all') : getLabel(o)}
          </FilterChip>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow={t('cooperation.eyebrow')}
        title={t('cooperation.title')}
        description={t('cooperation.description')}
      />

      <section ref={axesRef} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow={t('cooperation.axesSection.eyebrow')}
          title={t('cooperation.axesSection.title')}
          description={t('cooperation.axesSection.description')}
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {axes.map((a, i) => (
            <Card
              key={a.key}
              className={`group flex gap-4 p-6 transition-all duration-700 ease-out will-change-transform
                hover:-translate-y-1 hover:shadow-lg
                ${axesVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
              style={{ transitionDelay: axesVisible ? `${i * 120}ms` : '0ms' }}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${a.couleur}`}
              >
                <a.Icone className="h-6 w-6 transition-transform duration-500 group-hover:rotate-6" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white">{a.titre}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{a.texte}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface dark:bg-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow={t('cooperation.partnersSection.eyebrow')}
            title={t('cooperation.partnersSection.title')}
            description={t('cooperation.partnersSection.description')}
          />

          {/* --- Filtres partenaires --- */}
          {partenaires && partenaires.length > 0 && (
            <div className="mt-8 space-y-4">
              <Groupe label={t('common.pays')} options={listePays} value={pays} onChange={setPays} />
              <Groupe label={t('typeEtablissement')} options={listeTypesEtab} value={typeEtab} onChange={setTypeEtab} />
              <Groupe label={t('domaines')} options={listeDomaines} value={domaine} onChange={setDomaine} />
              {listeStatuts.length > 1 && (
                <Groupe
                  label={t('statutPartenariat')}
                  options={listeStatuts}
                  value={statut}
                  onChange={setStatut}
                  getLabel={(o) => t(o)}
                />
              )}
            </div>
          )}

          {partenaires === null ? (
            <Loader />
          ) : partenairesFiltres.length === 0 ? (
            <p className="mt-10 py-16 text-center text-slate-500 dark:text-slate-400">
              {t('appels.empty')}
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partenairesFiltres.map((p) => (
                <Card key={p.id} hover className="p-6">
                  <div className="flex items-center gap-3">
                    {p.logo ? (
                      <img
                        src={getFileUrl(p.logo)}
                        alt={p.nom}
                        className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 dark:border-slate-700 object-contain bg-white"
                      />
                    ) : (
                      <span className="text-3xl">🏫</span>
                    )}
                    <div>
                      <h3 className="font-bold text-navy dark:text-white">{p.nom}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{p.ville}, {p.pays}</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400 dark:text-slate-500">{t('cooperation.partnerFields.type')}</dt>
                      <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{p.typeEtablissement}</dd>
                    </div>
                    {p.accord ? (
                      <>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400 dark:text-slate-500">{t('cooperation.partnerFields.agreement')}</dt>
                          <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{p.accord.titre}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-400 dark:text-slate-500">{t('cooperation.partnerFields.since')}</dt>
                          <dd className="text-right font-medium text-slate-700 dark:text-slate-200">{p.accord.depuis}</dd>
                        </div>
                      </>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(p.domaines ?? []).map((d) => (
                      <span key={d} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow={t('cooperation.mapSection.eyebrow')}
          title={t('cooperation.mapSection.title')}
          description={t('cooperation.mapSection.description')}
        />
        {partenairesMap === null ? (
          <Loader />
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700">
            <PartnersMap partners={partenairesMap} />
          </div>
        )}
      </section>
    </div>
  );
}