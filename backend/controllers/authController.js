const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db'); // ← AJOUTER CETTE LIGNE
const authModel = require('../models/authModel');
const settingsModel = require('../models/settingsModel');
const notificationsModel = require('../models/notificationsModel'); // ← AJOUT
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { sendResetCodeEmail } = require('../lib/Mailer');

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

// ============================================================
// LOGIN (AVEC NOTIFICATION POUR TENTATIVES SUSPECTES)
// ============================================================

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

            // 🔔 NOTIFICATION POUR TENTATIVES SUSPECTES (après 3 échecs consécutifs)
            try {
                const recentFailures = await authModel.countRecentFailures(email, LOCKOUT_WINDOW_MINUTES);
                if (recentFailures >= 3) {
                    const userInfo = await authModel.findUserIdByEmail(email);
                    if (userInfo) {
                        await notificationsModel.create({
                            user_id: userInfo.id,
                            title: '⚠️ Tentatives de connexion suspectes',
                            message: `${recentFailures} tentatives de connexion échouées sur votre compte depuis l'IP ${ip}.`,
                            type: 'error',
                            link: '/admin/journal'
                        });
                    }
                }
            } catch (notifErr) {
                console.error('Erreur création notification:', notifErr);
            }

            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = jwt.sign({ id: user.id, full_name: user.full_name, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '8h' }
        );

        await authModel.updateLastLogin(user.id);
        await logAction(user.id, 'login_success', 'user', user.id, null, req);

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// LOGOUT
// ============================================================

exports.logout = async(req, res) => {
    await logAction(req.user.id, 'logout', 'user', req.user.id, null, req);
    res.json({ message: 'Déconnecté avec succès' });
};

// ============================================================
// ME
// ============================================================

exports.me = (req, res) => {
    res.json(req.user);
};

