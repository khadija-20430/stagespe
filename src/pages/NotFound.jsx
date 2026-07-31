import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-6xl font-extrabold text-cobalt">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy">Page introuvable</h1>
      <p className="mt-2 max-w-md text-slate-600">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Button as={Link} to="/" className="mt-6">Retour à l'accueil</Button>
    </div>
  );
}
