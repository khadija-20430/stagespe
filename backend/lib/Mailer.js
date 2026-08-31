const nodemailer = require('nodemailer');

// Configure ces variables dans ton .env :
// SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS, SMTP_FROM
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true pour le port 465, false pour les autres
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// textTemplate peut contenir {{code}} et {{minutes}}, remplacés ici avant l'envoi.
// Ce template vient des réglages en base (app_settings), modifiables depuis le panneau super admin.
exports.sendResetCodeEmail = async(to, code, minutes, subject, textTemplate) => {
    const text = textTemplate
        .replace(/{{code}}/g, code)
        .replace(/{{minutes}}/g, minutes);

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    });
};