export default function SectionHeading({ eyebrow, title, description, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cobalt dark:text-blue-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-navy dark:text-white sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}