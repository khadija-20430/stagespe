import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {publishPARTNER,archivePARTNER,
 getPartenairesAdmin, createPartenaire, updatePartenaire, deletePartenaire,
  getCountries, getEstablishmentTypes, getPartnershipTypes, uploadFile,
} from '../../services/api.js';
import { toPartnerPayload } from '../../services/mappers.js';

const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];
const partnershipStatusTone = (s) => (s === 'active' ? 'green' : s === 'pending' ? 'amber' : 'slate');
const PUBLICATION_STATUS = ['draft', 'published', 'archived'];
const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

export default function ManagePartenaires() {
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [establishmentTypes, setEstablishmentTypes] = useState([]);
  const [partnershipTypes, setPartnershipTypes] = useState([]);

  useEffect(() => {
    getCountries().then(setCountries);
    getEstablishmentTypes().then(setEstablishmentTypes);
    getPartnershipTypes().then(setPartnershipTypes);
  }, []);

  return (
    <CrudManager
      title={t('partners')}
      idPrefix="part"
      fetcher={getPartenairesAdmin}
      toPayload={toPartnerPayload}
      onCreate={createPartenaire}
      onUpdate={updatePartenaire}
      onDelete={deletePartenaire}
      onPublish={publishPARTNER}
      onArchive={archivePARTNER}
      columns={[
        { key: 'nom', label: t('nom') },
        { key: 'pays', label: t('pays') },
        { key: 'ville', label: t('ville') },
        { key: 'partnershipStatus', label: t('statutPartenariat'),
          render: (i) => <Badge tone={partnershipStatusTone(i.partnershipStatus)}>{t(`${i.partnershipStatus}`)}</Badge> },
        { key: 'statutPublication', label: t('statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{t(`${i.statutPublication}`)}</Badge> },
      ]}
      fields={[
        { name: 'nom', label: t('nom'), type: 'text' },
        { name: 'nomOfficiel', label: t('nomOfficiel'), type: 'text' },
        { name: 'paysId', label: t('pays'), type: 'select',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'ville', label: t('ville'), type: 'text' },
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
  name: 'logo',
  label: t('logo'),
  type: 'file',
  accept: 'image/*',
  onFile: async (file, setField) => {
    try {
      const uploaded = await uploadFile(file); // même fonction que pour documents
      setField('logo', uploaded.fichier_url);
    } catch (err) {
      alert(err.message);
    }
  },
},
        { name: 'statutPublication', label: t('statutPublication'), type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`${code}`) })) },
      ]}
    />
  );
}