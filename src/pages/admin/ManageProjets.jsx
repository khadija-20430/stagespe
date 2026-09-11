import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Languages, X, Save, Loader2, CalendarClock, Users, Trash2, Plus } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DocumentsCell from '../../components/ui/DocumentsCell.jsx';
import {
  getProjetsAdmin, getProjetsAdminPreview, createProjet, updateProjet, deleteProjet, getProgrammes,
  getPartenaires, getProjetTranslations, updateProjetTranslations,
  publishProjet, archiveProjet,
  getProjetById,
  getProjectPartners, createProjectPartner, deleteProjectPartner,
  updateProjetDeliverablesTranslations,
} from '../../services/api.js';
import { toProjetPayload } from '../../services/mappers.js';
import { PROJECT_STATUS, projectStatusTone } from '../../lib/enums.js';
import { formatScheduledDate } from '../../lib/utils.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

const TRANSLATION_FIELDS = [
  { name: 'title', labelKey: 'titre' },
  { name: 'description', labelKey: 'description' },
  { name: 'objectives', labelKey: 'objectifs' },
  { name: 'target_groups', labelKey: 'groupesCibles' },
];

const emptyTranslationSet = () => ({
  en: { title: '', description: '', objectives: '', target_groups: '' },
  ar: { title: '', description: '', objectives: '', target_groups: '' },
});

// ✅ Helper : affiche toujours une string, même si description est un objet
const asText = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.fr || v.en || Object.values(v)[0] || '';
  return String(v);
};

