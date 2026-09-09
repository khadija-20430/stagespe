Voici le README.md mis à jour selon ton projet actuel :

---

# 📘 ESI International Portal — Backend

Portail de coopération internationale de l'ESI — backend Node.js/Express avec PostgreSQL (Supabase).

---

## 🚀 Installation

```bash
cd backend
npm install
```

Copie `.env.example` en `.env` et renseigne tes variables :

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=ton_secret_jwt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton_email@gmail.com
SMTP_PASS=ton_mot_de_passe_app
SMTP_FROM="ESI Coopération Internationale" <ton_email@gmail.com>
FRONTEND_URL=http://localhost:13000
PORT=5000
```

---

## 🗄️ Base de données

Exécute `schema.sql` dans le SQL Editor de Supabase.

**Si tu repars d'une base existante :**

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Puis colle l'intégralité de `schema.sql`.

---

## 👤 Créer ton compte administrateur

```bash
node scripts/createAdmin.js "Ton Nom" email@esi.dz TonMotDePasse
```

**Exemple :**
```bash
node scripts/createAdmin.js "Amelia Super Admin" na_tararbit@esi.dz MonMotDePasse123
```

Le rôle par défaut est `super_admin`. Tu peux aussi spécifier `admin` ou `utilisateur` en 4e argument :

```bash
node scripts/createAdmin.js "Amelia Admin" admin@esi.dz MonMotDePasse123 admin
```

---

## ▶️ Lancer le serveur

```bash
npm run dev
```

Le serveur tourne sur `http://localhost:5000`.

---

## 📁 Structure du projet

```
backend/
├── controllers/          # Logique métier
│   ├── authController.js
│   ├── agreementsController.js
│   ├── callsController.js
│   ├── documentsController.js
│   ├── mobilityController.js
│   ├── notificationsController.js
│   ├── partnersController.js
│   ├── programmesController.js
│   ├── projectsController.js
│   ├── settingsController.js
│   └── ...
├── models/               # Accès à la base de données
│   ├── authModel.js
│   ├── agreementsModel.js
│   ├── notificationsModel.js
│   ├── settingsModel.js
│   └── ...
├── routes/               # Définition des routes API
│   ├── authRoutes.js
│   ├── notificationsRoutes.js
│   ├── settingsRoutes.js
│   └── ...
├── middleware/           # Middlewares (auth, RBAC, audit, upload)
├── lib/                  # Utilitaires (mailer, i18n, géocodage)
├── services/             # Services (notificationScheduler)
├── scripts/              # Scripts utilitaires (createAdmin)
├── uploads/              # Fichiers uploadés
├── .env                  # Variables d'environnement
├── server.js             # Point d'entrée
└── package.json
```

---

## 🔐 Authentification et rôles

| Rôle | Permissions |
|---|---|
| **super_admin** | ✅ Tout : création/suppression de comptes, modification des rôles, suppression de contenus, accès à l'audit, paramètres système |
| **admin** | ✅ CRUD complet sur tous les contenus (partenaires, projets, appels, mobilités, actualités, documents, conventions) ❌ Suppression interdite, ❌ Gestion des utilisateurs |
| **utilisateur** | ✅ Lecture seule sur la partie publique |

---

## 📦 Modules principaux

| Module | Description |
|---|---|
| **Partenaires** | Gestion des institutions partenaires (CRUD, géocodage, logo) |
| **Projets** | Projets de recherche nationaux et internationaux |
| **Appels à projets** | Opportunités de financement (Erasmus+, Horizon Europe, MSCA, PRIMA, etc.) |
| **Mobilités** | Opportunités de mobilité (étudiants, enseignants, chercheurs) |
| **Actualités** | News et événements |
| **Conventions** | Accords de partenariat avec suivi des dates d'expiration |
| **Documents** | Bibliothèque documentaire avec catégories et liens vers plusieurs contenus |
| **Programmes** | Programmes de financement |
| **Notifications** | Notifications internes avec planification automatique |
| **Paramètres** | Configuration des emails et templates (super_admin uniquement) |

---

## 📎 Gestion des documents

Les documents peuvent être attachés à **plusieurs contenus** via des tables de jonction :

| Table de jonction | Contenu associé |
|---|---|
| `programme_documents` | Programmes |
| `project_documents` | Projets |
| `call_documents` | Appels à projets |
| `agreement_documents` | Conventions |
| `mobility_documents` | Mobilités |

