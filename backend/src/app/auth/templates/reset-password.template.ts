import { env } from '../../../lib/config/env';

export function passwordResetEmail(name: string, email: string, otp: string) {
    const subject = 'Help Me Decide — Password Reset OTP & Verification Link';
    const redirectLink = `${env.frontendUrl}/auth/verify-otp?email=${encodeURIComponent(email)}`;

    const template = `
    <html>
    <body style="font-family: 'Inter', Arial, sans-serif; background-color: #070a13; color: #f8fafc; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #0c1225; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
        <h2 style="margin-top: 0; color: #10b981;">Help Me Decide — Password Reset</h2>
        <table style="width: 100%; font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
          <tr><td><strong>To:</strong> ${email}</td></tr>
          <tr><td><strong>Subject:</strong> ${subject}</td></tr>
          <tr><td><strong>Date:</strong> ${new Date().toUTCString()}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
        <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">We received a request to reset your password for <strong>Help Me Decide</strong>.</p>
        <p style="font-size: 15px; line-height: 1.6;">Your 6-digit verification OTP (valid for <strong>10 minutes</strong>) is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 14px 28px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; color: #10b981;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Click the button below to open the OTP verification page and enter your code:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${redirectLink}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: #060c18; font-weight: 700; text-decoration: none; border-radius: 10px;">
            Verify OTP &amp; Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; word-break: break-all;">Or copy and paste this link into your browser:<br/><a href="${redirectLink}" style="color: #3b82f6;">${redirectLink}</a></p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
    `;

    return {
        to: email,
        subject,
        body: template,
        redirectLink,
    };
}

