import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getAppels } from '../services/api.js';
import { CALL_STATUS, callStatusTone } from '../lib/enums.js';

export default function Appels() {
  const { t } = useTranslation();
  const [appels, setAppels] = useState(null);
  const [programme, setProgramme] = useState('Tous');
  const [pays, setPays] = useState('Tous');
  const [statut, setStatut] = useState('tous');

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

  const filtres = useMemo(() => {
    if (!appels) return [];
    return appels.filter(
      (a) =>
        (programme === 'Tous' || a.programme === programme) &&
        (pays === 'Tous' || a.pays === pays) &&
        (statut === 'tous' || a.statut === statut)
    );
  }, [appels, programme, pays, statut]);

  const Groupe = ({ label, options, value, onChange, getLabel = (o) => o }) => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <FilterChip key={o} active={value === o} onClick={() => onChange(o)}>
            {getLabel(o)}
          </FilterChip>
        ))}
      </div>
    </div>
  );

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
          <Groupe label={t('appels.filters.status')} options={['tous', ...CALL_STATUS]} value={statut} onChange={setStatut}
            getLabel={(code) => (code === 'tous' ? t('common.all') : t(`enums.callStatus.${code}`))} />
        </div>

        {appels === null ? (
          <Loader />
        ) : filtres.length === 0 ? (
          <p className="py-16 text-center text-slate-500">{t('appels.empty')}</p>
        ) : (
          <div className="mt-10 space-y-4">
            {filtres.map((a) => (
              <Card key={a.id} hover className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cobalt">{a.programme}</Badge>
                    <Badge tone={callStatusTone(a.statut)}>{t(`enums.callStatus.${a.statut}`)}</Badge>
                    <span className="text-xs text-slate-400">{a.pays}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy">{a.titre}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{a.resume}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{t('appels.deadline')} :</span> {formatDate(a.dateLimite)}
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-medium text-slate-700">{t('appels.budget')} :</span> {a.budgetLabel}
                  </p>
                </div>
                <div className="shrink-0">
                  
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}