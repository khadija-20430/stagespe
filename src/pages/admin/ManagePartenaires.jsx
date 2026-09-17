import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake, Languages, Users, X, Save, Loader2, Trash2, Pencil, CalendarClock } from 'lucide-react';

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
  getThemes,
  uploadFile,
  publishPartner,
  archivePartner,
  getPartenaireTranslations,
  updatePartenaireTranslations,
  getPartnerContactsAdmin,
  createPartnerContact,
  updatePartnerContact,
  deletePartnerContact,
} from '../../services/api.js';

import { toPartnerPayload } from '../../services/mappers.js';
import { geocodeAddress } from '../../lib/geocode.js';
import { formatScheduledDate } from '../../lib/utils.js';

const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];

const partnershipStatusTone = (s) =>
  s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'slate';

const publicationStatusTone = (s) =>
  s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber';

const publicationStatusLabel = (s, t) => t(s || 'draft', { defaultValue: t('draft') });

const TRANSLATION_FIELDS = [
  { name: 'name', labelKey: 'nom' },
  { name: 'official_name', labelKey: 'nomOfficiel' },
  { name: 'description', labelKey: 'description' },
  { name: 'cooperation_areas', labelKey: 'domaines' },
];

const emptyTranslationSet = () => ({
  en: { name: '', official_name: '', description: '', cooperation_areas: '' },
  ar: { name: '', official_name: '', description: '', cooperation_areas: '' },
});

const emptyContactDraft = () => ({
  id: null,
  full_name: '',
  position: '',
  email: '',
  phone: '',
  is_primary: false,
  is_public: false,
});

