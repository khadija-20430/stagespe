// À utiliser APRÈS verifyToken. Exemple : router.post('/', verifyToken, checkRole('super_admin', 'admin'), ...)
//
// Politique appliquée dans toutes les routes de ce backend :
// - super_admin : tous les droits, y compris suppression, gestion des comptes,
//   tâches techniques/système
// - admin : gestion du contenu (créer/modifier/publier/archiver), jamais de suppression
// - utilisateur : consultation uniquement, aucun droit d'écriture particulier
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };
}

module.exports = { checkRole };
