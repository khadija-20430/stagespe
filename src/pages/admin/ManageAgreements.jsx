import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    getAgreementsAdmin,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getPartenairesAdmin,
    getAgreementsExpiringSoon,
    uploadFile,
    getFileUrl,
} from '../../services/api.js';
import { toAgreementPayload } from '../../services/mappers.js';

// ============================================================
// FONCTION UTILITAIRE : TÉLÉCHARGEMENT SÉCURISÉ
// ============================================================
const downloadFileSecure = async (path, fallbackName) => {
    try {
        const url = getFileUrl(path);
        if (!url) throw new Error('Aucun fichier disponible');

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Impossible de télécharger (${response.status})`);

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fallbackName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        alert(error.message || "Erreur lors du téléchargement");
    }
};

const ManageAgreements = () => {
    // ===== STATE =====
    const [agreements, setAgreements] = useState([]);
    const [partners, setPartners] = useState([]);
    const [expiringAgreements, setExpiringAgreements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [downloadingFileId, setDownloadingFileId] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    // Form state
    const [form, setForm] = useState({
        titre: '',
        partnerId: '',
        type: '',
        description: '',
        termes: '',
        dateSignature: '',
        dateDebut: '',
        dateFin: '',
        statut: 'active',
        statutPublication: 'draft',
        fichierPdf: null, // AJOUT : pour stocker le chemin du fichier
    });

    // Filters
    const [filters, setFilters] = useState({
        statut: '',
        partnerId: '',
    });

    // ===== LIFECYCLE =====
    useEffect(() => {
        fetchData();
        fetchExpiringAgreements();
    }, [filters]);

    // ===== FETCH EXPIRING AGREEMENTS =====
    const fetchExpiringAgreements = async () => {
        try {
            const data = await getAgreementsExpiringSoon();
            setExpiringAgreements(data || []);
        } catch (err) {
            console.error('Error fetching expiring agreements:', err);
        }
    };

    // ===== FETCH DATA =====
    const fetchData = async () => {
        setLoading(true);
        try {
            const [agreementsData, partnersData] = await Promise.all([
                getAgreementsAdmin(),
                getPartenairesAdmin(),
            ]);

            let filtered = agreementsData || [];

            if (filters.statut) {
                filtered = filtered.filter((a) => a.statut === filters.statut);
            }

            if (filters.partnerId) {
                filtered = filtered.filter((a) => a.partnerId === parseInt(filters.partnerId));
            }

            setAgreements(filtered);
            setPartners(partnersData || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // ===== FONCTION TÉLÉCHARGER =====
    const handleDownloadPDF = async (agreement) => {
        if (!agreement.fichierPdf) {
            setError(`Aucun fichier PDF pour l'accord "${agreement.titre}"`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        const fileName = `${agreement.titre.replace(/\s+/g, '_')}.pdf`;
        setDownloadingFileId(agreement.id);
        
        await downloadFileSecure(agreement.fichierPdf, fileName);
        
        setDownloadingFileId(null);
        setSuccess(`Téléchargement de "${agreement.titre}" commencé`);
        setTimeout(() => setSuccess(''), 3000);
    };

    // ===== EXPORT EXCEL =====
    const exportToExcel = () => {
        if (agreements.length === 0) {
            setError('Aucun accord à exporter');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const data = agreements.map(a => ({
                'ID': a.id || '',
                'Titre': a.titre || '',
                'Partenaire': a.partnerName || '',
                'Type': a.type || '',
                'Date de début': a.dateDebut ? new Date(a.dateDebut).toLocaleDateString('fr-FR') : '',
                'Date de fin': a.dateFin ? new Date(a.dateFin).toLocaleDateString('fr-FR') : '',
                'Jours restants': a.daysRemaining !== undefined ? a.daysRemaining : (a.dateFin ? Math.ceil((new Date(a.dateFin) - new Date()) / (1000 * 60 * 60 * 24)) : ''),
                'Statut': a.statut === 'active' ? 'Actif' :
                          a.statut === 'expired' ? 'Expiré' :
                          a.statut === 'pending' ? 'En attente' :
                          a.statut === 'negotiation' ? 'En négociation' : a.statut || '',
                'Statut publication': a.statutPublication === 'published' ? 'Publié' :
                                     a.statutPublication === 'archived' ? 'Archivé' :
                                     a.statutPublication === 'draft' ? 'Brouillon' : a.statutPublication || '',
                'Fichier PDF': a.fichierPdf ? 'Oui' : 'Non',
                'Description': a.description || '',
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            
            ws['!cols'] = [
                { wch: 10 }, { wch: 40 }, { wch: 30 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 10 }, { wch: 50 },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Accords');
            
            const date = new Date();
            const fileName = `accords_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            setSuccess(`Export Excel réussi : ${fileName}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(`Erreur lors de l'export: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // ===== HANDLERS =====
    const handleOpenModal = (agreement = null) => {
        if (agreement) {
            setEditingId(agreement.id);
            setForm({
                titre: agreement.titre || '',
                partnerId: agreement.partnerId || '',
                type: agreement.type || '',
                description: agreement.description || '',
                termes: agreement.termes || '',
                dateSignature: agreement.dateSignature || '',
                dateDebut: agreement.dateDebut || '',
                dateFin: agreement.dateFin || '',
                statut: agreement.statut || 'active',
                statutPublication: agreement.statutPublication || 'draft',
                fichierPdf: agreement.fichierPdf || null,
            });
            setUploadedFile(agreement.fichierPdf || null);
        } else {
            setEditingId(null);
            setForm({
                titre: '', partnerId: '', type: '', description: '', termes: '',
                dateSignature: '', dateDebut: '', dateFin: '',
                statut: 'active', statutPublication: 'draft',
                fichierPdf: null,
            });
            setUploadedFile(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setUploadedFile(null);
        setError('');
        setSuccess('');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // ===== HANDLER UPLOAD FICHIER =====
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await uploadFile(file);
            const filePath = result.fichier_url || result.file_path;

            setForm((prev) => ({ ...prev, fichierPdf: filePath }));
            setUploadedFile(filePath);

            setSuccess('Fichier uploadé avec succès');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(`Erreur lors de l'upload: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    const validateForm = () => {
        if (!form.titre.trim()) {
            setError('Le titre est requis');
            return false;
        }
        if (!form.partnerId) {
            setError('Le partenaire est requis');
            return false;
        }
        if (form.dateDebut && form.dateFin && new Date(form.dateFin) < new Date(form.dateDebut)) {
            setError('La date de fin doit être postérieure à la date de début');
            return false;
        }
        return true;
    };

    // ===== CORRECTION DU HANDLE SAVE (Ne ferme plus la modale trop tôt) =====
    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = toAgreementPayload(form);

            if (editingId) {
                await updateAgreement(editingId, payload);
                setSuccess('Accord mis à jour avec succès');
            } else {
                await createAgreement(payload);
                setSuccess('Accord créé avec succès');
            }

            // On attend que les données soient à jour AVANT de fermer
            await fetchData();
            await fetchExpiringAgreements();
            
            // Ensuite on ferme proprement
            handleCloseModal();
            setError('');
        } catch (err) {
            setError(err.message || "Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet accord?')) return;

        setLoading(true);
        try {
            await deleteAgreement(id);
            setSuccess('Accord supprimé avec succès');
            await fetchData();
            await fetchExpiringAgreements();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Erreur lors de la suppression');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // ===== CALCUL DES ALERTES D'EXPIRATION =====
    const getExpirationAlert = (endDate) => {
        if (!endDate) return null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        const daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
            return { type: 'danger', message: `Expiré depuis ${Math.abs(daysRemaining)} jours`, icon: '🔴' };
        } else if (daysRemaining <= 30) {
            return { type: 'warning', message: `Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} ⚠️`, icon: '🟡' };
        } else if (daysRemaining <= 60) {
            return { type: 'info', message: `Expire dans ${daysRemaining} jours`, icon: '🔵' };
        }
        return null;
    };

    // ===== RENDER =====
    return (
        <div className="manage-agreements">
            <div className="header">
                <div className="header-left">
                    <h1>Gestion des Accords</h1>
                    <button className="btn-export" onClick={exportToExcel} title="Exporter vers Excel">
                        📊 Exporter Excel
                    </button>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    + Nouvel Accord
                </button>
            </div>

            {/* ALERTES D'EXPIRATION GLOBALES */}
            {expiringAgreements.length > 0 && (
                <div className="alert alert-warning">
                    ⚠️ {expiringAgreements.length} accord(s) expirant dans 60 jours
                </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* FILTERS */}
            <div className="filters">
                <select
                    name="partnerId"
                    value={filters.partnerId}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">Tous les partenaires</option>
                    {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nom}
                        </option>
                    ))}
                </select>

                <select
                    name="statut"
                    value={filters.statut}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="expired">Expiré</option>
                    <option value="pending">En attente</option>
                    <option value="negotiation">En négociation</option>
                </select>

                <div className="filter-stats">
                    <span className="stat-badge total">Total: {agreements.length}</span>
                    <span className="stat-badge active">Actifs: {agreements.filter(a => a.statut === 'active').length}</span>
                </div>
            </div>

            {/* TABLE */}
            <div className="table-wrapper">
                {loading && agreements.length === 0 ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="agreements-table">
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Partenaire</th>
                                <th>Type</th>
                                <th>Début</th>
                                <th>Fin</th>
                                <th>Jours restants</th>
                                <th>Statut</th>
                                <th>Publication</th>
                                <th>Fichier</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agreements.map((agreement) => {
                                let alert = null;
                                if (agreement.daysRemaining !== undefined && agreement.daysRemaining !== null) {
                                    alert = {
                                        type: agreement.urgencyLevel === 'urgent' ? 'warning' : 
                                              agreement.urgencyLevel === 'expired' ? 'danger' : 'info',
                                        message: agreement.alertMessage || `⚠️ ${agreement.daysRemaining} jours`
                                    };
                                } else {
                                    const calculated = getExpirationAlert(agreement.dateFin);
                                    if (calculated) alert = calculated;
                                }

                                return (
                                    <tr key={agreement.id} className={alert?.type === 'danger' ? 'row-expired' : alert?.type === 'warning' ? 'row-warning' : ''}>
                                        <td>{agreement.titre}</td>
                                        <td>{agreement.partnerName}</td>
                                        <td>{agreement.type || '-'}</td>
                                        <td>
                                            {agreement.dateDebut ? 
                                                new Date(agreement.dateDebut).toLocaleDateString('fr-FR') : 
                                                '-'
                                            }
                                        </td>
                                        <td>
                                            {agreement.dateFin ? 
                                                new Date(agreement.dateFin).toLocaleDateString('fr-FR') : 
                                                '-'
                                            }
                                        </td>
                                        <td>
                                            {alert ? (
                                                <span className={`alert-badge alert-${alert.type}`}>
                                                    {alert.message}
                                                </span>
                                            ) : (
                                                <span className="alert-badge alert-ok">✅ OK</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${agreement.statut || 'active'}`}>
                                                {agreement.statut === 'active' ? 'Actif' :
                                                 agreement.statut === 'expired' ? 'Expiré' :
                                                 agreement.statut === 'pending' ? 'En attente' :
                                                 agreement.statut === 'negotiation' ? 'En négociation' :
                                                 agreement.statut || 'Actif'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${agreement.statutPublication || 'draft'}`}>
                                                {agreement.statutPublication === 'published' ? 'Publié' : 
                                                 agreement.statutPublication === 'archived' ? 'Archivé' : 'Brouillon'}
                                            </span>
                                        </td>
                                        
                                        {/* ===== COLONNE FICHIER (Voir + Télécharger) ===== */}
                                        <td className="file-cell">
                                            {agreement.fichierPdf ? (
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={getFileUrl(agreement.fichierPdf)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-cobalt hover:text-blue-700 font-medium transition"
                                                        title="Voir le fichier PDF"
                                                    >
                                                        👁️ <span>Voir</span>
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadPDF(agreement)}
                                                        disabled={downloadingFileId === agreement.id}
                                                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition"
                                                        title="Télécharger le PDF"
                                                    >
                                                        {downloadingFileId === agreement.id ? '⏳' : '⬇️'} 
                                                        <span>Télécharger</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Aucun fichier</span>
                                            )}
                                        </td>

                                        <td className="actions">
                                            <button
                                                type="button"
                                                className="btn-edit"
                                                onClick={() => handleOpenModal(agreement)}
                                                title="Modifier"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() => handleDelete(agreement.id)}
                                                title="Supprimer"
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {!loading && agreements.length === 0 && (
                    <div className="empty-state">
                        <p>Aucun accord trouvé</p>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingId ? "Modifier l'accord" : 'Nouvel accord'}</h2>

                        <form onSubmit={handleSave}>
                            {/* ROW 1 */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Titre *</label>
                                    <input
                                        type="text"
                                        name="titre"
                                        value={form.titre}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Partenaire *</label>
                                    <select
                                        name="partnerId"
                                        value={form.partnerId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Sélectionner un partenaire</option>
                                        {partners.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ROW 2 */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <input
                                        type="text"
                                        name="type"
                                        placeholder="Ex: Accord de partenariat"
                                        value={form.type}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select name="statut" value={form.statut} onChange={handleFormChange}>
                                        <option value="active">Actif</option>
                                        <option value="pending">En attente</option>
                                        <option value="negotiation">En négociation</option>
                                        <option value="expired">Expiré</option>
                                    </select>
                                </div>
                            </div>

                            {/* ROW 3 - DATES */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date de signature</label>
                                    <input
                                        type="date"
                                        name="dateSignature"
                                        value={form.dateSignature}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date de début</label>
                                    <input
                                        type="date"
                                        name="dateDebut"
                                        value={form.dateDebut}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date de fin</label>
                                    <input
                                        type="date"
                                        name="dateFin"
                                        value={form.dateFin}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </div>

                            {/* ROW 4 - DESCRIPTION & TERMES */}
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={form.description}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Termes et conditions</label>
                                <textarea
                                    name="termes"
                                    rows="3"
                                    value={form.termes}
                                    onChange={handleFormChange}
                                />
                            </div>

                            {/* FILE UPLOAD */}
                            <div className="form-group full-width">
                                <label>Fichier PDF</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                />
                                {uploadedFile && (
                                    <div className="file-info">
                                        ✓ Fichier: {uploadedFile.split('/').pop()}
                                    </div>
                                )}
                            </div>

                            {/* ROW 5 - PUBLICATION */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Statut de publication</label>
                                    <select
                                        name="statutPublication"
                                        value={form.statutPublication}
                                        onChange={handleFormChange}
                                    >
                                        <option value="draft">Brouillon</option>
                                        <option value="published">Publié</option>
                                        <option value="archived">Archivé</option>
                                    </select>
                                </div>
                            </div>

                            {/* BUTTONS */}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Sauvegarde...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAgreements;