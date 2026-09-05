import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface dark:bg-slate-900 px-4 text-center">
      <p className="text-6xl font-extrabold text-cobalt dark:text-blue-400">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy dark:text-white">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-slate-600 dark:text-slate-400">{t('notFound.text')}</p>
      <Button as={Link} to="/" className="mt-6">{t('notFound.backHome')}</Button>
    </div>
  );
}