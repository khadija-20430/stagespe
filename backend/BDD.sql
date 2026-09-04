CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  iso_code CHAR(2) UNIQUE,
  region VARCHAR(100)
);

CREATE TABLE languages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO languages (code, name, is_default) VALUES
  ('fr', 'Français', TRUE),
  ('en', 'English', FALSE),
  ('ar', 'العربية', FALSE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'utilisateur' CHECK (role IN ('super_admin', 'admin', 'utilisateur')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email_attempted VARCHAR(150),
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE programmes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  acronym VARCHAR(20),
  organisme_financeur VARCHAR(150),
  description TEXT,
  official_website VARCHAR(255),
  logo_url VARCHAR(255)
);

CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE partnership_types (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE establishment_types (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE action_types (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  UNIQUE(name, country_id)
);

CREATE TABLE institutions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
  partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  official_name VARCHAR(255),
  country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
  city VARCHAR(150),
  establishment_type_id INTEGER REFERENCES establishment_types(id) ON DELETE SET NULL,
  partnership_type_id INTEGER REFERENCES partnership_types(id) ON DELETE SET NULL,
  partnership_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (partnership_status IN ('active', 'pending', 'ended')),
  website VARCHAR(255),
  cooperation_areas TEXT,
  description TEXT,
  logo_url VARCHAR(255),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  statut_publication VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut_publication IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_partners_latitude CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  CONSTRAINT chk_partners_longitude CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))
);

CREATE INDEX idx_partners_geo ON partners(latitude, longitude);

CREATE TABLE partner_contacts (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  position VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agreements (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  terms_conditions TEXT,
  fichier_pdf VARCHAR(255),
  signature_date DATE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'negotiation')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  acronym VARCHAR(50),
  reference_code VARCHAR(100),
  logo_url VARCHAR(255),
  description TEXT,
  objectives TEXT,
  target_groups TEXT,
  official_website VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'ongoing', 'completed', 'suspended')),
  programme_id INTEGER REFERENCES programmes(id) ON DELETE SET NULL,
  coordinator_partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  coordinator_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  statut_publication VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut_publication IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (budget IS NULL OR budget >= 0)
);

CREATE INDEX idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;

CREATE TABLE project_deliverables (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_results (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_partners (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  joined_date DATE DEFAULT NOW(),
  UNIQUE (project_id, partner_id)
);

CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  programme_id INTEGER REFERENCES programmes(id) ON DELETE SET NULL,
  funding_body VARCHAR(255),
  description TEXT,
  objectives TEXT,
  eligibility TEXT,
  beneficiaries TEXT,
  action_type_id INTEGER REFERENCES action_types(id) ON DELETE SET NULL,
  budget_available DECIMAL(12,2),
  funding_rate DECIMAL(5,2),
  target_audience VARCHAR(150),
  publication_date DATE,
  deadline DATE,
  official_link VARCHAR(255),
  contact_person VARCHAR(150),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming', 'closing_soon')),
  statut_publication VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut_publication IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (publication_date IS NULL OR deadline IS NULL OR deadline >= publication_date),
  CHECK (budget_available IS NULL OR budget_available >= 0),
  CHECK (funding_rate IS NULL OR (funding_rate >= 0 AND funding_rate <= 100))
);

CREATE TABLE call_themes (
  call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  PRIMARY KEY (call_id, theme_id)
);

CREATE TABLE call_countries (
  call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (call_id, country_id)
);

CREATE INDEX idx_call_countries_country ON call_countries(country_id);

CREATE TABLE mobility (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'student_outgoing', 'student_incoming', 'teaching', 'research',
    'staff', 'internship', 'summer_school'
  )),
  programme_id INTEGER REFERENCES programmes(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  agreement_id INTEGER REFERENCES agreements(id) ON DELETE SET NULL,
  destination_country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
  destination_partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  target_audience TEXT,
  description TEXT,
  conditions TEXT,
  places_count INTEGER,
  duration VARCHAR(100),
  period VARCHAR(100),
  funding_details TEXT,
  application_procedure TEXT,
  selection_criteria TEXT,
  application_link VARCHAR(255),
  contact_person VARCHAR(150),
  contact_email VARCHAR(150),
  deadline DATE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming')),
  statut_publication VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut_publication IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (places_count IS NULL OR places_count >= 0)
);

