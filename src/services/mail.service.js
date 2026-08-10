const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;
  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in Beverage-backend/.env",
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function getFromAddress() {
  return (
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    "beverageacademy63@gmail.com"
  );
}

async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  const transporter = getTransporter();
  const name = fullName ? String(fullName).split(" ")[0] : "there";
  const from = getFromAddress();

  await transporter.sendMail({
    from: `"The Beverage Vault" <${from}>`,
    to,
    subject: "Reset your Beverage Vault password",
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your Beverage Vault password.",
      "Open this link to choose a new password (valid for 1 hour):",
      resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
      "",
      "— The Beverage Vault",
    ].join("\n"),
    html: `
      <div style="font-family:Georgia,serif;background:#121314;color:#E8E0D4;padding:32px 24px;">
        <div style="max-width:480px;margin:0 auto;border:1px solid rgba(212,165,116,0.35);padding:28px 24px;">
          <p style="margin:0 0 8px;letter-spacing:0.2em;font-size:11px;color:#D4A574;text-transform:uppercase;">The Beverage Vault</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#D4A574;letter-spacing:0.08em;text-transform:uppercase;">Reset Password</h1>
          <p style="margin:0 0 16px;line-height:1.6;font-size:15px;">Hi ${name},</p>
          <p style="margin:0 0 24px;line-height:1.6;font-size:15px;">
            We received a request to reset your password. Click the button below to choose a new one.
            This link expires in <strong style="color:#D4A574;">1 hour</strong>.
          </p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${resetUrl}"
               style="display:inline-block;background:#B87333;color:#121314;text-decoration:none;padding:14px 28px;letter-spacing:0.14em;font-size:12px;text-transform:uppercase;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#A89F90;">
            Or paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color:#D4A574;word-break:break-all;">${resetUrl}</a>
          </p>
          <p style="margin:24px 0 0;font-size:12px;color:#A89F90;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
