import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import FilterChip from '../components/ui/FilterChip.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../lib/utils.js';
import { getDocuments } from '../services/api.js';
import { DOCUMENT_CATEGORIES } from '../lib/enums.js';

// file_size est stocké en octets (BIGINT) côté BDD : jamais affiché brut.
const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

export default function Documents() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState(null);
  const [categorie, setCategorie] = useState('toutes');

  useEffect(() => {
    getDocuments().then(setDocuments);
  }, []);

  const categories = useMemo(
    () => ['toutes', ...new Set((documents ?? []).map((d) => d.categorie))],
    [documents]
  );

  const filtres = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => categorie === 'toutes' || d.categorie === categorie);
  }, [documents, categorie]);

  return (
    <div>
      <PageHeader
        eyebrow={t('documents.eyebrow')}
        title={t('documents.title')}
        description={t('documents.description')}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip key={c} active={categorie === c} onClick={() => setCategorie(c)}>
              {c === 'toutes' ? t('common.allFem') : t(`enums.documentCategory.${c}`)}
            </FilterChip>
          ))}
        </div>

        {documents === null ? (
          <Loader />
        ) : (
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4 font-semibold">{t('documents.table.name')}</th>
                    <th className="px-6 py-4 font-semibold">{t('documents.table.category')}</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">{t('documents.table.format')}</th>
                    <th className="hidden px-6 py-4 font-semibold sm:table-cell">{t('documents.table.size')}</th>
                    <th className="hidden px-6 py-4 font-semibold md:table-cell">{t('documents.table.updated')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('documents.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-navy">{d.titre}</td>
                      <td className="px-6 py-4"><Badge>{t(`enums.documentCategory.${d.categorie}`)}</Badge></td>
                      <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">{d.fileFormat}</td>
                      <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">{formatBytes(d.fileSize)}</td>
                      <td className="hidden px-6 py-4 text-slate-600 md:table-cell">{formatDate(d.dateUpload)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button as="a" href={d.fichier} size="sm" variant="secondary">{t('documents.download')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}