CREATE TABLE mobility_language_requirements (
  id SERIAL PRIMARY KEY,
  mobility_id INTEGER NOT NULL REFERENCES mobility(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  min_level VARCHAR(10),
  UNIQUE(mobility_id, language_id)
);

CREATE TABLE news_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('news', 'event', 'workshop', 'meeting', 'testimonial')),
  summary TEXT,
  description TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  event_date DATE,
  end_date DATE,
  location VARCHAR(255),
  image_url VARCHAR(255),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  author_name VARCHAR(150),
  author_role VARCHAR(150),
  author_photo_url VARCHAR(255),
  quote_text TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_news_events_testimonial_fields
    CHECK (
      type != 'testimonial'
      OR (author_name IS NOT NULL AND quote_text IS NOT NULL)
    )
);

CREATE INDEX idx_news_events_featured ON news_events(is_featured) WHERE is_featured = TRUE;

CREATE TABLE document_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL
);

INSERT INTO document_categories (code, label) VALUES
  ('institutionnel', 'Institutionnel et coopération'),
  ('template_projet', 'Template de proposition de projet'),
  ('formulaire_financier', 'Formulaire financier et administratif'),
  ('erasmus_mobilite', 'Document mobilité Erasmus+'),
  ('horizon_msca', 'Template Horizon Europe / MSCA'),
  ('national', 'Programme national'),
  ('guide_faq', 'Guide, procédure, FAQ'),
  ('rapport', 'Rapport de projet'),
  ('brochure', 'Brochure institutionnelle'),
  ('convention', 'Convention signée');

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  fichier_url VARCHAR(255) NOT NULL,
  categorie_id INTEGER NOT NULL REFERENCES document_categories(id) ON DELETE RESTRICT,
  langage VARCHAR(10) DEFAULT 'fr' CHECK (langage IN ('fr', 'en', 'ar')),
  version VARCHAR(20) DEFAULT '1.0',
  file_size BIGINT,
  file_format VARCHAR(20),
  statut_publication VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (statut_publication IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  date_expiration DATE,
  date_upload TIMESTAMP DEFAULT NOW(),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_featured ON documents(is_featured) WHERE is_featured = TRUE;

CREATE TABLE programme_documents (
  programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (programme_id, document_id)
);

CREATE TABLE project_documents (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, document_id)
);

CREATE TABLE call_documents (
  call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (call_id, document_id)
);

CREATE TABLE agreement_documents (
  agreement_id INTEGER NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (agreement_id, document_id)
);

CREATE TABLE mobility_documents (
  mobility_id INTEGER NOT NULL REFERENCES mobility(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (mobility_id, document_id)
);

CREATE INDEX idx_programme_documents_document ON programme_documents(document_id);
CREATE INDEX idx_project_documents_document ON project_documents(document_id);
CREATE INDEX idx_call_documents_document ON call_documents(document_id);
CREATE INDEX idx_agreement_documents_document ON agreement_documents(document_id);
CREATE INDEX idx_mobility_documents_document ON mobility_documents(document_id);

CREATE TABLE document_revisions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  fichier_url VARCHAR(255) NOT NULL,
  file_size BIGINT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  change_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_access_logs (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'download', 'preview')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_access_document ON document_access_logs(document_id);
CREATE INDEX idx_doc_access_user ON document_access_logs(user_id);
CREATE INDEX idx_doc_access_created ON document_access_logs(created_at);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) CHECK (type IN ('info', 'warning', 'success', 'error')),
  link VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_translations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  target_groups TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, language_id)
);

