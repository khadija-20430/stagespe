import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, Languages, X, Save, Loader2 } from 'lucide-react';

import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';

import {
  getPartenairesAdmin,
  getPartenairesAdminPreview,
  createPartenaire,
  updatePartenaire,
  deletePartenaire,
  getCountries,
  getEstablishmentTypes,
  getPartnershipTypes,
  uploadFile,
  publishPartner,
  archivePartner,
  getPartenaireTranslations,
  updatePartenaireTranslations,
} from '../../services/api.js';

import { toPartnerPayload } from '../../services/mappers.js';
import { geocodeAddress } from '../../lib/geocode.js';

const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];

const partnershipStatusTone = (s) =>
  s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'slate';

const publicationStatusTone = (s) =>
  s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber';

const publicationStatusLabel = (s) => {
  const status = s || 'draft';
  if (status === 'published') return 'Publié';
  if (status === 'archived') return 'Archivé';
  return 'Brouillon';
};

const TRANSLATION_FIELDS = [
  { name: 'name', label: 'Nom' },
  { name: 'official_name', label: 'Nom officiel' },
  { name: 'description', label: 'Description' },
  { name: 'cooperation_areas', label: 'Domaines de coopération' },
];

const emptyTranslationSet = () => ({
  en: { name: '', official_name: '', description: '', cooperation_areas: '' },
  ar: { name: '', official_name: '', description: '', cooperation_areas: '' },
});

export default function ManagePartenaires() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [countries, setCountries] = useState([]);
  const [establishmentTypes, setEstablishmentTypes] = useState([]);
  const [partnershipTypes, setPartnershipTypes] = useState([]);
  const [previewData, setPreviewData] = useState({});

  // ---- Modale de traduction manuelle ----
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  useEffect(() => {
    getCountries()
      .then(setCountries)
      .catch((err) => console.error('Erreur récupération pays:', err));

    getEstablishmentTypes()
      .then(setEstablishmentTypes)
      .catch((err) => console.error('Erreur récupération types établissements:', err));

    getPartnershipTypes()
      .then(setPartnershipTypes)
      .catch((err) => console.error('Erreur récupération types partenariats:', err));
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getPartenairesAdminPreview(previewLang).then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.id] = r; });
      setPreviewData(map);
    });
  };

  useEffect(() => {
    if (previewLang === 'fr') {
      setPreviewData({});
      return;
    }
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLang]);

  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getPartenaireTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));
    } catch (err) {
      setTranslationsError(err.message || 'Erreur de chargement des traductions');
    } finally {
      setTranslationsLoading(false);
    }
  };

  const closeTranslations = () => {
    if (translationsSaving) return;
    setTranslationsItem(null);
  };

  const setTranslationField = (lang, field, value) => {
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  const saveTranslations = async () => {
    setTranslationsSaving(true);
    setTranslationsError('');

    try {
      await updatePartenaireTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setTranslationsSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('partners')}
        icon={Handshake}
        idPrefix="part"
        fetcher={getPartenairesAdmin}
        toPayload={toPartnerPayload}
        onCreate={createPartenaire}
        onUpdate={updatePartenaire}
        onDelete={deletePartenaire}
        onPublish={publishPartner}
        onArchive={archivePartner}
         createPermission="partners.create"
  updatePermission="partners.edit"
  deletePermission="partners.delete"
  publishPermission="partners.publish"
        columns={[
          {
            key: 'nom',
            label: t('nom'),
            render: (item) => previewData[item.id]?.nom || item.nom,
          },
          { key: 'pays', label: t('pays') },
          { key: 'ville', label: t('ville') },
          { key: 'adresse', label: t('adresse') },
          {
            key: 'partnershipStatus',
            label: t('statutPartenariat'),
            render: (item) => (
              <Badge tone={partnershipStatusTone(item.partnershipStatus)}>
                {t(`${item.partnershipStatus}`)}
              </Badge>
            ),
          },
          {
            key: 'statut_publication',
            label: t('statutPublication'),
            render: (item) => {
              const status = item.statut_publication || item.statutPublication || 'draft';
              return (
                <Badge tone={publicationStatusTone(status)}>
                  {publicationStatusLabel(status)}
                </Badge>
              );
            },
          },
          {
            key: 'translations',
            label: 'Traductions',
            render: (item) => (
              <button
                type="button"
                onClick={() => openTranslations(item)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title="Voir / modifier les traductions"
              >
                <Languages size={18} />
              </button>
            ),
          },
        ]}
        fields={[
          { name: 'nom', label: t('nom'), type: 'text', required: true },
          { name: 'nomOfficiel', label: t('nomOfficiel'), type: 'text' },
          { name: 'paysId', label: t('pays'), type: 'select',
            options: countries.map((c) => ({ value: c.id, label: c.name })) },
          { name: 'ville', label: t('ville'), type: 'text' },
          { name: 'adresse', label: t('adresse'), type: 'address-autocomplete',
            placeholder: 'Commencez à taper une adresse...' },
          { name: 'geolocation', label: 'Localisation', type: 'geocode',
            onGeocode: (draft) => geocodeAddress(`${draft.adresse || ''} ${draft.ville || ''}`.trim()) },
          { name: 'typeEtablissementId', label: t('typeEtablissement'), type: 'select',
            options: establishmentTypes.map((et) => ({ value: et.id, label: et.label })) },
          { name: 'typePartenariatId', label: t('typePartenariat'), type: 'select',
            options: partnershipTypes.map((pt) => ({ value: pt.id, label: pt.label })) },
          { name: 'statutPartenariat', label: t('statutPartenariat'), type: 'select',
            options: PARTNERSHIP_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
          { name: 'siteWeb', label: t('siteWeb'), type: 'text' },
          { name: 'domaines', label: t('domaines'), type: 'list' },
          { name: 'description', label: t('description'), type: 'textarea' },
          {
            name: 'logo_url',
            label: t('logo'),
            type: 'file',
            accept: 'image/*',
            onFile: async (file, setField) => {
              try {
                const uploaded = await uploadFile(file);
                setField('logo_url', uploaded.fichier_url);
              } catch (err) {
                console.error('Erreur upload logo:', err);
                alert(err.message || "Erreur lors de l'upload du logo");
              }
            },
          },
        ]}
      />

      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                Traductions — {translationsItem.nom}
              </h3>
              <button type="button" onClick={closeTranslations} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {['en', 'ar'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTranslationsTab(lang)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      translationsTab === lang
                        ? 'bg-cobalt text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {translationsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                TRANSLATION_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {f.label}
                    </label>
                    <textarea
                      dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                      rows={f.name === 'name' ? 2 : 4}
                      value={translationsDraft[translationsTab][f.name] ?? ''}
                      onChange={(e) => setTranslationField(translationsTab, f.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition"
                    />
                  </div>
                ))
              )}

              {translationsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{translationsError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={closeTranslations}
                disabled={translationsSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveTranslations}
                disabled={translationsSaving || translationsLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5"
              >
                {translationsSaving ? '...' : (<><Save size={16} /> Enregistrer</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}