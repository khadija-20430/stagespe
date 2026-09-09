const rolesModel = require('../models/rolesModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

// Get tous les roles et nbr d utilisateurs associé
exports.getAll = async(req, res) => {
    try {
        const roles = await rolesModel.findAllWithUserCount();
        res.json(roles);
    } catch (err) { sendError(res, err); }
};

// get un role avec la liste de ses perm
exports.getOne = async(req, res) => {
    try {
        const role = await rolesModel.findById(req.params.id);
        if (!role) return res.status(404).json({ error: 'Rôle non trouvé' });

        const permissions = await rolesModel.findPermissionsByRole(req.params.id);
        res.json({...role, permissions });
    } catch (err) { sendError(res, err); }
};

// creation d un role
exports.create = async(req, res) => {
    try {
        const { name, permission_ids } = req.body;
        if (!name) return res.status(400).json({ error: 'Le nom du rôle est requis' });

        const role = await rolesModel.create(req.body, req.user.id);
        await logAction(req.user.id, 'create', 'role', role.id, { name, permission_ids }, req);
        res.status(201).json(role);
    } catch (err) { sendError(res, err); }
};

// mise a jour d un role
exports.update = async(req, res) => {
    try {
        const roleCheck = await rolesModel.findIsSystemById(req.params.id);
        if (!roleCheck) return res.status(404).json({ error: 'Rôle non trouvé' });
        if (roleCheck.is_system) return res.status(403).json({ error: 'Impossible de modifier un rôle système' });

        const role = await rolesModel.update(req.params.id, req.body);
        res.json(role);
    } catch (err) { sendError(res, err); }
};

// mise a jour des permissions d un role
exports.replacePermissions = async(req, res) => {
    try {
        const { permission_ids } = req.body;
        if (!Array.isArray(permission_ids)) return res.status(400).json({ error: 'permission_ids doit être un tableau' });

        await rolesModel.replacePermissions(req.params.id, permission_ids);
        await logAction(req.user.id, 'update_permissions', 'role', req.params.id, { permission_ids }, req);
        res.json({ message: 'Permissions mises à jour', permission_ids });
    } catch (err) { sendError(res, err); }
};


exports.togglePermission = async(req, res) => {
    try {
        const { permission_id, enabled } = req.body;
        await rolesModel.togglePermission(req.params.id, permission_id, enabled);
        await logAction(req.user.id, enabled ? 'grant_permission' : 'revoke_permission', 'role', req.params.id, { permission_id }, req);
        res.json({ role_id: Number(req.params.id), permission_id, enabled });
    } catch (err) { sendError(res, err); }
};

// suppression d un role
exports.remove = async(req, res) => {
    try {
        const roleCheck = await rolesModel.findIsSystemById(req.params.id);
        if (!roleCheck) return res.status(404).json({ error: 'Rôle non trouvé' });
        if (roleCheck.is_system) return res.status(403).json({ error: 'Impossible de supprimer un rôle système' });

        await rolesModel.unassignFromUsers(req.params.id);
        await rolesModel.remove(req.params.id);
        await logAction(req.user.id, 'delete', 'role', req.params.id, null, req);
        res.json({ message: 'Rôle supprimé' });
    } catch (err) { sendError(res, err); }
};