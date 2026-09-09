import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getAppels } from '../services/api.js';
import { CALL_STATUS, callStatusTone } from '../lib/enums.js';

const NUMBER_LOCALE = { fr: 'fr-FR', en: 'en-US', ar: 'ar-DZ' };

export default function Appels() {
  const { t, i18n } = useTranslation();
  const [appels, setAppels] = useState(null);
  const [programme, setProgramme] = useState('Tous');
  const [pays, setPays] = useState('Tous');
  const [statut, setStatut] = useState('tous');
const [theme, setTheme] = useState('Tous');
const listeThemes = useMemo(
    () => ['Tous', ...new Set((appels ?? []).flatMap((a) => a.themeNames ?? []))],
    [appels]
);
   useEffect(() => {
  setAppels(null);
  getAppels(i18n.language).then(setAppels);
}, [i18n.language]);

  const programmes = useMemo(
    () => ['Tous', ...new Set((appels ?? []).map((a) => a.programme))],
    [appels]
  );
  // paysEligibles = eligible_countries, un appel peut viser plusieurs pays :
  // on aplatit toutes les listes pour construire les options du filtre.
  const listePays = useMemo(
    () => ['Tous', ...new Set((appels ?? []).flatMap((a) => a.paysEligibles ?? []))],
    [appels]
  );

  const filtres = useMemo(() => {
    if (!appels) return [];
    return appels.filter(
      (a) =>
        (programme === 'Tous' || a.programme === programme) &&
        (pays === 'Tous' || (a.paysEligibles ?? []).includes(pays)) &&
        // ⚠️ mapAppel() renvoie "status" (pas "statut"). L'ancienne version comparait
        // a.statut, qui est toujours undefined -> le filtre par statut ne matchait jamais.
                (theme === 'Tous' || (a.themeNames ?? []).includes(theme)) &&

        (statut === 'tous' || a.status === statut)
    );
  }, [appels, programme, pays,theme, statut]);

  const Groupe = ({ label, options, value, onChange, getLabel = (o) => o }) => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <FilterChip key={o} active={value === o} onClick={() => onChange(o)}>
            {getLabel(o)}
          </FilterChip>
        ))}
      </div>
    </div>
  );

  const currencyLocale = NUMBER_LOCALE[i18n.language] || 'fr-FR';

  return (
    <div>
      <PageHeader
        eyebrow={t('appels.eyebrow')}
        title={t('appels.title')}
        description={t('appels.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Groupe label={t('appels.filters.programme')} options={programmes} value={programme} onChange={setProgramme}
            getLabel={(o) => (o === 'Tous' ? t('common.all') : o)} />
          <Groupe label={t('appels.filters.country')} options={listePays} value={pays} onChange={setPays}
            getLabel={(o) => (o === 'Tous' ? t('common.all') : o)} />
          <Groupe label={t('appels.filters.theme')} options={listeThemes} value={theme} onChange={setTheme}
    getLabel={(o) => (o === 'Tous' ? t('common.all') : o)} />
          <Groupe label={t('appels.filters.status')} options={['tous', ...CALL_STATUS]} value={statut} onChange={setStatut}
            getLabel={(code) => (code === 'tous' ? t('common.all') : t(`enums.callStatus.${code}`))} />
        </div>

        {appels === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500 dark:text-slate-400">{t('appels.empty')}</p>
        ) : (
          <div className="mt-10 space-y-4">
            {filtres.map((a) => (
              <Card key={a.id} hover className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cobalt">{a.programme}</Badge>
                    {/* Avant : t(`${a.status}`) => cherchait la clé "open"/"closed"... au lieu de
                        "enums.callStatus.open" comme partout ailleurs. Affichait la clé brute. */}
                    <Badge tone={callStatusTone(a.status)}>{t(`enums.callStatus.${a.status}`)}</Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{(a.paysEligibles ?? []).join(', ')}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy dark:text-white">{a.titre}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{a.resume}</p>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('appels.deadline')} :</span> {formatDate(a.dateLimite)}
                    <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('appels.budget')} :</span>{' '}
                    {a.budgetDisponible
                      ? new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(a.budgetDisponible)
                      : '—'}
                  </p>
                </div>
                <div className="shrink-0"></div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}