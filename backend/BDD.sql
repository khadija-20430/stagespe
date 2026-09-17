-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.countries (
  id integer NOT NULL DEFAULT nextval('countries_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  iso_code character UNIQUE,
  region character varying,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.languages (
  id integer NOT NULL DEFAULT nextval('languages_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT languages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'utilisateur'::character varying CHECK (role::text = ANY (ARRAY['super_admin'::character varying, 'admin'::character varying, 'utilisateur'::character varying]::text[])),
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  role_id integer,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.login_history (
  id integer NOT NULL DEFAULT nextval('login_history_id_seq'::regclass),
  user_id integer,
  email_attempted character varying,
  success boolean NOT NULL,
  ip_address character varying,
  user_agent text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT login_history_pkey PRIMARY KEY (id),
  CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id integer NOT NULL DEFAULT nextval('password_reset_tokens_id_seq'::regclass),
  user_id integer NOT NULL,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.programmes (
  id integer NOT NULL DEFAULT nextval('programmes_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  acronym character varying,
  organisme_financeur character varying,
  description text,
  official_website character varying,
  logo_url character varying,
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  published_at timestamp without time zone,
  CONSTRAINT programmes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.themes (
  id integer NOT NULL DEFAULT nextval('themes_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT themes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.partnership_types (
  id integer NOT NULL DEFAULT nextval('partnership_types_id_seq'::regclass),
  label character varying NOT NULL UNIQUE,
  CONSTRAINT partnership_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.establishment_types (
  id integer NOT NULL DEFAULT nextval('establishment_types_id_seq'::regclass),
  label character varying NOT NULL UNIQUE,
  CONSTRAINT establishment_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.action_types (
  id integer NOT NULL DEFAULT nextval('action_types_id_seq'::regclass),
  label character varying NOT NULL UNIQUE,
  CONSTRAINT action_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cities (
  id integer NOT NULL DEFAULT nextval('cities_id_seq'::regclass),
  name character varying NOT NULL,
  country_id integer,
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.partners (
  id integer NOT NULL DEFAULT nextval('partners_id_seq'::regclass),
  name character varying NOT NULL,
  official_name character varying,
  country_id integer,
  city character varying,
  establishment_type_id integer,
  partnership_type_id integer,
  partnership_status character varying NOT NULL DEFAULT 'active'::character varying CHECK (partnership_status::text = ANY (ARRAY['active'::character varying, 'pending'::character varying, 'ended'::character varying]::text[])),
  website character varying,
  cooperation_areas text,
  description text,
  logo_url character varying,
  latitude numeric CHECK (latitude IS NULL OR latitude >= '-90'::integer::numeric AND latitude <= 90::numeric),
  longitude numeric CHECK (longitude IS NULL OR longitude >= '-180'::integer::numeric AND longitude <= 180::numeric),
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp without time zone,
  archived_at timestamp without time zone,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  address text,
  scheduled_publish_at timestamp with time zone,
  CONSTRAINT partners_pkey PRIMARY KEY (id),
  CONSTRAINT partners_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id),
  CONSTRAINT partners_establishment_type_id_fkey FOREIGN KEY (establishment_type_id) REFERENCES public.establishment_types(id),
  CONSTRAINT partners_partnership_type_id_fkey FOREIGN KEY (partnership_type_id) REFERENCES public.partnership_types(id),
  CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.institutions (
  id integer NOT NULL DEFAULT nextval('institutions_id_seq'::regclass),
  name character varying NOT NULL,
  city_id integer,
  partner_id integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT institutions_pkey PRIMARY KEY (id),
  CONSTRAINT institutions_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
  CONSTRAINT institutions_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.partner_contacts (
  id integer NOT NULL DEFAULT nextval('partner_contacts_id_seq'::regclass),
  partner_id integer NOT NULL,
  full_name character varying NOT NULL,
  position character varying,
  email character varying,
  phone character varying,
  is_primary boolean DEFAULT false,
  is_public boolean DEFAULT false,
  user_id integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT partner_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT partner_contacts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.agreements (
  id integer NOT NULL DEFAULT nextval('agreements_id_seq'::regclass),
  partner_id integer NOT NULL,
  title character varying NOT NULL,
  type character varying,
  description text,
  terms_conditions text,
  fichier_pdf character varying,
  signature_date date,
  start_date date,
  end_date date,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'expired'::character varying, 'pending'::character varying, 'negotiation'::character varying]::text[])),
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  statut_publication character varying DEFAULT 'draft'::character varying,
  scheduled_publish_at timestamp with time zone,
  published_at timestamp without time zone,
  CONSTRAINT agreements_pkey PRIMARY KEY (id),
  CONSTRAINT agreements_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT agreements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
  title character varying NOT NULL,
  acronym character varying,
  reference_code character varying,
  logo_url character varying,
  description text,
  objectives text,
  target_groups text,
  official_website character varying,
  status character varying NOT NULL DEFAULT 'proposed'::character varying CHECK (status::text = ANY (ARRAY['proposed'::character varying, 'ongoing'::character varying, 'completed'::character varying, 'suspended'::character varying]::text[])),
  programme_id integer,
  coordinator_partner_id integer,
  coordinator_user_id integer,
  budget numeric CHECK (budget IS NULL OR budget >= 0::numeric),
  start_date date,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp without time zone,
  archived_at timestamp without time zone,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id),
  CONSTRAINT projects_coordinator_partner_id_fkey FOREIGN KEY (coordinator_partner_id) REFERENCES public.partners(id),
  CONSTRAINT projects_coordinator_user_id_fkey FOREIGN KEY (coordinator_user_id) REFERENCES public.users(id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.project_deliverables (
  id integer NOT NULL DEFAULT nextval('project_deliverables_id_seq'::regclass),
  project_id integer NOT NULL,
  description text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_deliverables_pkey PRIMARY KEY (id),
  CONSTRAINT project_deliverables_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_results (
  id integer NOT NULL DEFAULT nextval('project_results_id_seq'::regclass),
  project_id integer NOT NULL,
  description text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_results_pkey PRIMARY KEY (id),
  CONSTRAINT project_results_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_partners (
  id integer NOT NULL DEFAULT nextval('project_partners_id_seq'::regclass),
  project_id integer NOT NULL,
  partner_id integer NOT NULL,
  role character varying NOT NULL,
  joined_date date DEFAULT now(),
  CONSTRAINT project_partners_pkey PRIMARY KEY (id),
  CONSTRAINT project_partners_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_partners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.calls (
  id integer NOT NULL DEFAULT nextval('calls_id_seq'::regclass),
  title character varying NOT NULL,
  programme_id integer,
  funding_body character varying,
  description text,
  objectives text,
  eligibility text,
  beneficiaries text,
  action_type_id integer,
  budget_available numeric CHECK (budget_available IS NULL OR budget_available >= 0::numeric),
  funding_rate numeric CHECK (funding_rate IS NULL OR funding_rate >= 0::numeric AND funding_rate <= 100::numeric),
  target_audience character varying,
  publication_date date,
  deadline date,
  official_link character varying,
  contact_person character varying,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['upcoming'::text, 'open'::text, 'closing_soon'::text, 'closed'::text])),
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp without time zone,
  archived_at timestamp without time zone,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  CONSTRAINT calls_pkey PRIMARY KEY (id),
  CONSTRAINT calls_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id),
  CONSTRAINT calls_action_type_id_fkey FOREIGN KEY (action_type_id) REFERENCES public.action_types(id),
  CONSTRAINT calls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.call_themes (
  call_id integer NOT NULL,
  theme_id integer NOT NULL,
  CONSTRAINT call_themes_pkey PRIMARY KEY (call_id, theme_id),
  CONSTRAINT call_themes_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id),
  CONSTRAINT call_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);
CREATE TABLE public.call_countries (
  call_id integer NOT NULL,
  country_id integer NOT NULL,
  CONSTRAINT call_countries_pkey PRIMARY KEY (call_id, country_id),
  CONSTRAINT call_countries_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id),
  CONSTRAINT call_countries_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.mobility (
  id integer NOT NULL DEFAULT nextval('mobility_id_seq'::regclass),
  title character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['student_outgoing'::character varying, 'student_incoming'::character varying, 'teaching'::character varying, 'research'::character varying, 'staff'::character varying, 'internship'::character varying, 'summer_school'::character varying]::text[])),
  programme_id integer,
  project_id integer,
  agreement_id integer,
  destination_country_id integer,
  destination_partner_id integer,
  institution_id integer,
  target_audience text,
  description text,
  conditions text,
  places_count integer CHECK (places_count IS NULL OR places_count >= 0),
  duration character varying,
  period character varying,
  funding_details text,
  application_procedure text,
  selection_criteria text,
  application_link character varying,
  contact_person character varying,
  contact_email character varying,
  deadline date,
  start_date date,
  end_date date,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'closed'::character varying, 'upcoming'::character varying]::text[])),
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp without time zone,
  archived_at timestamp without time zone,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  CONSTRAINT mobility_pkey PRIMARY KEY (id),
  CONSTRAINT mobility_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id),
  CONSTRAINT mobility_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT mobility_agreement_id_fkey FOREIGN KEY (agreement_id) REFERENCES public.agreements(id),
  CONSTRAINT mobility_destination_country_id_fkey FOREIGN KEY (destination_country_id) REFERENCES public.countries(id),
  CONSTRAINT mobility_destination_partner_id_fkey FOREIGN KEY (destination_partner_id) REFERENCES public.partners(id),
  CONSTRAINT mobility_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id),
  CONSTRAINT mobility_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.mobility_language_requirements (
  id integer NOT NULL DEFAULT nextval('mobility_language_requirements_id_seq'::regclass),
  mobility_id integer NOT NULL,
  language_id integer NOT NULL,
  min_level character varying,
  CONSTRAINT mobility_language_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT mobility_language_requirements_mobility_id_fkey FOREIGN KEY (mobility_id) REFERENCES public.mobility(id),
  CONSTRAINT mobility_language_requirements_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.news_events (
  id integer NOT NULL DEFAULT nextval('news_events_id_seq'::regclass),
  title character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['news'::character varying, 'event'::character varying, 'workshop'::character varying, 'meeting'::character varying, 'testimonial'::character varying]::text[])),
  summary text,
  description text,
  project_id integer,
  event_date date,
  end_date date,
  location character varying,
  image_url character varying,
  is_featured boolean NOT NULL DEFAULT false,
  author_name character varying,
  author_role character varying,
  author_photo_url character varying,
  quote_text text,
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  published_at timestamp without time zone,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  CONSTRAINT news_events_pkey PRIMARY KEY (id),
  CONSTRAINT news_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT news_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.document_categories (
  id integer NOT NULL DEFAULT nextval('document_categories_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  label character varying NOT NULL,
  CONSTRAINT document_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
  id integer NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  titre character varying NOT NULL,
  description text,
  fichier_url character varying NOT NULL,
  categorie_id integer NOT NULL,
  langage character varying DEFAULT 'fr'::character varying CHECK (langage::text = ANY (ARRAY['fr'::character varying, 'en'::character varying, 'ar'::character varying]::text[])),
  version character varying DEFAULT '1.0'::character varying,
  file_size bigint,
  file_format character varying,
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying CHECK (statut_publication::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])),
  is_featured boolean NOT NULL DEFAULT false,
  date_expiration date,
  date_upload timestamp without time zone DEFAULT now(),
  uploaded_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  date_publication timestamp without time zone,
  updated_by integer,
  deleted_at timestamp without time zone,
  is_lien_externe boolean NOT NULL DEFAULT false,
  scheduled_publish_at timestamp with time zone,
  published_at timestamp without time zone,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.document_categories(id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
  CONSTRAINT documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.programme_documents (
  programme_id integer NOT NULL,
  document_id integer NOT NULL,
  CONSTRAINT programme_documents_pkey PRIMARY KEY (programme_id, document_id),
  CONSTRAINT programme_documents_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id),
  CONSTRAINT programme_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.project_documents (
  project_id integer NOT NULL,
  document_id integer NOT NULL,
  CONSTRAINT project_documents_pkey PRIMARY KEY (project_id, document_id),
  CONSTRAINT project_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.call_documents (
  call_id integer NOT NULL,
  document_id integer NOT NULL,
  CONSTRAINT call_documents_pkey PRIMARY KEY (call_id, document_id),
  CONSTRAINT call_documents_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id),
  CONSTRAINT call_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.agreement_documents (
  agreement_id integer NOT NULL,
  document_id integer NOT NULL,
  CONSTRAINT agreement_documents_pkey PRIMARY KEY (agreement_id, document_id),
  CONSTRAINT agreement_documents_agreement_id_fkey FOREIGN KEY (agreement_id) REFERENCES public.agreements(id),
  CONSTRAINT agreement_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.mobility_documents (
  mobility_id integer NOT NULL,
  document_id integer NOT NULL,
  CONSTRAINT mobility_documents_pkey PRIMARY KEY (mobility_id, document_id),
  CONSTRAINT mobility_documents_mobility_id_fkey FOREIGN KEY (mobility_id) REFERENCES public.mobility(id),
  CONSTRAINT mobility_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_revisions (
  id integer NOT NULL DEFAULT nextval('document_revisions_id_seq'::regclass),
  document_id integer NOT NULL,
  version character varying NOT NULL,
  fichier_url character varying NOT NULL,
  file_size bigint,
  changed_by integer,
  change_note text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT document_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT document_revisions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id),
  CONSTRAINT document_revisions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.document_access_logs (
  id integer NOT NULL DEFAULT nextval('document_access_logs_id_seq'::regclass),
  document_id integer NOT NULL,
  user_id integer,
  ip_address character varying,
  user_agent text,
  action character varying NOT NULL CHECK (action::text = ANY (ARRAY['view'::character varying, 'download'::character varying, 'preview'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT document_access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT document_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT document_access_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying NOT NULL,
  message text,
  type character varying CHECK (type::text = ANY (ARRAY['info'::character varying, 'warning'::character varying, 'success'::character varying, 'error'::character varying]::text[])),
  link character varying,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id integer NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  user_id integer,
  action character varying NOT NULL,
  details text,
  ip_address character varying,
  user_agent text,
  table_name character varying,
  record_id integer,
  old_values jsonb,
  new_values jsonb,
  entity_type character varying,
  entity_id integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_translations (
  id integer NOT NULL DEFAULT nextval('project_translations_id_seq'::regclass),
  project_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  objectives text,
  target_groups text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_translations_pkey PRIMARY KEY (id),
  CONSTRAINT project_translations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.project_deliverable_translations (
  id integer NOT NULL DEFAULT nextval('project_deliverable_translations_id_seq'::regclass),
  deliverable_id integer NOT NULL,
  language_id integer NOT NULL,
  description text NOT NULL,
  CONSTRAINT project_deliverable_translations_pkey PRIMARY KEY (id),
  CONSTRAINT project_deliverable_translations_deliverable_id_fkey FOREIGN KEY (deliverable_id) REFERENCES public.project_deliverables(id),
  CONSTRAINT project_deliverable_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.project_result_translations (
  id integer NOT NULL DEFAULT nextval('project_result_translations_id_seq'::regclass),
  result_id integer NOT NULL,
  language_id integer NOT NULL,
  description text NOT NULL,
  CONSTRAINT project_result_translations_pkey PRIMARY KEY (id),
  CONSTRAINT project_result_translations_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.project_results(id),
  CONSTRAINT project_result_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.partner_translations (
  id integer NOT NULL DEFAULT nextval('partner_translations_id_seq'::regclass),
  partner_id integer NOT NULL,
  language_id integer NOT NULL,
  name character varying NOT NULL,
  official_name character varying,
  description text,
  cooperation_areas text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT partner_translations_pkey PRIMARY KEY (id),
  CONSTRAINT partner_translations_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.call_translations (
  id integer NOT NULL DEFAULT nextval('call_translations_id_seq'::regclass),
  call_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  objectives text,
  eligibility text,
  beneficiaries text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT call_translations_pkey PRIMARY KEY (id),
  CONSTRAINT call_translations_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id),
  CONSTRAINT call_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.mobility_translations (
  id integer NOT NULL DEFAULT nextval('mobility_translations_id_seq'::regclass),
  mobility_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  conditions text,
  target_audience text,
  application_procedure text,
  selection_criteria text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT mobility_translations_pkey PRIMARY KEY (id),
  CONSTRAINT mobility_translations_mobility_id_fkey FOREIGN KEY (mobility_id) REFERENCES public.mobility(id),
  CONSTRAINT mobility_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.news_translations (
  id integer NOT NULL DEFAULT nextval('news_translations_id_seq'::regclass),
  news_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  summary text,
  description text,
  quote_text text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT news_translations_pkey PRIMARY KEY (id),
  CONSTRAINT news_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id),
  CONSTRAINT news_translations_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news_events(id)
);
CREATE TABLE public.permissions (
  id integer NOT NULL DEFAULT nextval('permissions_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  module character varying NOT NULL,
  action character varying NOT NULL,
  label character varying NOT NULL,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description character varying,
  is_system boolean NOT NULL DEFAULT false,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.role_permissions (
  role_id integer NOT NULL,
  permission_id integer NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.app_settings (
  key character varying NOT NULL,
  value text NOT NULL,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.school_presentation (
  id integer NOT NULL DEFAULT nextval('school_presentation_id_seq'::regclass),
  visibilite character varying NOT NULL DEFAULT 'public'::character varying,
  created_by integer,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_presentation_pkey PRIMARY KEY (id),
  CONSTRAINT school_presentation_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.school_presentation_translation (
  id integer NOT NULL DEFAULT nextval('school_presentation_translation_id_seq'::regclass),
  school_presentation_id integer NOT NULL,
  language_id integer NOT NULL,
  titre character varying NOT NULL,
  description text,
  fichier_url text NOT NULL,
  file_format character varying,
  file_size integer,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_presentation_translation_pkey PRIMARY KEY (id),
  CONSTRAINT school_presentation_translation_school_presentation_id_fkey FOREIGN KEY (school_presentation_id) REFERENCES public.school_presentation(id),
  CONSTRAINT school_presentation_translation_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.school_presentation_revisions (
  id integer NOT NULL DEFAULT nextval('school_presentation_revisions_id_seq'::regclass),
  translation_id integer NOT NULL,
  fichier_url text NOT NULL,
  file_format character varying,
  file_size integer,
  replaced_by integer,
  replaced_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_presentation_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT school_presentation_revisions_translation_id_fkey FOREIGN KEY (translation_id) REFERENCES public.school_presentation_translation(id),
  CONSTRAINT school_presentation_revisions_replaced_by_fkey FOREIGN KEY (replaced_by) REFERENCES public.users(id)
);
CREATE TABLE public.agreement_translations (
  id integer NOT NULL DEFAULT nextval('agreement_translations_id_seq'::regclass),
  agreement_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  terms_conditions text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  type character varying,
  CONSTRAINT agreement_translations_pkey PRIMARY KEY (id),
  CONSTRAINT agreement_translations_agreement_id_fkey FOREIGN KEY (agreement_id) REFERENCES public.agreements(id),
  CONSTRAINT agreement_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.document_translations (
  id integer NOT NULL DEFAULT nextval('document_translations_id_seq'::regclass),
  document_id integer NOT NULL,
  language_id integer NOT NULL,
  titre character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT document_translations_pkey PRIMARY KEY (id),
  CONSTRAINT document_translations_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.notification_milestones (
  id integer NOT NULL DEFAULT nextval('notification_milestones_id_seq'::regclass),
  entity_type character varying NOT NULL,
  entity_id integer NOT NULL,
  milestone character varying NOT NULL,
  sent_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notification_milestones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.programme_translations (
  id integer NOT NULL DEFAULT nextval('programme_translations_id_seq'::regclass),
  programme_id integer NOT NULL,
  language_id integer NOT NULL,
  name character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  organisme_financeur character varying,
  CONSTRAINT programme_translations_pkey PRIMARY KEY (id),
  CONSTRAINT programme_translations_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id),
  CONSTRAINT programme_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.home_slides (
  id integer NOT NULL DEFAULT nextval('home_slides_id_seq'::regclass),
  badge character varying,
  icon_type character varying NOT NULL DEFAULT 'lucide'::character varying,
  icon_value character varying,
  display_order integer NOT NULL DEFAULT 0,
  statut_publication character varying NOT NULL DEFAULT 'draft'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  scheduled_publish_at timestamp with time zone,
  published_at timestamp without time zone,
  CONSTRAINT home_slides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.home_slides_translations (
  id integer NOT NULL DEFAULT nextval('home_slides_translations_id_seq'::regclass),
  slide_id integer NOT NULL,
  language_id integer NOT NULL,
  title character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT home_slides_translations_pkey PRIMARY KEY (id),
  CONSTRAINT home_slides_translations_slide_id_fkey FOREIGN KEY (slide_id) REFERENCES public.home_slides(id),
  CONSTRAINT home_slides_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.theme_translations (
  id integer NOT NULL DEFAULT nextval('theme_translations_id_seq'::regclass),
  theme_id integer NOT NULL,
  language_id integer NOT NULL,
  name character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT theme_translations_pkey PRIMARY KEY (id),
  CONSTRAINT theme_translations_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id),
  CONSTRAINT theme_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.country_translations (
  id integer NOT NULL DEFAULT nextval('country_translations_id_seq'::regclass),
  country_id integer NOT NULL,
  language_id integer NOT NULL,
  name character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT country_translations_pkey PRIMARY KEY (id),
  CONSTRAINT country_translations_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id),
  CONSTRAINT country_translations_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id)
);
CREATE TABLE public.partner_themes (
  partner_id integer NOT NULL,
  theme_id integer NOT NULL,
  CONSTRAINT partner_themes_pkey PRIMARY KEY (partner_id, theme_id),
  CONSTRAINT partner_themes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);