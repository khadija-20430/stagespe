const pool = require('../db');

// checkRole reste utile pour les cas simples (réservé strictement au super_admin,
// ex: gestion des comptes, suppression d'un rôle...)
function checkRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
        }
        next();
    };
}

// checkPermission vérifie une permission précise (ex: 'partners.delete').
// - super_admin passe toujours, quoi qu'il arrive
// - utilisateur n'a jamais accès (pas de rôle admin)
// - admin doit avoir un role_id assigné, ET ce rôle doit contenir la permission
// La vérification interroge la BDD à chaque appel (pas de cache dans le JWT)
// pour que les changements de droits faits par le super_admin soient immédiats,
// sans obliger l'admin concerné à se reconnecter.
function checkPermission(permissionCode) {
    return async(req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Connexion requise' });

        if (req.user.role === 'super_admin') return next();
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });

        try {
            const result = await pool.query(
                `SELECT 1 FROM users
         JOIN role_permissions ON role_permissions.role_id = users.role_id
         JOIN permissions ON permissions.id = role_permissions.permission_id
         WHERE users.id = $1 AND permissions.code = $2`, [req.user.id, permissionCode]
            );
            if (result.rows.length === 0) {
                return res.status(403).json({ error: `Accès refusé : permission "${permissionCode}" requise` });
            }
            next();
        } catch (err) {
            console.error('[RBAC] erreur de vérification des permissions :', err.message);
            res.status(500).json({ error: 'Erreur lors de la vérification des droits' });
        }
    };
}

module.exports = { checkRole, checkPermission };