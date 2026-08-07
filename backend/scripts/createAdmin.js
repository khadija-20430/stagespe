require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const [, , fullName, email, password, role] = process.argv;

  if (!fullName || !email || !password) {
    console.log('Usage : node scripts/createAdmin.js "Ton Nom" ton.email@esi.dz motdepasse [role]');
    console.log('Rôle par défaut : super_admin. Rôles possibles : super_admin, admin, utilisateur');
    process.exit(1);
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    console.log('❌ Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    process.exit(1);
  }

  const finalRole = role || 'super_admin';
  if (!['super_admin', 'admin', 'utilisateur'].includes(finalRole)) {
    console.log('❌ Rôle invalide. Rôles valides : super_admin, admin, utilisateur');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, full_name, email, role`,
      [fullName, email, password_hash, finalRole]
    );
    console.log('✅ Compte créé/mis à jour :', result.rows[0]);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    await pool.end();
  }
}

main();