// ============================================================
// REGISTER (AVEC NOTIFICATION POUR SUPER_ADMIN)
// ============================================================

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

        // 🔔 NOTIFICATION POUR LE SUPER_ADMIN QUI A CRÉÉ LE COMPTE
        try {
            await notificationsModel.create({
                user_id: req.user.id,
                title: '✅ Nouveau compte créé',
                message: `Un nouveau compte a été créé : ${full_name} (${email})`,
                type: 'success',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        await logAction(req.user.id, 'create', 'user', newUser.id, { email }, req);
        res.status(201).json(newUser);

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// GET ALL USERS
// ============================================================

exports.getAllUsers = async(req, res) => {
    try {
        const users = await authModel.findAllUsers();
        res.json(users);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// ACTIVATE USER (AVEC NOTIFICATION)
// ============================================================

exports.activateUser = async(req, res) => {
    try {
        const user = await authModel.setActiveStatus(req.params.id, true);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        // 🔔 NOTIFICATION POUR L'UTILISATEUR CONCERNÉ
        try {
            await notificationsModel.create({
                user_id: req.params.id,
                title: '✅ Compte activé',
                message: 'Votre compte a été réactivé. Vous pouvez maintenant vous connecter.',
                type: 'success',
                link: '/admin/login'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        // 🔔 NOTIFICATION POUR LE SUPER_ADMIN
        try {
            await notificationsModel.create({
                user_id: req.user.id,
                title: '✅ Compte activé',
                message: `Vous avez activé le compte de ${user.full_name} (${user.email}).`,
                type: 'success',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        await logAction(req.user.id, 'activate_user', 'user', req.params.id, null, req);
        res.json(user);

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// DEACTIVATE USER (AVEC NOTIFICATION)
// ============================================================

exports.deactivateUser = async(req, res) => {
    try {
        const user = await authModel.setActiveStatus(req.params.id, false);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        // 🔔 NOTIFICATION POUR L'UTILISATEUR CONCERNÉ
        try {
            await notificationsModel.create({
                user_id: req.params.id,
                title: '⛔ Compte désactivé',
                message: 'Votre compte a été désactivé. Contactez un administrateur pour plus d\'informations.',
                type: 'error',
                link: '/admin/login'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        // 🔔 NOTIFICATION POUR LE SUPER_ADMIN
        try {
            await notificationsModel.create({
                user_id: req.user.id,
                title: '⛔ Compte désactivé',
                message: `Vous avez désactivé le compte de ${user.full_name} (${user.email}).`,
                type: 'warning',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        await logAction(req.user.id, 'deactivate_user', 'user', req.params.id, null, req);
        res.json(user);

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// DELETE USER
// ============================================================

exports.deleteUser = async(req, res) => {
    try {
        if (String(req.user.id) === String(req.params.id)) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = await authModel.deleteUser(req.params.id);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        await logAction(req.user.id, 'delete', 'user', req.params.id, { email: user.email }, req);
        res.json({ message: 'Utilisateur supprimé avec succès' });

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// UPDATE USER ROLE (AVEC NOTIFICATION)
// ============================================================

exports.updateUserRole = async(req, res) => {
    try {
        const { role } = req.body;

        if (!['super_admin', 'admin', 'utilisateur'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide' });
        }

        // Récupérer l'utilisateur avant modification
        const userBefore = await authModel.findUserById(req.params.id);
        if (!userBefore) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const oldRole = userBefore.role;

        const user = await authModel.updateRole(req.params.id, role);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        // 🔔 NOTIFICATION POUR L'UTILISATEUR CONCERNÉ
        try {
            await notificationsModel.create({
                user_id: req.params.id,
                title: '🔐 Rôle mis à jour',
                message: `Votre rôle a été changé de "${oldRole}" à "${role}".`,
                type: 'warning',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        // 🔔 NOTIFICATION POUR LE SUPER_ADMIN QUI A FAIT LE CHANGEMENT
        try {
            await notificationsModel.create({
                user_id: req.user.id,
                title: '✅ Rôle utilisateur modifié',
                message: `Vous avez changé le rôle de ${userBefore.full_name} (${userBefore.email}) de "${oldRole}" à "${role}".`,
                type: 'success',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        await logAction(req.user.id, 'update_role', 'user', req.params.id, { old_role: oldRole, new_role: role }, req);
        res.json(user);

    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// UPDATE USER PROFILE
// ============================================================

exports.updateUserProfile = async(req, res) => {
    try {
        const { full_name, email } = req.body;

        if (!full_name && !email) {
            return res.status(400).json({ error: 'Au moins un champ (full_name ou email) est requis' });
        }

        const user = await authModel.updateUserProfile(req.params.id, { full_name, email });
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        await logAction(req.user.id, 'update', 'user', req.params.id, { full_name, email }, req);
        res.json(user);

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre compte' });
        }
        sendError(res, err);
    }
};

// ============================================================
// ASSIGN CUSTOM ROLE (AVEC NOTIFICATION)
// ============================================================
// ============================================================
// ASSIGN CUSTOM ROLE (AVEC NOTIFICATION) - CORRIGÉ
// ============================================================

exports.assignCustomRole = async(req, res) => {
    try {
        const { role_id } = req.body;

        const target = await authModel.findRoleOfUser(req.params.id);
        if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        if (target.role !== 'admin') {
            return res.status(400).json({ error: 'Seul un compte de rôle "admin" peut recevoir un rôle personnalisé' });
        }

        // Récupérer le nom du rôle
        let roleName = null;
        if (role_id) {
            const exists = await authModel.roleExists(role_id);
            if (!exists) return res.status(404).json({ error: 'Rôle non trouvé' });
            // ✅ CORRECTION : utiliser authModel au lieu de pool directement
            const roleInfo = await authModel.findRoleById(role_id);
            roleName = roleInfo?.name || 'Rôle personnalisé';
        }

        const user = await authModel.assignCustomRole(req.params.id, role_id);

        // Récupérer les infos de l'utilisateur
        const userInfo = await authModel.findUserById(req.params.id);
        const adminInfo = await authModel.findUserById(req.user.id);

        // 🔔 NOTIFICATION POUR L'UTILISATEUR CONCERNÉ
        try {
            const message = role_id ?
                `Vos permissions ont été mises à jour. Vous êtes maintenant "${roleName}".` :
                'Vos permissions ont été réinitialisées. Vous n\'avez plus de rôle personnalisé.';

            await notificationsModel.create({
                user_id: req.params.id,
                title: '🔑 Permissions mises à jour',
                message: message,
                type: 'warning',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        // 🔔 NOTIFICATION POUR LE SUPER_ADMIN
        try {
            const message = role_id ?
                `Vous avez attribué le rôle "${roleName}" à ${userInfo?.full_name} (${userInfo?.email}).` :
                `Vous avez retiré le rôle personnalisé de ${userInfo?.full_name} (${userInfo?.email}).`;

            await notificationsModel.create({
                user_id: req.user.id,
                title: '✅ Rôle RBAC attribué',
                message: message,
                type: 'success',
                link: '/admin/users'
            });
        } catch (notifErr) {
            console.error('Erreur création notification:', notifErr);
        }

        await logAction(req.user.id, 'assign_role', 'user', req.params.id, { role_id }, req);
        res.json(user);

    } catch (err) {
        sendError(res, err);
    }
};
// ============================================================
// MY PERMISSIONS
// ============================================================

exports.myPermissions = async(req, res) => {
    try {
        if (req.user.role === 'super_admin') {
            const all = await authModel.findAllPermissionCodes();
            return res.json(all);
        }
        if (req.user.role !== 'admin') return res.json([]);

        const codes = await authModel.findUserPermissionCodes(req.user.id);
        res.json(codes);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// LOGIN HISTORY
// ============================================================

exports.loginHistory = async(req, res) => {
    try {
        const history = await authModel.findLoginHistory();
        res.json(history);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requis' });

        const genericResponse = { message: 'Si ce compte existe, un code de réinitialisation a été envoyé par email.' };

        const user = await authModel.findActiveUserByEmail(email);
        if (!user) return res.json(genericResponse);

        const settings = await settingsModel.getAll();
        const windowMinutes = Number(settings.reset_code_window_minutes);

        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + windowMinutes * 60 * 1000);

        await authModel.createResetToken(user.id, codeHash, expiresAt);
        await sendResetCodeEmail(user.email, code, windowMinutes, settings.reset_email_subject, settings.reset_email_text);

        res.json(genericResponse);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// VERIFY RESET TOKEN
// ============================================================

exports.verifyResetToken = async(req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });

        const user = await authModel.findActiveUserByEmail(email);
        if (!user) return res.status(400).json({ error: 'Code invalide ou expiré' });

        const resetRow = await authModel.findLatestValidResetCode(user.id);
        if (!resetRow) return res.status(400).json({ error: 'Code invalide ou expiré' });

        const settings = await settingsModel.getAll();
        const maxAttempts = Number(settings.max_reset_attempts);

        if (resetRow.attempts >= maxAttempts) {
            return res.status(429).json({ error: 'Trop de tentatives. Demandez un nouveau code.' });
        }

        const codeMatches = await bcrypt.compare(code, resetRow.token);
        if (!codeMatches) {
            await authModel.incrementResetAttempts(resetRow.id);
            return res.status(400).json({ error: 'Code invalide ou expiré' });
        }

        res.json({ valid: true, message: 'Code valide' });
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// RESET PASSWORD
// ============================================================

exports.resetPassword = async(req, res) => {
    try {
        const { email, code, new_password } = req.body;

        if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });
        if (!isPasswordValid(new_password)) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' });
        }

        const user = await authModel.findActiveUserByEmail(email);
        if (!user) return res.status(400).json({ error: 'Code invalide ou expiré' });

        const resetRow = await authModel.findLatestValidResetCode(user.id);
        if (!resetRow) return res.status(400).json({ error: 'Code invalide ou expiré' });

        const settings = await settingsModel.getAll();
        const maxAttempts = Number(settings.max_reset_attempts);

        if (resetRow.attempts >= maxAttempts) {
            return res.status(429).json({ error: 'Trop de tentatives. Demandez un nouveau code.' });
        }

        const codeMatches = await bcrypt.compare(code, resetRow.token);
        if (!codeMatches) {
            await authModel.incrementResetAttempts(resetRow.id);
            return res.status(400).json({ error: 'Code invalide ou expiré' });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await authModel.updatePassword(user.id, password_hash);
        await authModel.markResetTokenUsed(resetRow.id);
        await logAction(user.id, 'password_reset', 'user', user.id, null, req);

        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        sendError(res, err);
    }
};