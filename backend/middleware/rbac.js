const pool = require('../db');

function checkRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
        }
        next();
    };
}

// checkPermission verifie une permission precise pour l utilisateur connecté
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