**Routes spécifiques :**

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/documents/:id/link` | Attacher un document à un contenu |
| `DELETE` | `/documents/:id/link` | Détacher un document d'un contenu |

---

## 🔔 Notifications

Le système de notifications est **automatisé** via un scheduler qui s'exécute toutes les heures :

| Type de notification | Déclencheur |
|---|---|
| **Convention bientôt expirée** | J-5 avant la date de fin |
| **Convention expirée** | Date de fin dépassée |
| **Appel bientôt clos** | J-5 avant la date limite |
| **Appel clos** | Date limite dépassée |
| **Mobilité bientôt clôturée** | J-5 avant la date limite |
| **Mobilité clôturée** | Date limite dépassée |
| **Document expiré** | Date d'expiration dépassée |
| **Brouillon oublié** | Brouillon vieux de plus de 30 jours |
| **Tentatives de connexion suspectes** | 3+ échecs consécutifs |

Les notifications sont envoyées aux utilisateurs ayant les permissions correspondantes (`agreements.view`, `calls.view`, `mobility.view`, `documents.view`, `projects.view`, `partners.view`).

---

## ✉️ Emails

Le système utilise **Nodemailer** avec SMTP pour envoyer :

| Email | Déclencheur |
|---|---|
| Réinitialisation de mot de passe | Demande de l'utilisateur |
| Bienvenue | Création d'un compte |
| Activation de compte | Réactivation par super_admin |
| Désactivation de compte | Désactivation par super_admin |
| Tentatives suspectes | 3+ échecs de connexion |

Tous les templates d'emails sont personnalisables via l'interface d'administration (`/admin/settings/reset-password`).

---

## 🌍 Internationalisation

Le backend supporte 3 langues :
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **Anglais**
- 🇩🇿 **Arabe**

Les traductions sont gérées via :
- **Traduction statique** : fichiers JSON (`src/i18n/locales/`)
- **Traduction dynamique** : API MyMemory pour les contenus saisis par les administrateurs

---

## 🗺️ Géocodage

Le système utilise **Nominatim (OpenStreetMap)** pour le géocodage des adresses des partenaires. Les coordonnées GPS sont stockées en base pour l'affichage sur la carte interactive (Leaflet).

---

## 📊 Schéma de la base de données

Tables principales :

| Table | Description |
|---|---|
| `users` | Utilisateurs (authentification, rôles) |
| `partners` | Institutions partenaires |
| `agreements` | Conventions et accords |
| `projects` | Projets de recherche |
| `calls` | Appels à projets |
| `mobility` | Opportunités de mobilité |
| `news` | Actualités et événements |
| `programmes` | Programmes de financement |
| `documents` | Documents téléchargeables |
| `notifications` | Notifications internes |
| `login_history` | Historique des connexions |
| `password_reset_tokens` | Tokens de réinitialisation |

---

## 🛠️ Scripts disponibles

```bash
# Créer un compte administrateur
node scripts/createAdmin.js "Nom" email@esi.dz motdepasse

# Lancer le serveur en développement
npm run dev

# Lancer le serveur en production
npm start
```

---

## 🔐 Sécurité

- ✅ Authentification JWT
- ✅ RBAC (contrôle d'accès basé sur les rôles)
- ✅ Hachage des mots de passe (bcrypt)
- ✅ Limitation des tentatives de connexion
- ✅ Requêtes paramétrées (protection SQL injection)
- ✅ Audit log des actions sensibles
- ✅ Upload sécurisé (extension, taille)
- ✅ Variables d'environnement

---

## 📦 Dépendances principales

| Package | Version | Utilité |
|---|---|---|
| `express` | ^4.19.2 | Framework web |
| `pg` | ^8.12.0 | Client PostgreSQL |
| `jsonwebtoken` | ^9.0.2 | JWT |
| `bcryptjs` | ^2.4.3 | Hachage |
| `nodemailer` | ^6.9.13 | Emails SMTP |
| `multer` | ^1.4.5 | Upload de fichiers |
| `cors` | ^2.8.5 | CORS |
| `dotenv` | ^16.4.5 | Variables d'environnement |
| `express-rate-limit` | ^7.3.1 | Rate limiting |

---

## 👥 Équipe

- **Tararbit Amelia** — Développement frontend & backend
- **Bougherara Khadija** — Développement frontend & backend
- **Dr. Dellys Hachemi Nabil** — Encadrement

---

## 📅 Promotion

2025 — 2026

---

**ESI — École Nationale Supérieure d'Informatique**  
*Service de la Coopération Internationale*