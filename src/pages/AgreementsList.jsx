// src/pages/Public/AgreementsList.jsx

import React, { useEffect, useState } from 'react';
import { getAgreements } from '../../services/api';

const AgreementsList = () => {
  const [agreements, setAgreements] = useState([]);
  
  useEffect(() => {
    getAgreements().then(data => {
      // Filtrer uniquement les accords publiés
      const published = data.filter(a => a.statutPublication === 'published');
      setAgreements(published);
    });
  }, []);

  return (
    <div className="agreements-list">
      <h1>Nos Accords de Partenariat</h1>
      {agreements.map(agreement => (
        <div key={agreement.id} className="agreement-card">
          <h2>{agreement.titre}</h2>
          <p><strong>Partenaire:</strong> {agreement.partnerName}</p>
          <p><strong>Période:</strong> {agreement.dateDebut} - {agreement.dateFin}</p>
          <p>{agreement.description}</p>
          {agreement.fichierPdf && (
            <a href={getFileUrl(agreement.fichierPdf)} target="_blank">
              📄 Consulter le PDF
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
// Dans ManageAgreements.jsx - Ajouter une section documents:

{/* Documents liés */}
{agreement.documents && agreement.documents.length > 0 && (
  <div className="agreement-documents">
    <h3>Documents liés</h3>
    <ul>
      {agreement.documents.map(doc => (
        <li key={doc.id}>
          <a href={getFileUrl(doc.fichier_url)}>
            {doc.titre} ({doc.fileFormat})
          </a>
        </li>
      ))}
    </ul>
  </div>
)}
export default AgreementsList;