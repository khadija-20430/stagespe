import { useTranslation } from 'react-i18next';

export default function Loader({ label }) {
  const { t } = useTranslation();
  const displayLabel = label ?? t('admin.crud.loading');

  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-cobalt" />
      <span className="text-sm font-medium">{displayLabel}</span>
    </div>
  );
}
