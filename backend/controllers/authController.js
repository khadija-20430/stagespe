const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authModel = require('../models/authModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

function isPasswordValid(password) {
    return (
        typeof password === 'string' &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
    );
}

exports.login = async(req, res) => {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

        const failures = await authModel.countRecentFailures(email, LOCKOUT_WINDOW_MINUTES);
        if (failures >= MAX_FAILED_ATTEMPTS) {
            return res.status(423).json({ error: `Trop de tentatives échouées. Réessayez dans ${LOCKOUT_WINDOW_MINUTES} minutes.` });
        }

        const user = await authModel.findActiveUserByEmail(email);
        const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

        await authModel.recordLoginAttempt(user ? user.id : null, email, validPassword, ip, userAgent);

        if (!user || !validPassword) {
            await logAction(null, 'login_failed', 'user', null, { email }, req);
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = jwt.sign({ id: user.id, full_name: user.full_name, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '8h' }
        );

        await authModel.updateLastLogin(user.id);
        await logAction(user.id, 'login_success', 'user', user.id, null, req);

        res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
    } catch (err) { sendError(res, err); }
};

exports.logout = async(req, res) => {
    await logAction(req.user.id, 'logout', 'user', req.user.id, null, req);
    res.json({ message: 'Déconnecté avec succès' });
};

exports.me = (req, res) => {
    res.json(req.user);
};

exports.register = async(req, res) => {
    try {
        const { full_name, email, password, role, role_id } = req.body;

        if (!isPasswordValid(password)) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' });
        }
        if (role && !['super_admin', 'admin', 'utilisateur'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const newUser = await authModel.createUser({ full_name, email, password_hash, role, role_id });

        await logAction(req.user.id, 'create', 'user', newUser.id, { email }, req);
        res.status(201).json(newUser);
    } catch (err) { sendError(res, err); }
};

exports.getAllUsers = async(req, res) => {
    try {
        const users = await authModel.findAllUsers();
        res.json(users);
    } catch (err) { sendError(res, err); }
};

exports.activateUser = async(req, res) => {
    try {
        const user = await authModel.setActiveStatus(req.params.id, true);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        await logAction(req.user.id, 'activate_user', 'user', req.params.id, null, req);
        res.json(user);
    } catch (err) { sendError(res, err); }
};

exports.deactivateUser = async(req, res) => {
    try {
        const user = await authModel.setActiveStatus(req.params.id, false);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        await logAction(req.user.id, 'deactivate_user', 'user', req.params.id, null, req);
        res.json(user);
    } catch (err) { sendError(res, err); }
};

exports.updateUserRole = async(req, res) => {
    try {
        const { role } = req.body;
        if (!['super_admin', 'admin', 'utilisateur'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide' });
        }
        const user = await authModel.updateRole(req.params.id, role);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        await logAction(req.user.id, 'update_role', 'user', req.params.id, { new_role: role }, req);
        res.json(user);
    } catch (err) { sendError(res, err); }
};

exports.assignCustomRole = async(req, res) => {
    try {
        const { role_id } = req.body;

        const target = await authModel.findRoleOfUser(req.params.id);
        if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        if (target.role !== 'admin') {
            return res.status(400).json({ error: 'Seul un compte de rôle "admin" peut recevoir un rôle personnalisé' });
        }

        if (role_id) {
            const exists = await authModel.roleExists(role_id);
            if (!exists) return res.status(404).json({ error: 'Rôle non trouvé' });
        }

        const user = await authModel.assignCustomRole(req.params.id, role_id);
        await logAction(req.user.id, 'assign_role', 'user', req.params.id, { role_id }, req);
        res.json(user);
    } catch (err) { sendError(res, err); }
};

exports.myPermissions = async(req, res) => {
    try {
        if (req.user.role === 'super_admin') {
            const all = await authModel.findAllPermissionCodes();
            return res.json(all);
        }
        if (req.user.role !== 'admin') return res.json([]);

        const codes = await authModel.findUserPermissionCodes(req.user.id);
        res.json(codes);
    } catch (err) { sendError(res, err); }
};

exports.loginHistory = async(req, res) => {
    try {
        const history = await authModel.findLoginHistory();
        res.json(history);
    } catch (err) { sendError(res, err); }
};

exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;
        const found = await authModel.findUserIdByEmail(email);
        if (!found) {
            return res.json({ message: 'Si ce compte existe, un lien de réinitialisation a été généré.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await authModel.createResetToken(found.id, token, expiresAt);
        res.json({ message: 'Lien de réinitialisation généré.', reset_token: token });
    } catch (err) { sendError(res, err); }
};

exports.resetPassword = async(req, res) => {
    try {
        const { token, new_password } = req.body;
        if (!isPasswordValid(new_password)) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' });
        }

        const resetToken = await authModel.findValidResetToken(token);
        if (!resetToken) return res.status(400).json({ error: 'Lien invalide ou expiré' });

        const password_hash = await bcrypt.hash(new_password, 10);
        await authModel.updatePassword(resetToken.user_id, password_hash);
        await authModel.markResetTokenUsed(resetToken.id);
        await logAction(resetToken.user_id, 'password_reset', 'user', resetToken.user_id, null, req);

        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) { sendError(res, err); }
};