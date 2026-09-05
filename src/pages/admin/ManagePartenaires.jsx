
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handshake } from 'lucide-react';

import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';

import {
  getPartenairesAdmin,
  createPartenaire,
  updatePartenaire,
  deletePartenaire,
  getCountries,
  getEstablishmentTypes,
  getPartnershipTypes,
  uploadFile,
  publishPartner,
  archivePartner,
} from '../../services/api.js';

import { toPartnerPayload } from '../../services/mappers.js';

const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];

const partnershipStatusTone = (s) =>
  s === 'active'
    ? 'green'
    : s === 'pending'
      ? 'amber'
      : 'slate';

const publicationStatusTone = (s) =>
  s === 'published'
    ? 'green'
    : s === 'archived'
      ? 'slate'
      : 'amber';

const publicationStatusLabel = (s) => {
  const status = s || 'draft';

  if (status === 'published') return 'Publié';
  if (status === 'archived') return 'Archivé';

  return 'Brouillon';
};

export default function ManagePartenaires() {
  const { t } = useTranslation();

  const [countries, setCountries] = useState([]);
  const [establishmentTypes, setEstablishmentTypes] = useState([]);
  const [partnershipTypes, setPartnershipTypes] = useState([]);

  useEffect(() => {
    getCountries()
      .then(setCountries)
      .catch((err) =>
        console.error('Erreur récupération pays:', err)
      );

    getEstablishmentTypes()
      .then(setEstablishmentTypes)
      .catch((err) =>
        console.error(
          'Erreur récupération types établissements:',
          err
        )
      );

    getPartnershipTypes()
      .then(setPartnershipTypes)
      .catch((err) =>
        console.error(
          'Erreur récupération types partenariats:',
          err
        )
      );
  }, []);

  return (
    <CrudManager
      title={t('partners')}
      icon={Handshake}
      idPrefix="part"

      /* =========================
         CRUD
      ========================= */

      fetcher={getPartenairesAdmin}
      toPayload={toPartnerPayload}
      onCreate={createPartenaire}
      onUpdate={updatePartenaire}
      onDelete={deletePartenaire}

      /* =========================
         PUBLICATION
      ========================= */

      onPublish={publishPartner}
      onArchive={archivePartner}

      /* =========================
         COLONNES
      ========================= */

      columns={[
        {
          key: 'nom',
          label: t('nom'),
        },

        {
          key: 'pays',
          label: t('pays'),
        },

        {
          key: 'ville',
          label: t('ville'),
        },
        { key: 'adresse', label: t('adresse') },
        {
          key: 'partnershipStatus',
          label: t(
            'statutPartenariat'
          ),

          render: (item) => (
            <Badge
              tone={partnershipStatusTone(
                item.partnershipStatus
              )}
            >
              {t(
                `${item.partnershipStatus}`
              )}
            </Badge>
          ),
        },

        {
          key: 'statut_publication',
          label: t(
            'statutPublication'
          ),

          render: (item) => {
            const status =
              item.statut_publication ||
              item.statutPublication ||
              'draft';

            return (
              <Badge tone={publicationStatusTone(status)}>
                {publicationStatusLabel(status)}
              </Badge>
            );
          },
        },
      ]}

      /* =========================
         FORMULAIRE
         PAS DE statut_publication
         → géré par Publier / Archiver
      ========================= */

      fields={[
        {
          name: 'nom',
          label: t('nom'),
          type: 'text',
          required: true,
        },

        {
          name: 'nomOfficiel',
          label: t(
            'nomOfficiel'
          ),
          type: 'text',
        },

        {
          name: 'paysId',
          label: t('pays'),
          type: 'select',

          options: countries.map((c) => ({
            value: c.id,
            label: c.name,
          })),
        },
        {
          name: 'ville',
          label: t('ville'),
          type: 'text',
        },
{
  name: 'adresse',
  label: t('adresse'),
  type: 'text',
},
        {
          name: 'typeEtablissementId',
          label: t(
            'typeEtablissement'
          ),
          type: 'select',

          options: establishmentTypes.map((et) => ({
            value: et.id,
            label: et.label,
          })),
        },

        {
          name: 'typePartenariatId',
          label: t(
            'typePartenariat'
          ),
          type: 'select',

          options: partnershipTypes.map((pt) => ({
            value: pt.id,
            label: pt.label,
          })),
        },

        {
          name: 'statutPartenariat',
          label: t(
            'statutPartenariat'
          ),
          type: 'select',

          options: PARTNERSHIP_STATUS.map((code) => ({
            value: code,
            label: t(
              `${code}`
            ),
          })),
        },

        {
          name: 'siteWeb',
          label: t(
            'siteWeb'
          ),
          type: 'text',
        },

        {
          name: 'domaines',
          label: t(
            'domaines'
          ),
          type: 'list',
        },

        {
          name: 'description',
          label: t(
            'description'
          ),
          type: 'textarea',
        },

        /* =========================
           LOGO
        ========================= */

        {
          name: 'logo_url',
          label: t(
            'logo'
          ),
          type: 'file',
          accept: 'image/*',

          onFile: async (file, setField) => {
            try {
              const uploaded = await uploadFile(file);

              setField(
                'logo_url',
                uploaded.fichier_url
              );
            } catch (err) {
              console.error(
                'Erreur upload logo:',
                err
              );

              alert(
                err.message ||
                "Erreur lors de l'upload du logo"
              );
            }
          },
        },
      ]}
    />
  );
}

