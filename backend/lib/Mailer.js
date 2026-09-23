const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


const getEmailTemplate = (title, content, buttonText = null, buttonUrl = null, extraInfo = null) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f4f6f9; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a2a4a; color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .header .subtitle { font-size: 14px; opacity: 0.8; margin-top: 5px; }
                .content { background: #ffffff; padding: 35px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .content p { margin: 12px 0; color: #444; }
                .content .highlight { background: #f0f4ff; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #2563EB; margin: 15px 0; }
                .code { display: inline-block; background: #1a2a4a; color: white; padding: 12px 30px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace; margin: 10px 0; }
                .btn { display: inline-block; background: #2563EB; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
                .btn:hover { background: #1d4ed8; }
                .hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
                .footer a { color: #2563EB; text-decoration: none; }
                .warning { color: #dc2626; font-weight: 600; }
                .success { color: #16a34a; font-weight: 600; }
                .tag { display: inline-block; background: #f0f4ff; color: #2563EB; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏛️ ESI</h1>
                    <div class="subtitle">École Nationale Supérieure d'Informatique</div>
                    <div style="margin-top: 8px; font-size: 12px; opacity: 0.6;">Coopération Internationale</div>
                </div>
                <div class="content">
                    ${title ? `<h2 style="margin-top: 0; color: #1a2a4a;">${title}</h2>` : ''}
                    ${content}
                    ${buttonText && buttonUrl ? `<p style="text-align: center; margin: 20px 0;"><a href="${buttonUrl}" class="btn">${buttonText}</a></p>` : ''}
                    ${extraInfo ? `<div class="highlight"><strong>ℹ️ Information :</strong> ${extraInfo}</div>` : ''}
                    <div class="hr"></div>
                    <p style="font-size: 13px; color: #666;">
                        Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ESI - Coopération Internationale</p>
                    <p>École Nationale Supérieure d'Informatique - Oued Smar, Alger</p>
                    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:13000'}">${process.env.FRONTEND_URL || 'http://localhost:13000'}</a></p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const sendEmail = async (to, subject, htmlContent) => {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        html: htmlContent,
    });
};


exports.sendResetCodeEmail = async (to, code, minutes, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{code}}/g, code)
        .replace(/{{minutes}}/g, minutes);

    const htmlContent = getEmailTemplate(
        '🔑 Réinitialisation de mot de passe',
        `<p>${text.replace(/\n/g, '<br>')}</p>`,
        '🔐 Se connecter',
        `${process.env.FRONTEND_URL || 'http://localhost:13000'}/admin/login`,
        'Ce code est à usage unique et expire après la durée indiquée.'
    );

    await sendEmail(to, subject, htmlContent);
};


exports.sendWelcomeEmail = async (to, fullName, temporaryPassword, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{email}}/g, to)
        .replace(/{{password}}/g, temporaryPassword);

    const htmlContent = getEmailTemplate(
        '🎉 Bienvenue sur le Portail International ESI',
        `<p>${text.replace(/\n/g, '<br>')}</p>`,
        '🔐 Accéder à l\'administration',
        `${process.env.FRONTEND_URL || 'http://localhost:13000'}/admin/login`,
        'Conservez vos identifiants en lieu sûr.'
    );

    await sendEmail(to, subject, htmlContent);
};


exports.sendAccountActivationEmail = async (to, fullName, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{date}}/g, new Date().toLocaleString('fr-FR'));

    const htmlContent = getEmailTemplate(
        '✅ Réactivation de compte',
        `<p>${text.replace(/\n/g, '<br>')}</p>`,
        '🔐 Se connecter',
        `${process.env.FRONTEND_URL || 'http://localhost:13000'}/admin/login`,
        'Votre compte est à nouveau actif.'
    );

    await sendEmail(to, subject, htmlContent);
};


exports.sendAccountDeactivationEmail = async (to, fullName, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{date}}/g, new Date().toLocaleString('fr-FR'));

    const htmlContent = getEmailTemplate(
        '🔒 Désactivation de compte',
        `<p>${text.replace(/\n/g, '<br>')}</p>`,
        null,
        null,
        'Pour toute question, contactez le support.'
    );

    await sendEmail(to, subject, htmlContent);
};


exports.sendSuspiciousLoginEmail = async (to, fullName, attempts, ip, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{fullName}}/g, fullName)
        .replace(/{{attempts}}/g, attempts)
        .replace(/{{ip}}/g, ip)
        .replace(/{{date}}/g, new Date().toLocaleString('fr-FR'));

    const htmlContent = getEmailTemplate(
        '⚠️ Alertes de sécurité',
        `<p>${text.replace(/\n/g, '<br>')}</p>`,
        '🔐 Changer mon mot de passe',
        `${process.env.FRONTEND_URL || 'http://localhost:13000'}/admin/forgot-password`,
        'La sécurité de votre compte est importante.'
    );

    await sendEmail(to, subject, htmlContent);
};