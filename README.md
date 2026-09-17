# ESI — Portail Coopération Internationale

Portail web institutionnel de l'École Supérieure en Informatique (ESI), dédié à la coopération internationale : projets de recherche, appels à projets, mobilités, actualités, bibliothèque de documents et espace d'administration.

Le projet est composé de deux parties :
- **Frontend** (ce dépôt, à la racine) — application React consommant l'API REST du backend.
- **Backend** (`backend/`) — API Node.js/Express + PostgreSQL. Voir [`backend/README.md`](backend/README.md) pour l'installation et la configuration.

## Stack technique — Frontend

- **React 18** + JavaScript (aucun TypeScript)
- **Vite** comme bundler
- **Tailwind CSS** pour le style
- **React Router** pour la navigation
- **react-i18next** pour l'internationalisation (FR / EN / AR)

## Couche de services

Le frontend consomme l'API REST du backend via `src/services/api.js` (`getProjets()`, `getProjetsAdmin()`, `getAppels()`, `getMobilites()`, …), avec authentification JWT (`authRequest`) pour les routes protégées et gestion des permissions via `PermissionsContext`.

## Structure du projet
src/
components/
layout/ Navbar, Footer, PublicLayout, AdminNavbar
ui/ Button, Card, Badge, FilterChip, ... (composants réutilisables)
context/ AuthContext, PermissionsContext (authentification & RBAC réels, via l'API)
services/ api.js (appels REST), mappers.js (mapping backend ↔ front)
pages/ Pages publiques + admin/ (dashboard CRUD via CrudManager)
backend/ API Express + PostgreSQL — voir backend/README.md

## Démarrage

### Frontend
```bash
npm install
npm run dev      # serveur de développement (port 13000)
npm run build    # build de production
npm run preview  # prévisualisation du build
```

Le frontend attend le backend accessible (par défaut sur `http://localhost:5000`, voir `backend/README.md`).

### Backend
Voir [`backend/README.md`](backend/README.md) pour l'installation, la configuration `.env`, le schéma PostgreSQL et le lancement du serveur.

## Espace d'administration

Accessible via `/admin`. Authentification réelle via l'API backend (JWT + RBAC). Les rôles disponibles (`super_admin`, `admin`, `utilisateur`) et leurs permissions sont détaillés dans le README backend.

---

## Équipe

- **Tararbit Amelia** — Développement frontend & backend
- **Bougherara Khadija** — Développement frontend & backend
- **Dr. Dellys Hachemi Nabil** — Encadrement

## Promotion

2025 — 2026