export default function ManagePartenaires() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [countries, setCountries] = useState([]);
  const [establishmentTypes, setEstablishmentTypes] = useState([]);
  const [partnershipTypes, setPartnershipTypes] = useState([]);
  const [themes, setThemes] = useState([]);
  const [previewData, setPreviewData] = useState({});

  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  const [contactsItem, setContactsItem] = useState(null);
  const [contactsList, setContactsList] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactDraft, setContactDraft] = useState(emptyContactDraft());

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

    getThemes()
      .then(setThemes)
      .catch((err) => console.error('Erreur récupération thèmes:', err));
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
      setTranslationsError(err.message || t('erreur_chargement_traductions'));
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
      setTranslationsError(err.message || t('erreur_enregistrement_traductions'));
    } finally {
      setTranslationsSaving(false);
    }
  };

  const openContacts = async (item) => {
    setContactsItem(item);
    setContactsError('');
    setContactDraft(emptyContactDraft());
    setContactsLoading(true);

    try {
      const list = await getPartnerContactsAdmin(item.id);
      setContactsList(list);
    } catch (err) {
      setContactsError(err.message || 'Erreur de chargement des contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const closeContacts = () => {
    if (contactsSaving) return;
    setContactsItem(null);
    setContactsList([]);
    setContactDraft(emptyContactDraft());
  };

  const refreshContacts = async () => {
    const list = await getPartnerContactsAdmin(contactsItem.id);
    setContactsList(list);
  };

  const editContact = (c) => {
    setContactDraft({
      id: c.id,
      full_name: c.full_name || '',
      position: c.position || '',
      email: c.email || '',
      phone: c.phone || '',
      is_primary: !!c.is_primary,
      is_public: !!c.is_public,
    });
  };

  const saveContact = async () => {
    if (!contactDraft.full_name.trim()) {
      setContactsError('Le nom du contact est requis');
      return;
    }

    setContactsSaving(true);
    setContactsError('');

    try {
      const payload = {
        partner_id: contactsItem.id,
        full_name: contactDraft.full_name,
        position: contactDraft.position,
        email: contactDraft.email,
        phone: contactDraft.phone,
        is_primary: contactDraft.is_primary,
        is_public: contactDraft.is_public,
      };

      if (contactDraft.id) {
        await updatePartnerContact(contactDraft.id, payload);
      } else {
        await createPartnerContact(payload);
      }

      await refreshContacts();
      setContactDraft(emptyContactDraft());
    } catch (err) {
      setContactsError(err.message || "Erreur lors de l'enregistrement du contact");
    } finally {
      setContactsSaving(false);
    }
  };

  const removeContact = async (id) => {
    if (!window.confirm(t('partnerContacts.deleteConfirm', { defaultValue: 'Supprimer ce contact ?' }))) return;

    setContactsSaving(true);
    setContactsError('');

    try {
      await deletePartnerContact(id);
      await refreshContacts();
      if (contactDraft.id === id) setContactDraft(emptyContactDraft());
    } catch (err) {
      setContactsError(err.message || 'Erreur lors de la suppression du contact');
    } finally {
      setContactsSaving(false);
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
          { key: 'adresse', label: t('adresse') },
          {
            key: 'themes',
            label: t('themes'),
            render: (item) => Array.isArray(item.themeNames) && item.themeNames.length > 0
              ? item.themeNames.join(', ')
              : '—',
          },
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
                <div className="flex flex-col gap-0.5">
                  <Badge tone={publicationStatusTone(status)}>
                    {publicationStatusLabel(status, t)}
                  </Badge>
                  {status === 'draft' && item.scheduledPublishAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {t('programme', { defaultValue: 'Programmé' })} : {formatScheduledDate(item.scheduledPublishAt)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'translations', label: t('traductions'),
            render: (item) => (
              <button
                type="button"
                onClick={() => openTranslations(item)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('voir_modifier_traductions')}
              >
                <Languages size={18} />
              </button>
            ),
          },
          {
            key: 'contacts',
            label: t('contacts', { defaultValue: 'Contacts' }),
            render: (item) => (
              <button
                type="button"
                onClick={() => openContacts(item)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('partnerContacts.title', { nom: item.nom, defaultValue: 'Gérer les contacts' })}
              >
                <Users size={18} />
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
          {
            name: 'themeIds',
            label: t('themes'),
            type: 'multiselect',
            options: themes.map((th) => ({ value: th.id, label: th.name })),
          },
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
                alert(err.message || t('erreur_upload'));
              }
            },
          },
          {
            name: 'scheduledPublishAt',
            label: t('programmerPublication', { defaultValue: 'Programmer la publication' }),
            type: 'datetime-local',
  help: t('programmerPublicationHelp', { defaultValue: 'Laisser vide pour publier manuellement.' }),
          },
        ]}
      />

      {/* MODALE TRADUCTIONS */}
      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                {t('traductions_titre_modal')} — {translationsItem.nom}
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
                      {t(f.labelKey, { defaultValue: f.name })}
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
                {t('annuler')}
              </button>
              <button
                type="button"
                onClick={saveTranslations}
                disabled={translationsSaving || translationsLoading}
                className="px-6 py-2 bg-cobalt hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-1.5"
              >
                {translationsSaving ? '...' : (<><Save size={16} /> {t('enregistrer')}</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CONTACTS */}
      {contactsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-navy dark:text-white">
                {t('partnerContacts.title', { nom: contactsItem.nom, defaultValue: `Contacts — ${contactsItem.nom}` })}
              </h3>
              <button type="button" onClick={closeContacts} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {contactsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                <>
                  {contactsList.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('partnerContacts.empty', { defaultValue: 'Aucun contact pour ce partenaire.' })}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {contactsList.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-navy dark:text-white">
                              {c.full_name}
                              {c.is_primary && <Badge tone="cobalt" className="ml-2">{t('partnerContacts.isPrimary', { defaultValue: 'Principal' })}</Badge>}
                              {c.is_public && <Badge tone="green" className="ml-2">{t('partnerContacts.isPublic', { defaultValue: 'Public' })}</Badge>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {c.position || '—'} · {c.email || '—'} · {c.phone || '—'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => editContact(c)} className="text-slate-400 hover:text-cobalt transition">
                              <Pencil size={16} />
                            </button>
                            <button type="button" onClick={() => removeContact(c.id)} className="text-slate-400 hover:text-red-600 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {contactDraft.id
                        ? t('partnerContacts.editTitle', { defaultValue: 'Modifier le contact' })
                        : t('partnerContacts.addTitle', { defaultValue: 'Ajouter un contact' })}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder={`${t('partnerContacts.fullName', { defaultValue: 'Nom complet' })} *`}
                        value={contactDraft.full_name}
                        onChange={(e) => setContactDraft((d) => ({ ...d, full_name: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                      <input
                        type="text"
                        placeholder={t('partnerContacts.position', { defaultValue: 'Fonction' })}
                        value={contactDraft.position}
                        onChange={(e) => setContactDraft((d) => ({ ...d, position: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                      <input
                        type="email"
                        placeholder={t('partnerContacts.email', { defaultValue: 'Email' })}
                        value={contactDraft.email}
                        onChange={(e) => setContactDraft((d) => ({ ...d, email: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                      <input
                        type="text"
                        placeholder={t('partnerContacts.phone', { defaultValue: 'Téléphone' })}
                        value={contactDraft.phone}
                        onChange={(e) => setContactDraft((d) => ({ ...d, phone: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={contactDraft.is_primary}
                          onChange={(e) => setContactDraft((d) => ({ ...d, is_primary: e.target.checked }))} />
                        {t('partnerContacts.isPrimary', { defaultValue: 'Contact principal' })}
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={contactDraft.is_public}
                          onChange={(e) => setContactDraft((d) => ({ ...d, is_public: e.target.checked }))} />
                        {t('partnerContacts.isPublic', { defaultValue: 'Visible publiquement' })}
                      </label>
                    </div>

                    {contactsError && <p className="text-sm text-red-600 dark:text-red-400">{contactsError}</p>}

                    <div className="flex justify-end gap-2">
                      {contactDraft.id && (
                        <button type="button" onClick={() => setContactDraft(emptyContactDraft())}
                          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600">
                          {t('partnerContacts.cancelEdit', { defaultValue: "Annuler l'édition" })}
                        </button>
                      )}
                      <button
                        type="button" onClick={saveContact} disabled={contactsSaving}
                        className="px-4 py-1.5 bg-cobalt hover:bg-blue-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
                      >
                        {contactsSaving ? '...' : (
                          <>
                            <Save size={14} /> {contactDraft.id
                              ? t('partnerContacts.update', { defaultValue: 'Mettre à jour' })
                              : t('partnerContacts.add', { defaultValue: 'Ajouter' })}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={closeContacts}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                {t('partnerContacts.close', { defaultValue: 'Fermer' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}