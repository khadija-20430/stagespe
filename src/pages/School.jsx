import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import esiLogo from '../assets/logo-esi.png';

export default function School() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 80% 0, #2563EB 0, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <img src={esiLogo} alt="ESI" className="mb-6 h-16 w-auto" />
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Présentation de l'école
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Découvrez l'École Supérieure en Informatique, ses valeurs et sa mission.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          title="À propos de l'ESI"
          description="L'ESI est une institution dédiée à l'excellence en informatique et aux partenariats internationaux."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold text-navy">Notre Mission</h3>
            <p className="mt-3 text-slate-600">
              Nous formons les meilleurs ingénieurs informatiques et favorisons la coopération internationale.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy">Nos Valeurs</h3>
            <p className="mt-3 text-slate-600">
              Excellence, innovation, collaboration et responsabilité sociale sont au cœur de notre approche.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}