CREATE TABLE project_deliverable_translations (
  id SERIAL PRIMARY KEY,
  deliverable_id INTEGER NOT NULL REFERENCES project_deliverables(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  UNIQUE(deliverable_id, language_id)
);

CREATE TABLE project_result_translations (
  id SERIAL PRIMARY KEY,
  result_id INTEGER NOT NULL REFERENCES project_results(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  UNIQUE(result_id, language_id)
);

CREATE TABLE partner_translations (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  official_name VARCHAR(255),
  description TEXT,
  cooperation_areas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, language_id)
);

CREATE TABLE call_translations (
  id SERIAL PRIMARY KEY,
  call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  eligibility TEXT,
  beneficiaries TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(call_id, language_id)
);

CREATE TABLE mobility_translations (
  id SERIAL PRIMARY KEY,
  mobility_id INTEGER NOT NULL REFERENCES mobility(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  conditions TEXT,
  target_audience TEXT,
  application_procedure TEXT,
  selection_criteria TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mobility_id, language_id)
);

CREATE TABLE news_translations (
  id SERIAL PRIMARY KEY,
  news_id INTEGER NOT NULL REFERENCES news_events(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  description TEXT,
  quote_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(news_id, language_id)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mobility_updated_at BEFORE UPDATE ON mobility FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_events_updated_at BEFORE UPDATE ON news_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_contacts_updated_at BEFORE UPDATE ON partner_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS VOID AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
  current_user_id INTEGER;
BEGIN
  BEGIN
    current_user_id := current_setting('app.current_user_id')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  old_json = to_jsonb(OLD);
  new_json = to_jsonb(NEW);

  IF old_json != new_json THEN
    INSERT INTO audit_logs (
      user_id, action, details, table_name, record_id,
      old_values, new_values, ip_address
    )
    VALUES (
      current_user_id,
      TG_OP || '_' || TG_TABLE_NAME,
      'Modification de ' || TG_TABLE_NAME || ' ID: ' || NEW.id::TEXT,
      TG_TABLE_NAME,
      NEW.id,
      old_json,
      new_json,
      current_setting('app.client_ip', TRUE)
    );
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_partners_changes AFTER UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER log_projects_changes AFTER UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER log_agreements_changes AFTER UPDATE ON agreements FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER log_calls_changes AFTER UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
CREATE TRIGGER log_mobility_changes AFTER UPDATE ON mobility FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM partners WHERE partnership_status = 'active') AS total_active_partners,
  (SELECT COUNT(DISTINCT country_id) FROM partners WHERE country_id IS NOT NULL) AS total_countries,
  (SELECT COUNT(*) FROM agreements WHERE status = 'active') AS active_agreements,
  (SELECT COUNT(*) FROM agreements WHERE status = 'expired') AS expired_agreements,
  (SELECT COUNT(*) FROM agreements WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_soon,
  (SELECT COUNT(*) FROM projects WHERE status = 'ongoing') AS ongoing_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'proposed') AS proposed_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects,
  (SELECT COUNT(*) FROM calls WHERE status = 'open') AS open_calls,
  (SELECT COUNT(*) FROM calls WHERE status = 'closing_soon') AS closing_soon_calls,
  (SELECT COUNT(*) FROM mobility WHERE status = 'open') AS open_mobility,
  (SELECT COUNT(*) FROM documents) AS total_documents,
  (SELECT COUNT(*) FROM news_events WHERE statut = 'published') AS published_news;

CREATE OR REPLACE VIEW partners_by_country AS
SELECT c.name AS country_name, c.iso_code, COUNT(p.id) AS partner_count
FROM countries c
LEFT JOIN partners p ON p.country_id = c.id
GROUP BY c.id, c.name, c.iso_code
ORDER BY partner_count DESC;

CREATE OR REPLACE VIEW agreements_expiring_soon AS
SELECT a.*, p.name AS partner_name
FROM agreements a
JOIN partners p ON a.partner_id = p.id
WHERE a.status = 'active'
  AND a.end_date IS NOT NULL
  AND a.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
ORDER BY a.end_date ASC;

CREATE OR REPLACE VIEW calls_closing_soon AS
SELECT * FROM calls
WHERE status = 'open'
  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '15 days'
ORDER BY deadline ASC;

CREATE OR REPLACE VIEW documents_expired AS
SELECT * FROM documents
WHERE date_expiration IS NOT NULL AND date_expiration < CURRENT_DATE;

CREATE OR REPLACE VIEW mobility_with_partners AS
SELECT m.*, p.name AS partner_name, c.name AS country_name
FROM mobility m
LEFT JOIN partners p ON m.destination_partner_id = p.id
LEFT JOIN countries c ON m.destination_country_id = c.id
WHERE m.status = 'open' AND m.statut_publication = 'published';

CREATE OR REPLACE VIEW projects_by_programme AS
SELECT pg.name AS programme_name, pr.status, COUNT(*) AS count, SUM(pr.budget) AS total_budget
FROM projects pr
LEFT JOIN programmes pg ON pr.programme_id = pg.id
GROUP BY pg.name, pr.status
ORDER BY pg.name, pr.status;
-- =====================================================================
-- AJOUT : rôles personnalisés + permissions granulaires
-- Script additif, sans danger sur une base existante (IF NOT EXISTS partout).
-- Ne touche à AUCUNE table existante à part l'ajout d'une colonne sur users.
-- =====================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,   -- ex: 'partners.view', 'documents.delete'
  module VARCHAR(50) NOT NULL,          -- ex: 'partners', 'documents'
  action VARCHAR(50) NOT NULL,          -- ex: 'view', 'create', 'edit', 'delete', 'publish'
  label VARCHAR(150) NOT NULL           -- ex: 'Voir les partenaires'
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Un compte 'admin' peut se voir attribuer un rôle personnalisé (avec ses
-- permissions précises). super_admin et utilisateur n'en ont pas besoin :
-- super_admin passe toujours, utilisateur n'a jamais accès à l'admin.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- =====================================================================
-- SEED : la liste complète des permissions disponibles, par module
-- =====================================================================
INSERT INTO permissions (code, module, action, label) VALUES
  ('partners.view',    'partners', 'view',    'Voir les partenaires'),
  ('partners.create',  'partners', 'create',  'Ajouter un partenaire'),
  ('partners.edit',    'partners', 'edit',    'Modifier un partenaire'),
  ('partners.delete',  'partners', 'delete',  'Supprimer un partenaire'),
  ('partners.publish', 'partners', 'publish', 'Publier/archiver un partenaire'),

  ('agreements.view',   'agreements', 'view',   'Voir les conventions'),
  ('agreements.create', 'agreements', 'create', 'Ajouter une convention'),
  ('agreements.edit',   'agreements', 'edit',   'Modifier une convention'),
  ('agreements.delete', 'agreements', 'delete', 'Supprimer une convention'),

  ('projects.view',    'projects', 'view',    'Voir les projets'),
  ('projects.create',  'projects', 'create',  'Ajouter un projet'),
  ('projects.edit',    'projects', 'edit',    'Modifier un projet'),
  ('projects.delete',  'projects', 'delete',  'Supprimer un projet'),
  ('projects.publish', 'projects', 'publish', 'Publier/archiver un projet'),

  ('calls.view',    'calls', 'view',    'Voir les appels à projets'),
  ('calls.create',  'calls', 'create',  'Ajouter un appel à projets'),
  ('calls.edit',    'calls', 'edit',    'Modifier un appel à projets'),
  ('calls.delete',  'calls', 'delete',  'Supprimer un appel à projets'),
  ('calls.publish', 'calls', 'publish', 'Publier/archiver un appel à projets'),

  ('mobility.view',    'mobility', 'view',    'Voir les offres de mobilité'),
  ('mobility.create',  'mobility', 'create',  'Ajouter une offre de mobilité'),
  ('mobility.edit',    'mobility', 'edit',    'Modifier une offre de mobilité'),
  ('mobility.delete',  'mobility', 'delete',  'Supprimer une offre de mobilité'),
  ('mobility.publish', 'mobility', 'publish', 'Publier/archiver une offre de mobilité'),

  ('news_events.view',    'news_events', 'view',    'Voir les actualités/événements'),
  ('news_events.create',  'news_events', 'create',  'Ajouter une actualité/événement'),
  ('news_events.edit',    'news_events', 'edit',    'Modifier une actualité/événement'),
  ('news_events.delete',  'news_events', 'delete',  'Supprimer une actualité/événement'),
  ('news_events.publish', 'news_events', 'publish', 'Publier une actualité/événement'),

  ('documents.view',   'documents', 'view',   'Voir les documents'),
  ('documents.upload', 'documents', 'upload', 'Téléverser un document'),
  ('documents.edit',   'documents', 'edit',   'Modifier un document'),
  ('documents.delete', 'documents', 'delete', 'Supprimer un document'),

  ('reference_data.manage', 'reference_data', 'manage', 'Gérer les listes de référence (pays, types, catégories...)')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permissions (code, module, action, label) VALUES
  ('users.view',   'users', 'view',   'Voir les utilisateurs'),
  ('users.create', 'users', 'create', 'Créer un utilisateur'),
  ('users.edit',   'users', 'edit',   'Modifier un utilisateur'),
  ('users.delete', 'users', 'delete', 'Supprimer un utilisateur')
ON CONFLICT (code) DO NOTHING;
INSERT INTO permissions (code, module, action, label) VALUES
  ('school_presentation.view',   'school_presentation', 'view',   'Voir la présentation de l''école'),
  ('school_presentation.create', 'school_presentation', 'create', 'Créer une présentation de l''école'),
  ('school_presentation.edit',   'school_presentation', 'edit',   'Modifier la présentation de l''école'),
  ('school_presentation.delete', 'school_presentation', 'delete', 'Supprimer la présentation de l''école')
ON CONFLICT (code) DO NOTHING;
-- =====================================================================
-- SEED : deux rôles système de départ, prêts à l'emploi
-- =====================================================================
INSERT INTO roles (name, description, is_system) VALUES
  ('Gestion complète', 'Accès à tous les modules de contenu, sans suppression', TRUE),
  ('Documentaliste', 'Consultation et gestion des documents uniquement', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Gestion complète' AND p.action IN ('view', 'create', 'edit', 'publish', 'upload')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Documentaliste' AND p.module = 'documents'
ON CONFLICT DO NOTHING;

INSERT INTO programmes (name, acronym, organisme_financeur, description) VALUES
  ('Erasmus+', 'ERA+', 'Commission Européenne', 'Programme européen de mobilité et coopération dans l''éducation'),
  ('Horizon Europe', 'HE', 'Commission Européenne', 'Programme-cadre européen pour la recherche et l''innovation'),
  ('PRIMA', 'PRIMA', 'Partenariat euro-méditerranéen (États membres + UE)', 'Partenariat pour la recherche et l''innovation dans la zone méditerranéenne'),
  ('MSCA', 'MSCA', 'Commission Européenne', 'Marie Skłodowska-Curie Actions'),
  ('National', NULL, 'Ministère de l''Enseignement Supérieur et de la Recherche Scientifique', 'Programmes de financement nationaux')
ON CONFLICT (name) DO NOTHING;

INSERT INTO countries (name, iso_code, region) VALUES
  ('Algérie', 'DZ', 'Maghreb'),
  ('France', 'FR', 'Europe'),
  ('Allemagne', 'DE', 'Europe'),
  ('Espagne', 'ES', 'Europe'),
  ('Italie', 'IT', 'Europe'),
  ('Tunisie', 'TN', 'Maghreb'),
  ('Maroc', 'MA', 'Maghreb'),
  ('Égypte', 'EG', 'Afrique du Nord'),
  ('Turquie', 'TR', 'Asie/Moyen-Orient'),
  ('Royaume-Uni', 'GB', 'Europe'),
  ('Canada', 'CA', 'Amérique du Nord'),
  ('États-Unis', 'US', 'Amérique du Nord')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name) VALUES
  ('Intelligence artificielle'),
  ('Cybersécurité'),
  ('Systèmes embarqués'),
  ('Environnement et énergie'),
  ('Sciences des données'),
  ('Mobilité académique'),
  ('Génie logiciel'),
  ('Réseaux et télécommunications'),
  ('Robotique'),
  ('Bio-informatique')
ON CONFLICT (name) DO NOTHING;

INSERT INTO partnership_types (label) VALUES
  ('Académique'),
  ('Recherche'),
  ('Industriel'),
  ('Institutionnel')
ON CONFLICT (label) DO NOTHING;

INSERT INTO establishment_types (label) VALUES
  ('Université'),
  ('École d''ingénieurs'),
  ('Centre de recherche'),
  ('Entreprise'),
  ('Organisme public')
ON CONFLICT (label) DO NOTHING;

INSERT INTO action_types (label) VALUES
  ('Mobilité individuelle'),
  ('Projet collaboratif'),
  ('Partenariat stratégique'),
  ('Bourse de recherche'),
  ('Cotutelle de thèse')
ON CONFLICT (label) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role, is_active)
VALUES (
  'Super Administrateur',
  'admin@esi.dz',
  '$2y$10$placeholder_hash_here',
  'super_admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_partners_country ON partners(country_id);
CREATE INDEX IF NOT EXISTS idx_partners_statut_pub ON partners(statut_publication);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_partner ON partner_contacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_partner ON agreements(partner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_dates ON agreements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_programme ON projects(programme_id);
CREATE INDEX IF NOT EXISTS idx_projects_statut_pub ON projects(statut_publication);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calls_programme ON calls(programme_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_deadline ON calls(deadline);
CREATE INDEX IF NOT EXISTS idx_calls_statut_pub ON calls(statut_publication);
CREATE INDEX IF NOT EXISTS idx_mobility_status ON mobility(status);
CREATE INDEX IF NOT EXISTS idx_mobility_country ON mobility(destination_country_id);
CREATE INDEX IF NOT EXISTS idx_mobility_partner ON mobility(destination_partner_id);
CREATE INDEX IF NOT EXISTS idx_mobility_agreement ON mobility(agreement_id);
CREATE INDEX IF NOT EXISTS idx_mobility_statut_pub ON mobility(statut_publication);
CREATE INDEX IF NOT EXISTS idx_news_statut ON news_events(statut);
CREATE INDEX IF NOT EXISTS idx_news_project ON news_events(project_id);
CREATE INDEX IF NOT EXISTS idx_news_dates ON news_events(event_date, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_categorie ON documents(categorie_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibilite ON documents(visibilite);
CREATE INDEX IF NOT EXISTS idx_documents_langage ON documents(langage);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON documents(date_expiration);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(date_upload);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);

CREATE INDEX IF NOT EXISTS idx_partners_name_trgm ON partners USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm ON projects USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_calls_title_trgm ON calls USING GIN (title gin_trgm_ops);

-- ============================================================
-- Présentation institutionnelle de l'école (PDF multilingue)
-- Principe : un "concept" language-agnostic (school_presentation),
-- une ligne par langue avec son propre fichier (school_presentation_translation),
-- et un historique des anciens fichiers à chaque remplacement
-- (school_presentation_revisions) — même logique que documents/document_revisions.
-- ============================================================

-- Fonction générique pour auto-mettre à jour updated_at
-- (si tu l'as déjà définie ailleurs dans ton schéma, supprime ce bloc)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Le "concept" : la présentation de l'école, indépendamment de la langue
CREATE TABLE school_presentation (
    id SERIAL PRIMARY KEY,
    visibilite VARCHAR(20) NOT NULL DEFAULT 'public', -- public / draft
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_school_presentation_updated_at
    BEFORE UPDATE ON school_presentation
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Une ligne par langue : titre, définition (description), et le fichier lui-même
CREATE TABLE school_presentation_translation (
    id SERIAL PRIMARY KEY,
    school_presentation_id INTEGER NOT NULL REFERENCES school_presentation(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT, -- la "définition" de la présentation
    fichier_url TEXT NOT NULL,
    file_format VARCHAR(10),
    file_size INTEGER, -- en octets
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (school_presentation_id, language_id)
);

CREATE TRIGGER trg_school_presentation_translation_updated_at
    BEFORE UPDATE ON school_presentation_translation
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Historique : à chaque "Remplacer le fichier", l'ancienne version part ici
--    avant d'être écrasée dans school_presentation_translation
CREATE TABLE school_presentation_revisions (
    id SERIAL PRIMARY KEY,
    translation_id INTEGER NOT NULL REFERENCES school_presentation_translation(id) ON DELETE CASCADE,
    fichier_url TEXT NOT NULL,      -- ancien fichier remplacé
    file_format VARCHAR(10),
    file_size INTEGER,
    replaced_by INTEGER REFERENCES users(id),
    replaced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index utiles
CREATE INDEX idx_school_presentation_translation_lang ON school_presentation_translation(language_id);
CREATE INDEX idx_school_presentation_revisions_translation ON school_presentation_revisions(translation_id);

CREATE OR REPLACE FUNCTION grant_new_permission_to_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT id, NEW.id FROM roles WHERE is_system = TRUE
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_grant_new_permission_to_super_admin
AFTER INSERT ON permissions
FOR EACH ROW
EXECUTE FUNCTION grant_new_permission_to_super_admin();
-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;

-- Créer la nouvelle contrainte avec toutes les valeurs autorisées
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'warning', 'success', 'error'));