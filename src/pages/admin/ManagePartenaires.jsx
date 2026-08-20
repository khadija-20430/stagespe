import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getPartenaires, createPartenaire, updatePartenaire, deletePartenaire,
  getCountries, getEstablishmentTypes, getPartnershipTypes,
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
      title={t('admin.nav.partners')}
      idPrefix="part"
      fetcher={getPartenaires}
      toPayload={toPartnerPayload}
      onCreate={createPartenaire}
      onUpdate={updatePartenaire}
      onDelete={deletePartenaire}
      columns={[
        { key: 'nom', label: t('admin.partenaires.columns.nom') },
        { key: 'pays', label: t('admin.partenaires.columns.pays') },
        { key: 'ville', label: t('admin.partenaires.columns.ville') },
        { key: 'partnershipStatus', label: t('admin.partenaires.columns.statutPartenariat'),
          render: (i) => <Badge tone={partnershipStatusTone(i.partnershipStatus)}>{t(`enums.partnershipStatus.${i.partnershipStatus}`)}</Badge> },
        { key: 'statutPublication', label: t('admin.partenaires.columns.statutPublication'),
          render: (i) => <Badge tone={publicationStatusTone(i.statutPublication)}>{t(`enums.publicationStatus.${i.statutPublication}`)}</Badge> },
      ]}
      fields={[
        { name: 'nom', label: t('admin.partenaires.fields.nom'), type: 'text' },
        { name: 'nomOfficiel', label: t('admin.partenaires.fields.nomOfficiel'), type: 'text' },
        { name: 'paysId', label: t('admin.partenaires.fields.pays'), type: 'select',
          options: countries.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'ville', label: t('admin.partenaires.fields.ville'), type: 'text' },
        { name: 'typeEtablissementId', label: t('admin.partenaires.fields.typeEtablissement'), type: 'select',
          options: establishmentTypes.map((et) => ({ value: et.id, label: et.label })) },
        { name: 'typePartenariatId', label: t('admin.partenaires.fields.typePartenariat'), type: 'select',
          options: partnershipTypes.map((pt) => ({ value: pt.id, label: pt.label })) },
        { name: 'statutPartenariat', label: t('admin.partenaires.fields.statutPartenariat'), type: 'select',
          options: PARTNERSHIP_STATUS.map((code) => ({ value: code, label: t(`enums.partnershipStatus.${code}`) })) },
        { name: 'siteWeb', label: t('admin.partenaires.fields.siteWeb'), type: 'text' },
        { name: 'domaines', label: t('admin.partenaires.fields.domaines'), type: 'list' },
        { name: 'description', label: t('admin.partenaires.fields.description'), type: 'textarea' },
        {
  name: 'logo_url',
  label: t('admin.partenaires.fields.logo'),
  type: 'file',
  accept: 'image/*',
  onFile: async (file, setField) => {
    try {
      const uploaded = await uploadFile(file); // même fonction que pour documents
      setField('logo_url', uploaded.fichier_url);
    } catch (err) {
      alert(err.message);
    }
  },
},
        { name: 'statutPublication', label: t('admin.partenaires.fields.statutPublication'), type: 'select',
          options: PUBLICATION_STATUS.map((code) => ({ value: code, label: t(`enums.publicationStatus.${code}`) })) },
      ]}
    />
  );
}