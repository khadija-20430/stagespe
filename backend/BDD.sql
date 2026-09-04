bdd
create table public.action_types (
  id serial not null,
  label character varying(100) not null,
  constraint action_types_pkey primary key (id),
  constraint action_types_label_key unique (label)
) TABLESPACE pg_default;
create table public.agreement_documents (
  agreement_id integer not null,
  document_id integer not null,
  constraint agreement_documents_pkey primary key (agreement_id, document_id),
  constraint agreement_documents_agreement_id_fkey foreign KEY (agreement_id) references agreements (id) on delete CASCADE,
  constraint agreement_documents_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_agreement_documents_document on public.agreement_documents using btree (document_id) TABLESPACE pg_default;
create table public.agreements (
  id serial not null,
  partner_id integer not null,
  title character varying(255) not null,
  type character varying(100) null,
  description text null,
  terms_conditions text null,
  fichier_pdf character varying(255) null,
  signature_date date null,
  start_date date null,
  end_date date null,
  status character varying(50) null default 'active'::character varying,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  statut_publication character varying null default 'draft'::character varying,
  constraint agreements_pkey primary key (id),
  constraint agreements_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint agreements_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete CASCADE,
  constraint agreements_check check (
    (
      (end_date is null)
      or (start_date is null)
      or (end_date >= start_date)
    )
  ),
  constraint agreements_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'expired'::character varying,
            'pending'::character varying,
            'negotiation'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_agreements_partner on public.agreements using btree (partner_id) TABLESPACE pg_default;

create index IF not exists idx_agreements_status on public.agreements using btree (status) TABLESPACE pg_default;

create index IF not exists idx_agreements_dates on public.agreements using btree (start_date, end_date) TABLESPACE pg_default;

create trigger log_agreements_changes
after
update on agreements for EACH row
execute FUNCTION log_audit_changes ();

create trigger update_agreements_updated_at BEFORE
update on agreements for EACH row
execute FUNCTION update_updated_at_column ();
create view public.agreements_expiring_soon as
select
  a.id,
  a.partner_id,
  a.title,
  a.type,
  a.description,
  a.terms_conditions,
  a.fichier_pdf,
  a.signature_date,
  a.start_date,
  a.end_date,
  a.status,
  a.created_by,
  a.created_at,
  a.updated_at,
  a.statut_publication,
  p.name as partner_name,
  a.end_date - CURRENT_DATE as days_remaining,
  case
    when (a.end_date - CURRENT_DATE) <= 0 then 'expired'::text
    when (a.end_date - CURRENT_DATE) <= 30 then 'urgent'::text
    when (a.end_date - CURRENT_DATE) <= 60 then 'warning'::text
    else 'ok'::text
  end as urgency_level,
  case
    when (a.end_date - CURRENT_DATE) <= 0 then '🔴 Expiré'::text
    when (a.end_date - CURRENT_DATE) <= 30 then '🟡 Expire bientôt'::text
    when (a.end_date - CURRENT_DATE) <= 60 then '🔵 Bientôt expiré'::text
    else '✅ OK'::text
  end as alert_message
from
  agreements a
  join partners p on a.partner_id = p.id
where
  a.status::text = 'active'::text
  and a.end_date is not null
  and a.end_date <= (CURRENT_DATE + '60 days'::interval)
order by
  a.end_date;create table public.app_settings (
  key character varying(100) not null,
  value text not null,
  updated_at timestamp without time zone null default now(),
  constraint app_settings_pkey primary key (key)
) TABLESPACE pg_default;
create table public.audit_logs (
  id serial not null,
  user_id integer null,
  action character varying(100) not null,
  details text null,
  ip_address character varying(45) null,
  user_agent text null,
  table_name character varying(100) null,
  record_id integer null,
  old_values jsonb null,
  new_values jsonb null,
  entity_type character varying(50) null,
  entity_id integer null,
  created_at timestamp without time zone null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user on public.audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_action on public.audit_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_table on public.audit_logs using btree (table_name) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_entity on public.audit_logs using btree (entity_type, entity_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_created on public.audit_logs using btree (created_at) TABLESPACE pg_default;
create table public.call_countries (
  call_id integer not null,
  country_id integer not null,
  constraint call_countries_pkey primary key (call_id, country_id),
  constraint call_countries_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint call_countries_country_id_fkey foreign KEY (country_id) references countries (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_call_countries_country on public.call_countries using btree (country_id) TABLESPACE pg_default;
create table public.call_documents (
  call_id integer not null,
  document_id integer not null,
  constraint call_documents_pkey primary key (call_id, document_id),
  constraint call_documents_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint call_documents_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_call_documents_document on public.call_documents using btree (document_id) TABLESPACE pg_default;
create table public.call_themes (
  call_id integer not null,
  theme_id integer not null,
  constraint call_themes_pkey primary key (call_id, theme_id),
  constraint call_themes_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint call_themes_theme_id_fkey foreign KEY (theme_id) references themes (id) on delete CASCADE
) TABLESPACE pg_default;create table public.call_translations (
  id serial not null,
  call_id integer not null,
  language_id integer not null,
  title character varying(255) not null,
  description text null,
  objectives text null,
  eligibility text null,
  beneficiaries text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint call_translations_pkey primary key (id),
  constraint call_translations_call_id_language_id_key unique (call_id, language_id),
  constraint call_translations_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint call_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.calls (
  id serial not null,
  title character varying(255) not null,
  programme_id integer null,
  funding_body character varying(255) null,
  description text null,
  objectives text null,
  eligibility text null,
  beneficiaries text null,
  action_type_id integer null,
  budget_available numeric(12, 2) null,
  funding_rate numeric(5, 2) null,
  target_audience character varying(150) null,
  publication_date date null,
  deadline date null,
  official_link character varying(255) null,
  contact_person character varying(150) null,
  status character varying(50) not null default 'open'::character varying,
  statut_publication character varying(20) not null default 'draft'::character varying,
  published_at timestamp without time zone null,
  archived_at timestamp without time zone null,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint calls_pkey primary key (id),
  constraint calls_programme_id_fkey foreign KEY (programme_id) references programmes (id) on delete set null,
  constraint calls_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint calls_action_type_id_fkey foreign KEY (action_type_id) references action_types (id) on delete set null,
  constraint calls_status_check check (
    (
      (status)::text = any (
        (
          array[
            'open'::character varying,
            'closed'::character varying,
            'upcoming'::character varying,
            'closing_soon'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint calls_statut_publication_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint calls_budget_available_check check (
    (
      (budget_available is null)
      or (budget_available >= (0)::numeric)
    )
  ),
  constraint calls_check check (
    (
      (publication_date is null)
      or (deadline is null)
      or (deadline >= publication_date)
    )
  ),
  constraint calls_funding_rate_check check (
    (
      (funding_rate is null)
      or (
        (funding_rate >= (0)::numeric)
        and (funding_rate <= (100)::numeric)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_calls_programme on public.calls using btree (programme_id) TABLESPACE pg_default;

create index IF not exists idx_calls_status on public.calls using btree (status) TABLESPACE pg_default;

create index IF not exists idx_calls_deadline on public.calls using btree (deadline) TABLESPACE pg_default;

create index IF not exists idx_calls_statut_pub on public.calls using btree (statut_publication) TABLESPACE pg_default;

create index IF not exists idx_calls_title_trgm on public.calls using gin (title extensions.gin_trgm_ops) TABLESPACE pg_default;

create trigger log_calls_changes
after
update on calls for EACH row
execute FUNCTION log_audit_changes ();

create trigger update_calls_updated_at BEFORE
update on calls for EACH row
execute FUNCTION update_updated_at_column ();
create view public.calls_closing_soon as
select
  id,
  title,
  programme_id,
  funding_body,
  description,
  objectives,
  eligibility,
  beneficiaries,
  action_type_id,
  budget_available,
  funding_rate,
  target_audience,
  publication_date,
  deadline,
  official_link,
  contact_person,
  status,
  statut_publication,
  published_at,
  archived_at,
  created_by,
  created_at,
  updated_at
from
  calls
where
  status::text = 'open'::text
  and deadline >= CURRENT_DATE
  and deadline <= (CURRENT_DATE + '15 days'::interval)
order by
  deadline;create table public.cities (
  id serial not null,
  name character varying(150) not null,
  country_id integer null,
  constraint cities_pkey primary key (id),
  constraint cities_name_country_id_key unique (name, country_id),
  constraint cities_country_id_fkey foreign KEY (country_id) references countries (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.countries (
  id serial not null,
  name character varying(100) not null,
  iso_code character(2) null,
  region character varying(100) null,
  constraint countries_pkey primary key (id),
  constraint countries_iso_code_key unique (iso_code),
  constraint countries_name_key unique (name)
) TABLESPACE pg_default;
create view public.dashboard_stats as
select
  (
    select
      count(*) as count
    from
      partners
    where
      partners.partnership_status::text = 'active'::text
  ) as total_active_partners,
  (
    select
      count(distinct partners.country_id) as count
    from
      partners
    where
      partners.country_id is not null
  ) as total_countries,
  (
    select
      count(*) as count
    from
      agreements
    where
      agreements.status::text = 'active'::text
  ) as active_agreements,
  (
    select
      count(*) as count
    from
      agreements
    where
      agreements.status::text = 'expired'::text
  ) as expired_agreements,
  (
    select
      count(*) as count
    from
      agreements
    where
      agreements.end_date >= CURRENT_DATE
      and agreements.end_date <= (CURRENT_DATE + '30 days'::interval)
  ) as expiring_soon,
  (
    select
      count(*) as count
    from
      projects
    where
      projects.status::text = 'ongoing'::text
  ) as ongoing_projects,
  (
    select
      count(*) as count
    from
      projects
    where
      projects.status::text = 'proposed'::text
  ) as proposed_projects,
  (
    select
      count(*) as count
    from
      projects
    where
      projects.status::text = 'completed'::text
  ) as completed_projects,
  (
    select
      count(*) as count
    from
      calls
    where
      calls.status::text = 'open'::text
  ) as open_calls,
  (
    select
      count(*) as count
    from
      calls
    where
      calls.status::text = 'closing_soon'::text
  ) as closing_soon_calls,
  (
    select
      count(*) as count
    from
      mobility
    where
      mobility.status::text = 'open'::text
  ) as open_mobility,
  (
    select
      count(*) as count
    from
      documents
  ) as total_documents,
  (
    select
      count(*) as count
    from
      news_events
    where
      news_events.statut_publication::text = 'published'::text
  ) as published_news;
create table public.document_access_logs (
  id serial not null,
  document_id integer not null,
  user_id integer null,
  ip_address character varying(45) null,
  user_agent text null,
  action character varying(20) not null,
  created_at timestamp without time zone null default now(),
  constraint document_access_logs_pkey primary key (id),
  constraint document_access_logs_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint document_access_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint document_access_logs_action_check check (
    (
      (action)::text = any (
        (
          array[
            'view'::character varying,
            'download'::character varying,
            'preview'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_doc_access_document on public.document_access_logs using btree (document_id) TABLESPACE pg_default;

create index IF not exists idx_doc_access_user on public.document_access_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_doc_access_created on public.document_access_logs using btree (created_at) TABLESPACE pg_default;
create table public.document_categories (
  id serial not null,
  code character varying(30) not null,
  label character varying(100) not null,
  constraint document_categories_pkey primary key (id),
  constraint document_categories_code_key unique (code)
) TABLESPACE pg_default;
create table public.document_revisions (
  id serial not null,
  document_id integer not null,
  version character varying(20) not null,
  fichier_url character varying(255) not null,
  file_size bigint null,
  changed_by integer null,
  change_note text null,
  created_at timestamp without time zone null default now(),
  constraint document_revisions_pkey primary key (id),
  constraint document_revisions_changed_by_fkey foreign KEY (changed_by) references users (id) on delete set null,
  constraint document_revisions_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.documents (
  id serial not null,
  titre character varying(255) not null,
  description text null,
  fichier_url character varying(255) not null,
  categorie_id integer not null,
  langage character varying(10) null default 'fr'::character varying,
  version character varying(20) null default '1.0'::character varying,
  file_size bigint null,
  file_format character varying(20) null,
  statut_publication character varying(20) not null default 'draft'::character varying,
  is_featured boolean not null default false,
  date_expiration date null,
  date_upload timestamp without time zone null default now(),
  uploaded_by integer null,
  constraint documents_pkey primary key (id),
  constraint documents_categorie_id_fkey foreign KEY (categorie_id) references document_categories (id) on delete RESTRICT,
  constraint documents_uploaded_by_fkey foreign KEY (uploaded_by) references users (id) on delete set null,
  constraint documents_langage_check check (
    (
      (langage)::text = any (
        (
          array[
            'fr'::character varying,
            'en'::character varying,
            'ar'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint documents_statut_publication_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_documents_featured on public.documents using btree (is_featured) TABLESPACE pg_default
where
  (is_featured = true);

create index IF not exists idx_documents_categorie on public.documents using btree (categorie_id) TABLESPACE pg_default;

create index IF not exists idx_documents_visibilite on public.documents using btree (statut_publication) TABLESPACE pg_default;

create index IF not exists idx_documents_langage on public.documents using btree (langage) TABLESPACE pg_default;

create index IF not exists idx_documents_expiration on public.documents using btree (date_expiration) TABLESPACE pg_default;

create index IF not exists idx_documents_uploaded on public.documents using btree (date_upload) TABLESPACE pg_default;
create view public.documents_expired as
select
  id,
  titre,
  description,
  fichier_url,
  categorie_id,
  langage,
  version,
  file_size,
  file_format,
  statut_publication as visibilite,
  is_featured,
  date_expiration,
  date_upload,
  uploaded_by
from
  documents
where
  date_expiration is not null
  and date_expiration < CURRENT_DATE;
create table public.establishment_types (
  id serial not null,
  label character varying(100) not null,
  constraint establishment_types_pkey primary key (id),
  constraint establishment_types_label_key unique (label)
) TABLESPACE pg_default;
create table public.institutions (
  id serial not null,
  name character varying(255) not null,
  city_id integer null,
  partner_id integer null,
  created_at timestamp without time zone null default now(),
  constraint institutions_pkey primary key (id),
  constraint institutions_city_id_fkey foreign KEY (city_id) references cities (id) on delete set null,
  constraint institutions_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete set null
) TABLESPACE pg_default;
create table public.languages (
  id serial not null,
  code character varying(5) not null,
  name character varying(50) not null,
  is_default boolean null default false,
  is_active boolean null default true,
  created_at timestamp without time zone null default now(),
  constraint languages_pkey primary key (id),
  constraint languages_code_key unique (code)
) TABLESPACE pg_default;
create table public.login_history (
  id serial not null,
  user_id integer null,
  email_attempted character varying(150) null,
  success boolean not null,
  ip_address character varying(45) null,
  user_agent text null,
  created_at timestamp without time zone null default now(),
  constraint login_history_pkey primary key (id),
  constraint login_history_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_login_history_user on public.login_history using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_login_history_created on public.login_history using btree (created_at) TABLESPACE pg_default;
create table public.mobility (
  id serial not null,
  title character varying(255) not null,
  type character varying(50) not null,
  programme_id integer null,
  project_id integer null,
  agreement_id integer null,
  destination_country_id integer null,
  destination_partner_id integer null,
  institution_id integer null,
  target_audience text null,
  description text null,
  conditions text null,
  places_count integer null,
  duration character varying(100) null,
  period character varying(100) null,
  funding_details text null,
  application_procedure text null,
  selection_criteria text null,
  application_link character varying(255) null,
  contact_person character varying(150) null,
  contact_email character varying(150) null,
  deadline date null,
  start_date date null,
  end_date date null,
  status character varying(50) not null default 'open'::character varying,
  statut_publication character varying(20) not null default 'draft'::character varying,
  published_at timestamp without time zone null,
  archived_at timestamp without time zone null,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint mobility_pkey primary key (id),
  constraint mobility_destination_country_id_fkey foreign KEY (destination_country_id) references countries (id) on delete set null,
  constraint mobility_destination_partner_id_fkey foreign KEY (destination_partner_id) references partners (id) on delete set null,
  constraint mobility_agreement_id_fkey foreign KEY (agreement_id) references agreements (id) on delete set null,
  constraint mobility_institution_id_fkey foreign KEY (institution_id) references institutions (id) on delete set null,
  constraint mobility_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint mobility_project_id_fkey foreign KEY (project_id) references projects (id) on delete set null,
  constraint mobility_programme_id_fkey foreign KEY (programme_id) references programmes (id) on delete set null,
  constraint mobility_type_check check (
    (
      (type)::text = any (
        (
          array[
            'student_outgoing'::character varying,
            'student_incoming'::character varying,
            'teaching'::character varying,
            'research'::character varying,
            'staff'::character varying,
            'internship'::character varying,
            'summer_school'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint mobility_places_count_check check (
    (
      (places_count is null)
      or (places_count >= 0)
    )
  ),
  constraint mobility_status_check check (
    (
      (status)::text = any (
        (
          array[
            'open'::character varying,
            'closed'::character varying,
            'upcoming'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint mobility_statut_publication_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_mobility_status on public.mobility using btree (status) TABLESPACE pg_default;

create index IF not exists idx_mobility_country on public.mobility using btree (destination_country_id) TABLESPACE pg_default;

create index IF not exists idx_mobility_partner on public.mobility using btree (destination_partner_id) TABLESPACE pg_default;

create index IF not exists idx_mobility_agreement on public.mobility using btree (agreement_id) TABLESPACE pg_default;

create index IF not exists idx_mobility_statut_pub on public.mobility using btree (statut_publication) TABLESPACE pg_default;

create trigger log_mobility_changes
after
update on mobility for EACH row
execute FUNCTION log_audit_changes ();

create trigger update_mobility_updated_at BEFORE
update on mobility for EACH row
execute FUNCTION update_updated_at_column ();
create table public.mobility_documents (
  mobility_id integer not null,
  document_id integer not null,
  constraint mobility_documents_pkey primary key (mobility_id, document_id),
  constraint mobility_documents_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint mobility_documents_mobility_id_fkey foreign KEY (mobility_id) references mobility (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_mobility_documents_document on public.mobility_documents using btree (document_id) TABLESPACE pg_default;
create table public.mobility_language_requirements (
  id serial not null,
  mobility_id integer not null,
  language_id integer not null,
  min_level character varying(10) null,
  constraint mobility_language_requirements_pkey primary key (id),
  constraint mobility_language_requirements_mobility_id_language_id_key unique (mobility_id, language_id),
  constraint mobility_language_requirements_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint mobility_language_requirements_mobility_id_fkey foreign KEY (mobility_id) references mobility (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.mobility_translations (
  id serial not null,
  mobility_id integer not null,
  language_id integer not null,
  title character varying(255) not null,
  description text null,
  conditions text null,
  target_audience text null,
  application_procedure text null,
  selection_criteria text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint mobility_translations_pkey primary key (id),
  constraint mobility_translations_mobility_id_language_id_key unique (mobility_id, language_id),
  constraint mobility_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint mobility_translations_mobility_id_fkey foreign KEY (mobility_id) references mobility (id) on delete CASCADE
) TABLESPACE pg_default;create view public.mobility_with_partners as
select
  m.id,
  m.title,
  m.type,
  m.programme_id,
  m.project_id,
  m.agreement_id,
  m.destination_country_id,
  m.destination_partner_id,
  m.institution_id,
  m.target_audience,
  m.description,
  m.conditions,
  m.places_count,
  m.duration,
  m.period,
  m.funding_details,
  m.application_procedure,
  m.selection_criteria,
  m.application_link,
  m.contact_person,
  m.contact_email,
  m.deadline,
  m.start_date,
  m.end_date,
  m.status,
  m.statut_publication,
  m.published_at,
  m.archived_at,
  m.created_by,
  m.created_at,
  m.updated_at,
  p.name as partner_name,
  c.name as country_name
from
  mobility m
  left join partners p on m.destination_partner_id = p.id
  left join countries c on m.destination_country_id = c.id
where
  m.status::text = 'open'::text
  and m.statut_publication::text = 'published'::text;
create table public.news_events (
  id serial not null,
  title character varying(255) not null,
  type character varying(50) not null,
  summary text null,
  description text null,
  project_id integer null,
  event_date date null,
  end_date date null,
  location character varying(255) null,
  image_url character varying(255) null,
  is_featured boolean not null default false,
  author_name character varying(150) null,
  author_role character varying(150) null,
  author_photo_url character varying(255) null,
  quote_text text null,
  statut_publication character varying(20) not null default 'draft'::character varying,
  published_at timestamp without time zone null,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint news_events_pkey primary key (id),
  constraint news_events_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint news_events_project_id_fkey foreign KEY (project_id) references projects (id) on delete set null,
  constraint chk_news_events_testimonial_fields check (
    (
      ((type)::text <> 'testimonial'::text)
      or (
        (author_name is not null)
        and (quote_text is not null)
      )
    )
  ),
  constraint news_events_statut_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint news_events_type_check check (
    (
      (type)::text = any (
        (
          array[
            'news'::character varying,
            'event'::character varying,
            'workshop'::character varying,
            'meeting'::character varying,
            'testimonial'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_news_events_featured on public.news_events using btree (is_featured) TABLESPACE pg_default
where
  (is_featured = true);

create index IF not exists idx_news_statut on public.news_events using btree (statut_publication) TABLESPACE pg_default;

create index IF not exists idx_news_project on public.news_events using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_news_dates on public.news_events using btree (event_date, end_date) TABLESPACE pg_default;

create trigger update_news_events_updated_at BEFORE
update on news_events for EACH row
execute FUNCTION update_updated_at_column ();
create table public.news_translations (
  id serial not null,
  news_id integer not null,
  language_id integer not null,
  title character varying(255) not null,
  summary text null,
  description text null,
  quote_text text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint news_translations_pkey primary key (id),
  constraint news_translations_news_id_language_id_key unique (news_id, language_id),
  constraint news_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint news_translations_news_id_fkey foreign KEY (news_id) references news_events (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.notifications (
  id serial not null,
  user_id integer not null,
  title character varying(255) not null,
  message text null,
  type character varying(50) null,
  link character varying(255) null,
  is_read boolean not null default false,
  created_at timestamp without time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint notifications_type_check check (
    (
      (type)::text = any (
        (
          array[
            'info'::character varying,
            'warning'::character varying,
            'success'::character varying,
            'error'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user on public.notifications using btree (user_id, is_read) TABLESPACE pg_default;

create index IF not exists idx_notifications_created on public.notifications using btree (created_at) TABLESPACE pg_default;
create table public.partner_contacts (
  id serial not null,
  partner_id integer not null,
  full_name character varying(150) not null,
  position character varying(150) null,
  email character varying(150) null,
  phone character varying(50) null,
  is_primary boolean null default false,
  is_public boolean null default false,
  user_id integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint partner_contacts_pkey primary key (id),
  constraint partner_contacts_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete CASCADE,
  constraint partner_contacts_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_partner_contacts_partner on public.partner_contacts using btree (partner_id) TABLESPACE pg_default;

create trigger update_partner_contacts_updated_at BEFORE
update on partner_contacts for EACH row
execute FUNCTION update_updated_at_column ();
create table public.partner_translations (
  id serial not null,
  partner_id integer not null,
  language_id integer not null,
  name character varying(255) not null,
  official_name character varying(255) null,
  description text null,
  cooperation_areas text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint partner_translations_pkey primary key (id),
  constraint partner_translations_partner_id_language_id_key unique (partner_id, language_id),
  constraint partner_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint partner_translations_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete CASCADE
) TABLESPACE pg_default;create table public.partners (
  id serial not null,
  name character varying(255) not null,
  official_name character varying(255) null,
  country_id integer null,
  city character varying(150) null,
  establishment_type_id integer null,
  partnership_type_id integer null,
  partnership_status character varying(50) not null default 'active'::character varying,
  website character varying(255) null,
  cooperation_areas text null,
  description text null,
  logo_url character varying(255) null,
  latitude numeric(9, 6) null,
  longitude numeric(9, 6) null,
  statut_publication character varying(20) not null default 'draft'::character varying,
  published_at timestamp without time zone null,
  archived_at timestamp without time zone null,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  address text null,
  constraint partners_pkey primary key (id),
  constraint partners_country_id_fkey foreign KEY (country_id) references countries (id) on delete set null,
  constraint partners_partnership_type_id_fkey foreign KEY (partnership_type_id) references partnership_types (id) on delete set null,
  constraint partners_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint partners_establishment_type_id_fkey foreign KEY (establishment_type_id) references establishment_types (id) on delete set null,
  constraint partners_statut_publication_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_partners_longitude check (
    (
      (longitude is null)
      or (
        (longitude >= ('-180'::integer)::numeric)
        and (longitude <= (180)::numeric)
      )
    )
  ),
  constraint partners_partnership_status_check check (
    (
      (partnership_status)::text = any (
        (
          array[
            'active'::character varying,
            'pending'::character varying,
            'ended'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_partners_latitude check (
    (
      (latitude is null)
      or (
        (latitude >= ('-90'::integer)::numeric)
        and (latitude <= (90)::numeric)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_partners_geo on public.partners using btree (latitude, longitude) TABLESPACE pg_default;

create index IF not exists idx_partners_country on public.partners using btree (country_id) TABLESPACE pg_default;

create index IF not exists idx_partners_statut_pub on public.partners using btree (statut_publication) TABLESPACE pg_default;

create index IF not exists idx_partners_name_trgm on public.partners using gin (name extensions.gin_trgm_ops) TABLESPACE pg_default;

create trigger log_partners_changes
after
update on partners for EACH row
execute FUNCTION log_audit_changes ();

create trigger update_partners_updated_at BEFORE
update on partners for EACH row
execute FUNCTION update_updated_at_column ();
create view public.partners_by_country as
select
  c.name as country_name,
  c.iso_code,
  count(p.id) as partner_count
from
  countries c
  left join partners p on p.country_id = c.id
group by
  c.id,
  c.name,
  c.iso_code
order by
  (count(p.id)) desc;create table public.partnership_types (
  id serial not null,
  label character varying(100) not null,
  constraint partnership_types_pkey primary key (id),
  constraint partnership_types_label_key unique (label)
) TABLESPACE pg_default;create table public.password_reset_tokens (
  id serial not null,
  user_id integer not null,
  token character varying(255) not null,
  expires_at timestamp without time zone not null,
  used boolean not null default false,
  created_at timestamp without time zone null default now(),
  attempts integer not null default 0,
  constraint password_reset_tokens_pkey primary key (id),
  constraint password_reset_tokens_token_key unique (token),
  constraint password_reset_tokens_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.permissions (
  id serial not null,
  code character varying(100) not null,
  module character varying(50) not null,
  action character varying(50) not null,
  label character varying(150) not null,
  constraint permissions_pkey primary key (id),
  constraint permissions_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_permissions_module on public.permissions using btree (module) TABLESPACE pg_default;

create trigger trg_grant_new_permission_to_super_admin
after INSERT on permissions for EACH row
execute FUNCTION grant_new_permission_to_super_admin ();
create table public.programme_documents (
  programme_id integer not null,
  document_id integer not null,
  constraint programme_documents_pkey primary key (programme_id, document_id),
  constraint programme_documents_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint programme_documents_programme_id_fkey foreign KEY (programme_id) references programmes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_programme_documents_document on public.programme_documents using btree (document_id) TABLESPACE pg_default;
create table public.programmes (
  id serial not null,
  name character varying(150) not null,
  acronym character varying(20) null,
  organisme_financeur character varying(150) null,
  description text null,
  official_website character varying(255) null,
  logo_url character varying(255) null,
  constraint programmes_pkey primary key (id),
  constraint programmes_name_key unique (name)
) TABLESPACE pg_default;create table public.project_deliverable_translations (
  id serial not null,
  deliverable_id integer not null,
  language_id integer not null,
  description text not null,
  constraint project_deliverable_translations_pkey primary key (id),
  constraint project_deliverable_translations_deliverable_id_language_id_key unique (deliverable_id, language_id),
  constraint project_deliverable_translations_deliverable_id_fkey foreign KEY (deliverable_id) references project_deliverables (id) on delete CASCADE,
  constraint project_deliverable_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE
) TABLESPACE pg_default;create table public.project_deliverables (
  id serial not null,
  project_id integer not null,
  description text not null,
  created_at timestamp without time zone null default now(),
  constraint project_deliverables_pkey primary key (id),
  constraint project_deliverables_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;create table public.project_documents (
  project_id integer not null,
  document_id integer not null,
  constraint project_documents_pkey primary key (project_id, document_id),
  constraint project_documents_document_id_fkey foreign KEY (document_id) references documents (id) on delete CASCADE,
  constraint project_documents_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_project_documents_document on public.project_documents using btree (document_id) TABLESPACE pg_default;create table public.project_partners (
  id serial not null,
  project_id integer not null,
  partner_id integer not null,
  role character varying(100) not null,
  joined_date date null default now(),
  constraint project_partners_pkey primary key (id),
  constraint project_partners_project_id_partner_id_key unique (project_id, partner_id),
  constraint project_partners_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete CASCADE,
  constraint project_partners_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;create table public.project_result_translations (
  id serial not null,
  result_id integer not null,
  language_id integer not null,
  description text not null,
  constraint project_result_translations_pkey primary key (id),
  constraint project_result_translations_result_id_language_id_key unique (result_id, language_id),
  constraint project_result_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint project_result_translations_result_id_fkey foreign KEY (result_id) references project_results (id) on delete CASCADE
) TABLESPACE pg_default;create table public.project_results (
  id serial not null,
  project_id integer not null,
  description text not null,
  created_at timestamp without time zone null default now(),
  constraint project_results_pkey primary key (id),
  constraint project_results_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;create table public.project_translations (
  id serial not null,
  project_id integer not null,
  language_id integer not null,
  title character varying(255) not null,
  description text null,
  objectives text null,
  target_groups text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint project_translations_pkey primary key (id),
  constraint project_translations_project_id_language_id_key unique (project_id, language_id),
  constraint project_translations_language_id_fkey foreign KEY (language_id) references languages (id) on delete CASCADE,
  constraint project_translations_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;create table public.projects (
  id serial not null,
  title character varying(255) not null,
  acronym character varying(50) null,
  reference_code character varying(100) null,
  logo_url character varying(255) null,
  description text null,
  objectives text null,
  target_groups text null,
  official_website character varying(255) null,
  status character varying(50) not null default 'proposed'::character varying,
  programme_id integer null,
  coordinator_partner_id integer null,
  coordinator_user_id integer null,
  budget numeric(12, 2) null,
  start_date date null,
  end_date date null,
  is_featured boolean not null default false,
  statut_publication character varying(20) not null default 'draft'::character varying,
  published_at timestamp without time zone null,
  archived_at timestamp without time zone null,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_programme_id_fkey foreign KEY (programme_id) references programmes (id) on delete set null,
  constraint projects_coordinator_partner_id_fkey foreign KEY (coordinator_partner_id) references partners (id) on delete set null,
  constraint projects_coordinator_user_id_fkey foreign KEY (coordinator_user_id) references users (id) on delete set null,
  constraint projects_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint projects_statut_publication_check check (
    (
      (statut_publication)::text = any (
        (
          array[
            'draft'::character varying,
            'published'::character varying,
            'archived'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint projects_check check (
    (
      (end_date is null)
      or (start_date is null)
      or (end_date >= start_date)
    )
  ),
  constraint projects_status_check check (
    (
      (status)::text = any (
        (
          array[
            'proposed'::character varying,
            'ongoing'::character varying,
            'completed'::character varying,
            'suspended'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint projects_budget_check check (
    (
      (budget is null)
      or (budget >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_projects_featured on public.projects using btree (is_featured) TABLESPACE pg_default
where
  (is_featured = true);

create index IF not exists idx_projects_status on public.projects using btree (status) TABLESPACE pg_default;

create index IF not exists idx_projects_programme on public.projects using btree (programme_id) TABLESPACE pg_default;

create index IF not exists idx_projects_statut_pub on public.projects using btree (statut_publication) TABLESPACE pg_default;

create index IF not exists idx_projects_dates on public.projects using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_projects_title_trgm on public.projects using gin (title extensions.gin_trgm_ops) TABLESPACE pg_default;

create trigger log_projects_changes
after
update on projects for EACH row
execute FUNCTION log_audit_changes ();

create trigger update_projects_updated_at BEFORE
update on projects for EACH row
execute FUNCTION update_updated_at_column ();create view public.projects_by_programme as
select
  pg.name as programme_name,
  pr.status,
  count(*) as count,
  sum(pr.budget) as total_budget
from
  projects pr
  left join programmes pg on pr.programme_id = pg.id
group by
  pg.name,
  pr.status
order by
  pg.name,
  pr.status;create table public.role_permissions (
  role_id integer not null,
  permission_id integer not null,
  constraint role_permissions_pkey primary key (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role on public.role_permissions using btree (role_id) TABLESPACE pg_default;create table public.roles (
  id serial not null,
  name character varying(100) not null,
  description character varying(255) null,
  is_system boolean not null default false,
  created_by integer null,
  created_at timestamp without time zone null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;create table public.school_presentation (
  id serial not null,
  visibilite character varying(20) not null default 'public'::character varying,
  created_by integer null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint school_presentation_pkey primary key (id),
  constraint school_presentation_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

create trigger trg_school_presentation_updated_at BEFORE
update on school_presentation for EACH row
execute FUNCTION set_updated_at ();create table public.school_presentation_revisions (
  id serial not null,
  translation_id integer not null,
  fichier_url text not null,
  file_format character varying(10) null,
  file_size integer null,
  replaced_by integer null,
  replaced_at timestamp without time zone not null default now(),
  constraint school_presentation_revisions_pkey primary key (id),
  constraint school_presentation_revisions_replaced_by_fkey foreign KEY (replaced_by) references users (id),
  constraint school_presentation_revisions_translation_id_fkey foreign KEY (translation_id) references school_presentation_translation (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_school_presentation_revisions_translation on public.school_presentation_revisions using btree (translation_id) TABLESPACE pg_default;create table public.school_presentation_translation (
  id serial not null,
  school_presentation_id integer not null,
  language_id integer not null,
  titre character varying(255) not null,
  description text null,
  fichier_url text not null,
  file_format character varying(10) null,
  file_size integer null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint school_presentation_translation_pkey primary key (id),
  constraint school_presentation_translati_school_presentation_id_langua_key unique (school_presentation_id, language_id),
  constraint school_presentation_translation_language_id_fkey foreign KEY (language_id) references languages (id),
  constraint school_presentation_translation_school_presentation_id_fkey foreign KEY (school_presentation_id) references school_presentation (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_school_presentation_translation_lang on public.school_presentation_translation using btree (language_id) TABLESPACE pg_default;

create trigger trg_school_presentation_translation_updated_at BEFORE
update on school_presentation_translation for EACH row
execute FUNCTION set_updated_at ();create table public.themes (
  id serial not null,
  name character varying(150) not null,
  constraint themes_pkey primary key (id),
  constraint themes_name_key unique (name)
) TABLESPACE pg_default;create table public.users (
  id serial not null,
  full_name character varying(150) not null,
  email character varying(150) not null,
  password_hash character varying(255) not null,
  role character varying(20) not null default 'utilisateur'::character varying,
  is_active boolean not null default true,
  last_login timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  role_id integer null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint users_role_check check (
    (
      (role)::text = any (
        (
          array[
            'super_admin'::character varying,
            'admin'::character varying,
            'utilisateur'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;
-- ============================================================
-- Tables de traduction manquantes : agreements & documents
-- À exécuter sur la base existante (ne modifie aucune table actuelle)
-- Suit exactement le même schéma que call_translations / partner_translations / etc.
-- ============================================================

-- ------------------------------------------------------------
-- agreement_translations
-- Contenu traduisible d'un accord : title, description, terms_conditions.
-- Les autres colonnes (partner_id, dates, status, fichier_pdf...) restent
-- uniquement sur `agreements` : ce ne sont pas des champs de contenu.
-- ------------------------------------------------------------
create table public.agreement_translations (
  id serial not null,
  agreement_id integer not null,
  language_id integer not null,
  title character varying(255) not null,
  description text null,
  terms_conditions text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint agreement_translations_pkey primary key (id),
  constraint agreement_translations_agreement_id_language_id_key unique (agreement_id, language_id),
  constraint agreement_translations_agreement_id_fkey foreign key (agreement_id) references agreements (id) on delete cascade,
  constraint agreement_translations_language_id_fkey foreign key (language_id) references languages (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_agreement_translations_agreement
  on public.agreement_translations using btree (agreement_id) tablespace pg_default;

-- ------------------------------------------------------------
-- document_translations
-- ATTENTION : `documents` a déjà une colonne `langage` (fr/en/ar) — c'est-à-dire
-- qu'un document = un fichier = une langue (un PDF FR et un PDF EN sont deux
-- lignes distinctes dans `documents`). C'est un choix d'architecture valable
-- pour des fichiers (on ne "traduit" pas un PDF automatiquement).
--
-- Cette table `document_translations` ne sert donc PAS à traduire le fichier,
-- mais uniquement les champs texte de la fiche (titre, description) quand tu
-- veux qu'un même document (même fichier) affiche un titre/résumé traduit
-- sans dupliquer toute la ligne `documents`. Si dans ta logique un document
-- = un fichier = une langue est suffisant, tu n'as pas besoin de cette table.
-- ------------------------------------------------------------
create table public.document_translations (
  id serial not null,
  document_id integer not null,
  language_id integer not null,
  titre character varying(255) not null,
  description text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint document_translations_pkey primary key (id),
  constraint document_translations_document_id_language_id_key unique (document_id, language_id),
  constraint document_translations_document_id_fkey foreign key (document_id) references documents (id) on delete cascade,
  constraint document_translations_language_id_fkey foreign key (language_id) references languages (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_document_translations_document
  on public.document_translations using btree (document_id) tablespace pg_default;