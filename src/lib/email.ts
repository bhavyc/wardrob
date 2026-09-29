import nodemailer from 'nodemailer';

const user = process.env.SMTP_USER || 'inwardrob@gmail.com';
const rawPass = process.env.SMTP_PASS || 'yfxa mrij qofl ubwc';
// Remove any accidental spaces in the app password
const pass = rawPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user,
    pass,
  },
});

export interface PasswordResetEmailOptions {
  to: string;
  resetUrl?: string;
  resetCode: string;
  userName?: string;
}

/**
 * Sends a high-end luxury branded password reset email via Gmail SMTP
 */
export async function sendPasswordResetEmail({
  to,
  resetCode,
  userName = 'Valued Member',
}: PasswordResetEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromAddress = process.env.EMAIL_FROM || `Wardrob Luxury <${user}>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Wardrob Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 40px 20px; color: #1E1E2D; }
    .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #ECE4DA; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
    .header { background: #151522; padding: 36px 30px; text-align: center; }
    .header-logo { font-size: 26px; font-weight: 800; letter-spacing: 0.15em; color: #FAF7F2; text-transform: uppercase; margin: 0; }
    .header-sub { font-size: 11px; letter-spacing: 0.2em; color: #C5A880; text-transform: uppercase; margin-top: 6px; font-weight: 600; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1E1E2D; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.65; color: #4B4B5C; margin-bottom: 24px; }
    .code-box { background: #FAF7F2; border: 1.5px dashed #D4567A; border-radius: 14px; padding: 24px 20px; text-align: center; margin: 24px 0; }
    .code-label { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #9A7B56; margin-bottom: 8px; }
    .code-digits { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #D4567A; font-family: 'Courier New', Courier, monospace; }
    .expiry { font-size: 12px; color: #8C8C9A; text-align: center; margin-top: 14px; }
    .footer { background: #FAF8F5; padding: 24px 30px; text-align: center; font-size: 11.5px; color: #9B9BA6; border-top: 1px solid #ECE4DA; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">W A R D R O B</div>
      <div class="header-sub">Haute Couture &amp; Designer Vault</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <div class="text">
        We received a request to reset your Wardrob account password. Please enter the secure 6-digit verification code below to set your new password.
      </div>
      
      <div class="code-box">
        <div class="code-label">Secure Verification Code</div>
        <div class="code-digits">${resetCode}</div>
      </div>

      <div class="expiry">
        ⏱ This verification code will expire in <strong>15 minutes</strong>.
      </div>
      <div class="text" style="margin-top: 24px; font-size: 12.5px; color: #737380;">
        If you did not request a password reset, please disregard this email. Your Wardrob account remains completely safe and secure.
      </div>
    </div>
    <div class="footer">
      Wardrob Central Logistics &amp; Security Vault<br/>
      Sent securely from <a href="mailto:${user}" style="color: #9A7B56; text-decoration: none;">${user}</a>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `[Wardrob] Password Reset Code: ${resetCode}`,
      text: `Hello ${userName},\n\nYour Wardrob password reset verification code is: ${resetCode}\n\nThis verification code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });

    console.log(`[SMTP SUCCESS] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[SMTP ERROR] Failed to send email via Gmail SMTP:', err);
    return { success: false, error: err.message || 'SMTP delivery failure' };
  }
}
