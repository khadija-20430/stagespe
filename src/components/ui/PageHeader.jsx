// Bandeau réutilisable en haut des pages publiques (fond bleu marine).
export default function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="bg-navy">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
