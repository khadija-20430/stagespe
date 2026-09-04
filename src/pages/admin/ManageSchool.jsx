import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

import {
    getSchoolPresentationsAdmin,
    createSchoolPresentation,
    addSchoolTranslation,
    updateSchoolTranslation,
    replaceSchoolFile,
    getSchoolRevisions,
    updateSchoolVisibilite,
    deleteSchoolPresentation,
    deleteSchoolTranslation,
    getFileUrl,
} from '../../services/api.js';

const LANGUAGES = [
    { value: 1, code: 'fr', label: 'Français' },
    { value: 2, code: 'en', label: 'English' },
    { value: 3, code: 'ar', label: 'العربية' },
];

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let i = 0;
    let n = Number(bytes);
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
    }
    return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

const getFileName = (path) => {
    if (!path) return 'document';
    try {
        return String(path).split('?')[0].split('/').pop() || 'document';
    } catch {
        return 'document';
    }
};

export default function ManageSchool() {
    const { t } = useTranslation();

    const [presentations, setPresentations] = useState([]);
    const [presentation, setPresentation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLang, setActiveLang] = useState(LANGUAGES[0].code);
    const [revisions, setRevisions] = useState(null);
    const [savingVisibilite, setSavingVisibilite] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        getSchoolPresentationsAdmin()
            .then((list) => {
                setPresentations(list);
                if (Array.isArray(list) && list.length > 0) {
                    setPresentation(list[0]);
                } else {
                    setPresentation(null);
                }
            })
            .catch((err) => setError(err.message || 'Erreur de chargement'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    // ================== CRÉATION ==================
    const handleCreate = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const lang = LANGUAGES.find((l) => l.code === activeLang);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('language_id', lang.value);
            formData.append('titre', form.get('titre'));
            formData.append('description', form.get('description'));
            formData.append('visibilite', 'draft');

            const file = form.get('file');
            if (file && file.size > 0) {
                formData.append('file', file);
            } else {
                alert('Un fichier est obligatoire');
                setUploading(false);
                return;
            }

            await createSchoolPresentation(formData);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors de la création');
        } finally {
            setUploading(false);
        }
    };

    // ================== VISIBILITÉ ==================
    const toggleVisibilite = async () => {
        if (!presentation) return;
        const next = presentation.visibilite === 'public' ? 'draft' : 'public';
        setSavingVisibilite(true);
        try {
            await updateSchoolVisibilite(presentation.id, next);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors du changement de visibilité');
        } finally {
            setSavingVisibilite(false);
        }
    };

    // ================== TRADUCTIONS ==================
    const currentTranslation = presentation?.translations?.find(
        (tr) => tr.language_code === activeLang
    );

    const handleAddTranslation = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const lang = LANGUAGES.find((l) => l.code === activeLang);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('language_id', lang.value);
            formData.append('titre', form.get('titre'));
            formData.append('description', form.get('description'));

            const file = form.get('file');
            if (file && file.size > 0) {
                formData.append('file', file);
            } else {
                alert('Un fichier est obligatoire');
                setUploading(false);
                return;
            }

            await addSchoolTranslation(presentation.id, formData);
            load();
        } catch (err) {
            alert(err.message || "Erreur lors de l'ajout de la traduction");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateTranslation = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        try {
            await updateSchoolTranslation(currentTranslation.id, {
                titre: form.get('titre'),
                description: form.get('description'),
            });
            load();
        } catch (err) {
            alert(err.message || "Erreur lors de l'enregistrement");
        }
    };

    const handleReplaceFile = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            await replaceSchoolFile(currentTranslation.id, file);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors du remplacement du fichier');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTranslation = async () => {
        if (!window.confirm(`Supprimer la traduction en ${activeLang} ? Cette action est irréversible.`)) return;
        try {
            await deleteSchoolTranslation(currentTranslation.id);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors de la suppression');
        }
    };

    const handleShowRevisions = async () => {
        if (revisions) {
            setRevisions(null);
            return;
        }
        try {
            const data = await getSchoolRevisions(currentTranslation.id);
            setRevisions(data);
        } catch (err) {
            alert(err.message || "Erreur lors du chargement de l'historique");
        }
    };

    const handleDeletePresentation = async () => {
        if (!window.confirm('Supprimer toute la présentation (toutes langues confondues) ? Cette action est irréversible.')) return;
        try {
            await deleteSchoolPresentation(presentation.id);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors de la suppression');
        }
    };

    // ================== RENDU ==================
    if (loading) return <p className="p-6 text-slate-500">Chargement…</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-navy"> {t('presentation_ecole') || "Présentation de l'école"}</h1>

                {presentation && (
                    <div className="flex items-center gap-3">
                        <Badge tone={presentation.visibilite === 'public' ? 'green' : 'amber'}>
                            {presentation.visibilite === 'public' ? 'Public' : 'Brouillon'}
                        </Badge>
                        <Button onClick={toggleVisibilite} disabled={savingVisibilite}>
                            {presentation.visibilite === 'public' ? 'Repasser en brouillon' : 'Publier'}
                        </Button>
                        <Button tone="danger" onClick={handleDeletePresentation}>
                            Supprimer tout
                        </Button>
                    </div>
                )}
            </div>

            {/* Onglets langue */}
            <div className="mb-6 flex gap-2 border-b border-slate-200">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => { setActiveLang(lang.code); setRevisions(null); }}
                        className={`px-4 py-2 text-sm font-medium transition ${
                            activeLang === lang.code
                                ? 'border-b-2 border-cobalt text-cobalt'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {/* Pas encore de présentation du tout */}
            {!presentation && (
                <Card className="max-w-xl p-6">
                    <p className="mb-4 text-slate-500">
                        Aucune présentation n'existe encore. Crée la première traduction ({LANGUAGES.find((l) => l.code === activeLang).label}) pour commencer.
                    </p>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Titre *</label>
                            <input name="titre" placeholder="Titre" required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Description *</label>
                            <textarea name="description" placeholder="Description" rows={4} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fichier PDF *</label>
                            <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" required className="w-full" />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? 'Upload en cours...' : 'Créer la présentation'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Présentation existante mais langue pas encore traduite */}
            {presentation && !currentTranslation && (
                <Card className="max-w-xl p-6">
                    <p className="mb-4 text-slate-500">
                        Pas encore de traduction en {LANGUAGES.find((l) => l.code === activeLang).label}.
                    </p>
                    <form onSubmit={handleAddTranslation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Titre *</label>
                            <input name="titre" placeholder="Titre" required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Description *</label>
                            <textarea name="description" placeholder="Description" rows={4} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fichier PDF *</label>
                            <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" required className="w-full" />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? 'Upload en cours...' : 'Ajouter cette traduction'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Traduction existante : édition */}
            {presentation && currentTranslation && (
                <div className="max-w-2xl space-y-6">
                    <Card className="p-6">
                        <form onSubmit={handleUpdateTranslation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Titre *</label>
                                <input
                                    name="titre"
                                    defaultValue={currentTranslation.titre}
                                    required
                                    className="w-full rounded border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Description *</label>
                                <textarea
                                    name="description"
                                    defaultValue={currentTranslation.description}
                                    rows={4}
                                    required
                                    className="w-full rounded border px-3 py-2"
                                />
                            </div>
                            <Button type="submit">Enregistrer le texte</Button>
                        </form>
                    </Card>

                    <Card className="p-6">
                        <p className="mb-2 text-sm text-slate-500">
                            Fichier actuel : {getFileName(currentTranslation.fichier_url)} · {formatBytes(currentTranslation.file_size)} · {currentTranslation.file_format?.toUpperCase()}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href={getFileUrl(currentTranslation.fichier_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cobalt hover:text-blue-700"
                            >
                                👁️ Voir
                            </a>
                            <label className="cursor-pointer text-green-600 hover:text-green-700">
                                🔄 Remplacer le fichier
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="hidden"
                                    onChange={(e) => handleReplaceFile(e.target.files[0])}
                                />
                            </label>
                            <button onClick={handleShowRevisions} className="text-slate-500 hover:text-slate-700">
                                🕓 Historique
                            </button>
                            <button onClick={handleDeleteTranslation} className="text-red-600 hover:text-red-700">
                                🗑️ Supprimer cette traduction
                            </button>
                        </div>

                        {revisions && (
                            <div className="mt-4 border-t pt-3">
                                {revisions.length === 0 && <p className="text-sm text-slate-400">Aucune révision antérieure.</p>}
                                <ul className="space-y-2">
                                    {revisions.map((rev) => (
                                        <li key={rev.id} className="text-sm text-slate-500">
                                            {getFileName(rev.fichier_url)} · {formatBytes(rev.file_size)} · remplacé par {rev.replaced_by_name || '—'} le{' '}
                                            {new Date(rev.replaced_at).toLocaleString('fr-FR')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}