export default function ManageProjets() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;
  const [programmes, setProgrammes] = useState([]);
  const [partenaires, setPartenaires] = useState([]);
  const [previewData, setPreviewData] = useState({});

  // --- Modale traductions ---
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  // Traductions des livrables / résultats
  const [deliverablesDraft, setDeliverablesDraft] = useState({});
  const [resultsDraft, setResultsDraft] = useState({});

  // --- Modale partenaires ---
  const [partnersItem, setPartnersItem] = useState(null);
  const [partnersList, setPartnersList] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersSaving, setPartnersSaving] = useState(false);
  const [partnersError, setPartnersError] = useState('');
  const [partnerDraft, setPartnerDraft] = useState({ partner_id: '', role: '' });

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getPartenaires().then(setPartenaires);
  }, []);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getProjetsAdminPreview(previewLang).then((rows) => {
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

  const partnerName = (id) => {
    if (!id) return '—';
    const partner = partenaires.find((p) => String(p.id) === String(id));
    return partner ? partner.nom : '—';
  };

  // ============================================================
  // TRADUCTIONS
  // ============================================================
  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());
    setDeliverablesDraft({});
    setResultsDraft({});

    try {
      const existing = await getProjetTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));

      const fullProject = await getProjetById(item.id);

      const rawDeliverables = fullProject.deliverables || fullProject.livrables || [];
      const rawResults = fullProject.results || fullProject.resultats || [];

      const dDraft = {};
      rawDeliverables.forEach((d) => {
        dDraft[d.id] = {
          en: d.translations?.en || '',
          ar: d.translations?.ar || '',
        };
      });
      setDeliverablesDraft(dDraft);

      const rDraft = {};
      rawResults.forEach((r) => {
        rDraft[r.id] = {
          en: r.translations?.en || '',
          ar: r.translations?.ar || '',
        };
      });
      setResultsDraft(rDraft);

      setTranslationsItem((prev) => ({
        ...prev,
        deliverables: rawDeliverables,
        results: rawResults,
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
    setDeliverablesDraft({});
    setResultsDraft({});
  };

  const setTranslationField = (lang, field, value) => {
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  const setDeliverableTranslation = (deliverableId, lang, value) => {
    setDeliverablesDraft((prev) => ({
      ...prev,
      [deliverableId]: {
        ...(prev[deliverableId] || {}),
        [lang]: value,
      },
    }));
  };

  const setResultTranslation = (resultId, lang, value) => {
    setResultsDraft((prev) => ({
      ...prev,
      [resultId]: {
        ...(prev[resultId] || {}),
        [lang]: value,
      },
    }));
  };

  const saveTranslations = async () => {
    if (!translationsItem) return;

    setTranslationsSaving(true);
    setTranslationsError('');

    try {
      await updateProjetTranslations(translationsItem.id, translationsDraft);

      const rawDeliverables = translationsItem.deliverables || [];
      const rawResults = translationsItem.results || [];

      const deliverablesPayload = rawDeliverables.map((d) => ({
        id: d.id,
        description: asText(d.description),
        translations: {
          en: deliverablesDraft[d.id]?.en || '',
          ar: deliverablesDraft[d.id]?.ar || '',
        },
      }));

      const resultsPayload = rawResults.map((r) => ({
        id: r.id,
        description: asText(r.description),
        translations: {
          en: resultsDraft[r.id]?.en || '',
          ar: resultsDraft[r.id]?.ar || '',
        },
      }));

      await updateProjetDeliverablesTranslations(translationsItem.id, {
        deliverables: deliverablesPayload,
        results: resultsPayload,
      });

      refreshPreview();
      setTranslationsItem(null);
      setDeliverablesDraft({});
      setResultsDraft({});
    } catch (err) {
      setTranslationsError(err.message || t('erreur_enregistrement_traductions'));
    } finally {
      setTranslationsSaving(false);
    }
  };

  // ============================================================
  // PARTENAIRES
  // ============================================================
  const openPartners = async (item) => {
    setPartnersItem(item);
    setPartnersError('');
    setPartnerDraft({ partner_id: '', role: '' });
    setPartnersLoading(true);

    try {
      const list = await getProjectPartners(item.id);
      setPartnersList(list);
    } catch (err) {
      setPartnersError(err.message || t('admin.crud.errors.loadTranslations'));
    } finally {
      setPartnersLoading(false);
    }
  };

  const closePartners = () => {
    if (partnersSaving) return;
    setPartnersItem(null);
    setPartnersList([]);
    setPartnerDraft({ partner_id: '', role: '' });
  };

  const refreshPartners = async () => {
    const list = await getProjectPartners(partnersItem.id);
    setPartnersList(list);
  };

  const savePartner = async () => {
    if (!partnerDraft.partner_id || !partnerDraft.role.trim()) {
      setPartnersError(t('projectPartners.partnerAndRoleRequired', { defaultValue: 'Partenaire et rôle requis' }));
      return;
    }

    setPartnersSaving(true);
    setPartnersError('');

    try {
      await createProjectPartner({
        project_id: partnersItem.id,
        partner_id: parseInt(partnerDraft.partner_id),
        role: partnerDraft.role.trim(),
      });
      await refreshPartners();
      setPartnerDraft({ partner_id: '', role: '' });
    } catch (err) {
      setPartnersError(err.message || t('admin.crud.errors.save'));
    } finally {
      setPartnersSaving(false);
    }
  };

  const removePartner = async (id) => {
    if (!window.confirm(t('projectPartners.deleteConfirm', { defaultValue: 'Supprimer ce partenaire du projet ?' }))) return;

    setPartnersSaving(true);
    setPartnersError('');

    try {
      await deleteProjectPartner(id);
      await refreshPartners();
    } catch (err) {
      setPartnersError(err.message || t('admin.crud.errors.delete'));
    } finally {
      setPartnersSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('projects')}
        icon={FlaskConical}
        idPrefix="proj"
        fetcher={getProjetsAdmin}
        toPayload={toProjetPayload}
        onCreate={createProjet}
        onUpdate={updateProjet}
        onDelete={deleteProjet}
        onPublish={publishProjet}
        onArchive={archiveProjet}
        createPermission="projects.create"
        updatePermission="projects.edit"
        deletePermission="projects.delete"
        publishPermission="projects.publish"
        columns={[
          { key: 'titre', label: t('titre'), required: true,
            render: (i) => previewData[i.id]?.titre || i.titre },
          { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
          { key: 'status', label: t('status'),
            render: (i) => <Badge tone={projectStatusTone(i.status)}>{t(`enums.projectStatus.${i.status}`, { defaultValue: i.status })}</Badge> },
          { key: 'budget', label: t('budget'),
            render: (i) => i.budget != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(i.budget) : '—' },
          { key: 'coordinator_partner_id', label: t('coordinateur'),
            render: (i) => partnerName(i.coordinator_partner_id) },
          {
            key: 'statut_publication',
            label: t('statutPublication'),
            render: (i) => {
              const status = i.statut_publication || 'draft';
              return (
                <div className="flex flex-col gap-0.5">
                  <Badge tone={publicationStatusTone(status)}>{t(status, { defaultValue: status })}</Badge>
                  {status === 'draft' && i.scheduledPublishAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <CalendarClock size={12} />
                      {t('scheduled', { defaultValue: 'Programmé' })} : {formatScheduledDate(i.scheduledPublishAt)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'partners',
            label: t('partners'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openPartners(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('projectPartners.manageTooltip', { defaultValue: 'Gérer les partenaires du projet' })}
              >
                <Users size={18} />
              </button>
            ),
          },
          {
            key: 'documents',
            label: t('documentsSection', { defaultValue: 'Documents' }),
            render: (i) => <DocumentsCell documents={i.documents} />,
          },
          {
            key: 'translations',
            label: t('traductions'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openTranslations(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title={t('voir_modifier_traductions')}
              >
                <Languages size={18} />
              </button>
            ),
          },
        ]}
        fields={[
          { name: 'titre', label: t('titre'), type: 'text', required: true },
          { name: 'acronyme', label: t('acronyme'), type: 'text' },
          { name: 'codeReference', label: t('codeReference'), type: 'text' },
          { name: 'programmeId', label: t('programme'), type: 'select',
            options: programmes.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'status', label: t('status'), type: 'select',
            options: PROJECT_STATUS.map((code) => ({ value: code, label: t(`enums.projectStatus.${code}`) })) },
          { name: 'budget', label: t('budget'), type: 'number' },
          { name: 'debut', label: t('debut'), type: 'date' },
          { name: 'fin', label: t('fin'), type: 'date' },
          { name: 'coordinator_partner_id', label: t('coordinateur'), type: 'select',
            options: partenaires.map((p) => ({ value: p.id, label: p.nom })) },
          { name: 'siteWeb', label: t('siteWeb'), type: 'text' },
          { name: 'resume', label: t('resume'), type: 'textarea' },
          { name: 'objectifs', label: t('objectifs'), type: 'textarea' },
          { name: 'groupesCibles', label: t('groupesCibles'), type: 'textarea' },
          { name: 'resultats', label: t('resultats'), type: 'list' },
          { name: 'livrables', label: t('livrables'), type: 'list' },
          { name: 'misEnAvant', label: t('misEnAvant'), type: 'select',
            options: [{ value: 'true', label: t('yes') }, { value: 'false', label: t('no') }] },
          {
            name: 'scheduledPublishAt',
            label: t('programmerPublication', { defaultValue: 'Programmer la publication' }),
            type: 'datetime-local',
  help: t('programmerPublicationHelp', { defaultValue: 'Laisser vide pour publier manuellement.' }),
          },
        ]}
      />

      {/* ================= MODALE TRADUCTIONS ================= */}
      {translationsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeTranslations}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h3 className="font-bold text-navy dark:text-white">
                {t('traductions_titre_modal')} — {translationsItem.titre}
              </h3>
              <button
                type="button"
                onClick={closeTranslations}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4 shrink-0">
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

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {translationsLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                <>
                  {TRANSLATION_FIELDS.map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        {t(f.labelKey)}
                      </label>
                      <textarea
                        dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                        rows={f.name === 'title' ? 2 : 4}
                        value={translationsDraft[translationsTab][f.name] ?? ''}
                        onChange={(e) => setTranslationField(translationsTab, f.name, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition"
                      />
                    </div>
                  ))}

                  {Array.isArray(translationsItem.deliverables) && translationsItem.deliverables.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        📦 {t('livrables')}
                      </p>
                      <div className="space-y-3">
                        {translationsItem.deliverables.map((d) => (
                          <div key={d.id}>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {t('livrables')} FR : <span className="font-medium">{asText(d.description)}</span>
                            </p>
                            <textarea
                              dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                              rows={2}
                              placeholder={`${t('traductions')} ${translationsTab.toUpperCase()}`}
                              value={deliverablesDraft[d.id]?.[translationsTab] ?? ''}
                              onChange={(e) =>
                                setDeliverableTranslation(d.id, translationsTab, e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(translationsItem.results) && translationsItem.results.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        🎯 {t('resultats')}
                      </p>
                      <div className="space-y-3">
                        {translationsItem.results.map((r) => (
                          <div key={r.id}>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {t('resultats')} FR : <span className="font-medium">{asText(r.description)}</span>
                            </p>
                            <textarea
                              dir={translationsTab === 'ar' ? 'rtl' : 'ltr'}
                              rows={2}
                              placeholder={`${t('traductions')} ${translationsTab.toUpperCase()}`}
                              value={resultsDraft[r.id]?.[translationsTab] ?? ''}
                              onChange={(e) =>
                                setResultTranslation(r.id, translationsTab, e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {translationsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{translationsError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
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

      {/* ================= MODALE PARTENAIRES ================= */}
      {partnersItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closePartners}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h3 className="font-bold text-navy dark:text-white">
{t('projectPartners.title', { titre: partnersItem.titre, defaultValue: `Partenaires — ${partnersItem.titre}` })}              </h3>
              <button
                type="button"
                onClick={closePartners}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {partnersLoading ? (
                <div className="flex justify-center py-8 text-cobalt">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              ) : (
                <>
                  {partnersList.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('projectPartners.empty', { defaultValue: 'Aucun partenaire associé à ce projet.' })}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {partnersList.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-navy dark:text-white">
                              {p.partner_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t('role')} : {p.role}
                              {p.country_name && ` · ${p.country_name}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePartner(p.id)}
                            disabled={partnersSaving}
                            className="text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                            title={t('projectPartners.removeTooltip', { defaultValue: 'Retirer ce partenaire' })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {t('projectPartners.addTitle', { defaultValue: 'Ajouter un partenaire' })}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={partnerDraft.partner_id}
                        onChange={(e) =>
                          setPartnerDraft((d) => ({ ...d, partner_id: e.target.value }))
                        }
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      >
                        <option value="">{t('projectPartners.selectPlaceholder', { defaultValue: '— Choisir un partenaire —' })}</option>
                        {partenaires.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder={t('projectPartners.rolePlaceholder', { defaultValue: 'Rôle (ex: Coordinateur, Membre)' })}
                        value={partnerDraft.role}
                        onChange={(e) =>
                          setPartnerDraft((d) => ({ ...d, role: e.target.value }))
                        }
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                    </div>

                    {partnersError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {partnersError}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={savePartner}
                        disabled={partnersSaving}
                        className="px-4 py-1.5 bg-cobalt hover:bg-blue-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {partnersSaving ? (
                          '...'
                        ) : (
                          <>
                            <Plus size={14} /> {t('enregistrer')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={closePartners}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
              >
                {t('projectPartners.close', { defaultValue: 'Fermer' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}