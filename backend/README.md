# ESI International Portal — Backend (v4)

Aligné sur `schema.sql` — rôle simple (`super_admin` / `admin` / `utilisateur`), documents liés à plusieurs contenus.

## Installation
```bash
cd backend
npm install
```
Copie `.env.example` en `.env`, mets ta `DATABASE_URL` Supabase + un `JWT_SECRET`.

## Base de données
Exécute tout `schema.sql` dans le SQL Editor Supabase. Si tu repars d'une base existante :
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
puis colle `schema.sql`.

## Créer ton compte
```bash
node scripts/createAdmin.js "Ton Nom" na_tararbit@esi.dz TonMotDePasse1
```
(rôle optionnel en 4e argument : `super_admin` par défaut, ou `admin`, `utilisateur`)

## Lancer
```bash
npm run dev
```

## Ce qui a changé par rapport à la version précédente
- Fini les tables `roles`/`permissions`/`role_permissions`/`user_roles` : `users.role` est maintenant une simple colonne (super_admin/admin/utilisateur)
- `site_settings` supprimée
- `documents` n'a plus de colonnes de lien direct : 5 tables de jonction (`programme_documents`, `project_documents`, `call_documents`, `agreement_documents`, `mobility_documents`) permettent d'attacher un document à **plusieurs** contenus. Nouvelles routes : `POST /documents/:id/link` et `DELETE /documents/:id/link`
- Politique de rôles appliquée partout : `super_admin` = tout (y compris suppression, comptes, système) ; `admin` = créer/modifier/publier/archiver (jamais supprimer) ; `utilisateur` = lecture seule
